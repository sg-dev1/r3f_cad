/** This component is the root for (bitbybit) occt. Main entry point for 3D modelling operations. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addOrRemoveSelectedShapeId,
  clearSelectedShapeIds,
  ModellingToolStateEnum,
  selectModellingToolState,
  selectSelectedShapeIds,
  selectSketchToExtrude,
  setSketchToExtrude,
} from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { selectSketchs } from '@/app/slices/sketchSlice';
import { SketchCyclesOcctContainer, findCyclesInSketchAndConvertToOcct } from '@/utils/algo3d-occ';
import useKeyboard from '@/utils/useKeyboard';
import SketchCycleObjectNg from './SketchCycleObjectNg';
import R3fHtmlInput from '../Utils/R3fHtmlInput';
import { Inputs } from '@bitbybit-dev/occt';
import { getNormalVectorForPlane } from '@/utils/threejs_planes';
import { SketchType } from '@/app/slices/Sketch';
import { STLExporter } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three';
import { createGeom3d, createUnion, removeGeometries, select3dGeometries } from '@/app/slices/geom3dSlice';
import { Geometry3DType } from '@/app/types/Geometry3DType';
import Occt3dGeometryVisualizer from './Occt3dGeometryVisualizer';
import { SketchShapeLabelingGraphNode } from '@/utils/algo3d';
import { selectStateGraphs, setStateGraph } from '@/app/slices/graphGeom2dSlice';
import { ModellingOperation, ModellingOperationType } from '@/app/slices/geom3d';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const firstRender = useRef(true);
  const dispatch = useAppDispatch();
  const sketchs = useAppSelector(selectSketchs);
  const [sketchCycleOcctContainers, setSketchCycleOcctContainers] = useState<SketchCyclesOcctContainer[]>([]);
  const geometries3d = useAppSelector(select3dGeometries);
  const [shapes3d, setShapes3d] = useState<Geometry3DType[]>([]);
  const selectedShapeIds = useAppSelector(selectSelectedShapeIds);

  const [sketchToExtrude, labelOfCycle] = useAppSelector(selectSketchToExtrude);
  const graphGeom2dStateGraphs = useAppSelector(selectStateGraphs);
  const toolState = useAppSelector(selectModellingToolState);

  // ---

  const sketchShapes = useMemo(() => {
    return sketchCycleOcctContainers.map((container) => container.cycles).flat(1);
  }, [sketchCycleOcctContainers]);

  const shapeToExtrude = sketchShapes.filter(
    (shape) => shape.sketch.id === sketchToExtrude && shape.label === labelOfCycle
  );

  /*
  const {gl} = useThree()
  useEffect(() => {gl}, [gl])
  */

  // keyboard events
  /* old hidding functionality - quick and dirty using number keys (no longer supported)
  const keyMap = useKeyboard();
  useEffect(() => {
    if (shapeToExtrude.length > 0) {
      // do nothing while entering values for extrude
      return;
    }

    //console.log(keyMap);
    // quick and dirty hack to enable/disable shapes
    // mainly for debug  purpose
    if (keyMap['Digit1'] === true) {
      if (sketchShapes.length > 0) {
        sketchShapes[0].isHidden = !sketchShapes[0].isHidden;
      }
    } else if (keyMap['Digit2'] === true) {
      if (sketchShapes.length > 1) {
        sketchShapes[1].isHidden = !sketchShapes[1].isHidden;
      }
    } else if (keyMap['Digit3'] === true) {
      if (sketchShapes.length > 2) {
        sketchShapes[2].isHidden = !sketchShapes[2].isHidden;
      }
    } else if (keyMap['Digit4'] === true) {
      if (sketchShapes.length > 3) {
        sketchShapes[3].isHidden = !sketchShapes[3].isHidden;
      }
    } else if (keyMap['Digit5'] === true) {
      if (sketchShapes.length > 4) {
        sketchShapes[4].isHidden = !sketchShapes[4].isHidden;
      }
    } else if (keyMap['Digit6'] === true) {
      if (sketchShapes.length > 5) {
        sketchShapes[5].isHidden = !sketchShapes[5].isHidden;
      }
    } else if (keyMap['Digit7'] === true) {
      if (sketchShapes.length > 6) {
        sketchShapes[6].isHidden = !sketchShapes[6].isHidden;
      }
    } else if (keyMap['Digit8'] === true) {
      if (sketchShapes.length > 7) {
        sketchShapes[7].isHidden = !sketchShapes[7].isHidden;
      }
    } else if (keyMap['Digit9'] === true) {
      if (sketchShapes.length > 8) {
        sketchShapes[8].isHidden = !sketchShapes[8].isHidden;
      }
    }
  }, [keyMap]);
  */

  // Note: Currently the init() needs to be re called when coming back from Sketcher
  // Most likely this is because this component needs to be mounted again
  useEffect(() => {
    console.log('---bitbybit', bitbybit);
    console.log('---sketchShapes', sketchCycleOcctContainers);
    const occt = init();

    // we need to terminate the worker thread else there are more and more threads
    return () => occt.terminate();
  }, []);

  // Note: This useEffect is needed if f.e. a sketch is deleted so it can also be removed from display
  //       (needs an updated of sketchShapes list).
  useEffect(() => {
    // skip this call on first render also no geometries are created because sketchShapes array
    // is empty
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    console.log('---useEffect sketchs', bitbybit);
    const sketchIds = Object.keys(sketchs).map((key) => Number(key));
    const sketchContainersFiltered = sketchCycleOcctContainers.filter((container) =>
      sketchIds.includes(container.cycles[0].sketch.id)
    );
    //console.log('sketchShapesFiltered', sketchShapesFiltered);
    setSketchCycleOcctContainers(sketchContainersFiltered);

    let active = true;
    //cleanup();
    return () => {
      active = false;
    };

    /* 2024-07-27: Disabled cleanup operations - caused issues accessing deleted objects
    async function cleanup() {
      if (!active) {
        return;
      }
      const containersToRemove = sketchCycleOcctContainers.filter((container) =>
        sketchIds.includes(container.cycles[0].sketch.id)
      );
      await bitbybit?.occt.deleteShapes({
        shapes: containersToRemove.map((container) => container.cycles.map((cycle) => cycle.occtFace)).flat(1),
      });
    }
    */
  }, [sketchs]);

  useEffect(() => {
    createGeom3dShapes(bitbybit);
  }, [sketchCycleOcctContainers, geometries3d]);

  useEffect(() => {
    if (ModellingToolStateEnum.UNION === toolState) {
      if (selectedShapeIds.length >= 2) {
        // Note: this only allows two shapes to be part of the union
        dispatch(createUnion({ geometries: selectedShapeIds }));
        dispatch(clearSelectedShapeIds());
      }
    }
  }, [selectedShapeIds]);

  // ---

  /** Save the state graph for sketch shape labeling to redux */
  const saveGraphGeom2dToRedux = (
    sketchId: number,
    nodes: SketchShapeLabelingGraphNode[],
    adjacencyList: number[][]
  ): void => {
    dispatch(
      setStateGraph({
        sketchId,
        graph: {
          nodes: nodes.map((node) => ({
            id: node.id,
            centroid: node.centroid,
            topLeftCorner: node.topLeftCorner,
            faceArea: node.area,
            label: node.label,
          })),
          adjacencyList: adjacencyList,
        },
      })
    );
  };

  /** Converts the sketchs from redux store to objects that can be displayed in 3D space.
   *  Output type is list of SketchCycleType.
   */
  const createSketchShapes = async (bitbybit?: BitByBitOCCT) => {
    if (!bitbybit) {
      return;
    }

    // Disabled this since it created issues on rerender, e.g.
    // after deleting a sketch
    // Occt lib occassionally behaves a bit strange ...
    // Update 2024-07-04: Enabled it again for now - handling of bitbybit needs to be improved any
    //   also find out if there are any memory leaks ...
    if (sketchCycleOcctContainers.length > 0) {
      console.log('Deleting previous sketchShapes ', sketchCycleOcctContainers);
      await bitbybit.occt.deleteShapes({
        shapes: sketchCycleOcctContainers.map((container) => container.cycles.map((cycle) => cycle.occtFace)).flat(1),
      });
    }

    const shapes: SketchCyclesOcctContainer[] = [];
    const allSketchs = Object.entries(sketchs).map(([key, value]) => value);
    for (const sketch of allSketchs) {
      const sketchCycleContainer = await findCyclesInSketchAndConvertToOcct(
        sketch,
        bitbybit,
        saveGraphGeom2dToRedux,
        graphGeom2dStateGraphs[sketch.id]
      );
      //console.log('---sketchCycleContainer', sketch.id, sketchCycleContainer);
      //console.log('faces', faces, faces.length);
      shapes.push(sketchCycleContainer);
    }

    //console.log('newGroups', newGroups);
    //console.log('shapes', shapes);

    setSketchCycleOcctContainers(shapes);
  };

  /** Converts 3D geometry from redux store (resulting from modelling operations) to objects
   *  that can be displayed in 3D space.
   *  Output type is list of Inputs.OCCT.TopoDSShapePointer.
   */
  const createGeom3dShapes = async (bitbybit?: BitByBitOCCT) => {
    if (!bitbybit) {
      return;
    }

    const finalShapes: Geometry3DType[] = [];
    const geomIdsToRemove: number[] = [];
    const allGeometries = Object.entries(geometries3d).map(([key, value]) => value);
    //console.log('allGeometries', allGeometries);
    for (const geom of allGeometries) {
      let prevShape: Inputs.OCCT.TopoDSShapePointer | null = null;
      for (let i = 0; i < geom.modellingOperations.length; i++) {
        const modellingOp = geom.modellingOperations[i];
        switch (modellingOp.type) {
          case ModellingOperationType.ADDITIVE_EXTRUDE:
            const extrudedShape = await findAndExtrudeSketch(modellingOp);
            if (extrudedShape) {
              prevShape = extrudedShape;
            }
            break;
          case ModellingOperationType.UNION:
            const unionShapes: Inputs.OCCT.TopoDSShapePointer[] = [];
            for (let j = 0; j < modellingOp.geometries.length; j++) {
              const subGeom = modellingOp.geometries[j];
              if (prevShape) {
                unionShapes.push(prevShape);
              }
              // apply operations to subgeom - for now we assume there is only one which was an extrude
              const extrudedShape = await findAndExtrudeSketch(subGeom.modellingOperations[0]);
              if (extrudedShape) {
                unionShapes.push(extrudedShape);
              }
            }
            const unionShape = await bitbybit.occt.booleans.union({ shapes: unionShapes, keepEdges: false });
            prevShape = unionShape;
            break;
          default:
            console.error('Not implemented for ModellingOperationType ', modellingOp.type);
        }
      }
      if (prevShape) {
        finalShapes.push({ geom3d: geom, occtShape: prevShape });
      } else {
        geomIdsToRemove.push(geom.id);
      }
    }

    //console.log('finalShapes', finalShapes);

    if (geomIdsToRemove.length > 0) {
      // clean up all "orphaned geometries" where the sketch was removed
      dispatch(removeGeometries({ ids: geomIdsToRemove }));
    }

    setShapes3d(finalShapes);
  };

  const init = () => {
    //console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
    bitbybit.init(occt);
    //console.log('bitbybit.init(occt) finished');

    /*
    const animation = (time: number) => {
      gl.render(scene, camera);
      //controls.update();
    };
    */

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        // Launch the function converting Sketches to be visualized in 3D
        await createSketchShapes(bitbybit);
        // disabled the animation loop because it make f.e. the GizmoHelper disappear
        //gl.setAnimationLoop(animation);
        console.log('Occt init completed');
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });

    return occt;
  };

  // ---

  /** Finds a sketch in sketchShapes and extrudes it using the information given
   *  by the (ADDITIVE_EXTRUDE) ModellingOperation.
   *  If the sketch could not be found, null is returned.
   */
  const findAndExtrudeSketch = async (
    modellingOp: ModellingOperation
  ): Promise<Inputs.OCCT.TopoDSShapePointer | null> => {
    const sketchShape = sketchShapes.filter(
      // only support one modelling operation
      (shape) => shape.sketch.id === modellingOp.sketchRef[0] && shape.label === modellingOp.sketchRef[1]
    );
    const length = modellingOp.distance;

    //console.log('modellingOp', modellingOp, 'sketchShape', sketchShape);

    if (sketchShape.length > 0) {
      return await extrudeSketch(sketchShape[0].occtFace, sketchShape[0].sketch, length);
    } else {
      console.warn('Sketchshape was undefined for modellingOp ', modellingOp);
      return null;
    }
  };

  /** Modelling operation that extrudes a sketch given by a 2D face the given length
   *  (may be negative --> 3D shape points into the opposite direction).
   */
  const extrudeSketch = async (
    face: Inputs.OCCT.TopoDSFacePointer,
    sketch: SketchType,
    length: number
  ): Promise<Inputs.OCCT.TopoDSShapePointer | null> => {
    if (!bitbybit) {
      return null;
    }

    const directionVectNumbers = getNormalVectorForPlane(sketch.plane);
    const directionVect = new THREE.Vector3(directionVectNumbers[0], directionVectNumbers[1], directionVectNumbers[2]);
    directionVect.setLength(length);

    //console.log('call extrude with shape', face);

    const extrude = await bitbybit.occt.operations.extrude({
      shape: face,
      direction: [directionVect.x, directionVect.y, directionVect.z],
    });

    /*
    const extrudeFace = await bitbybit.occt.shapes.face.getFace({ shape: extrude, index: 0 });
    const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [extrudeFace, face], tolerance: 1e-7 });
    const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: shell, offset: -0.01 });
    */
    //console.log(extrude);

    //await downloadStep(extrude);
    return extrude;
  };

  /** Provides functionality to download a given shape as STEP file. */
  const downloadStep = async (shape: Inputs.OCCT.TopoDSShapePointer) => {
    if (!bitbybit) {
      return;
    }

    await bitbybit.occt.io.saveShapeSTEP({
      shape: shape,
      fileName: 'shape.stp',
      adjustYtoZ: false,
      tryDownload: true,
    });
  };

  /*
  const downloadSTL = () => {
    // Need to use STLExporter from three.js
    // --> for that the obj needs to be rendered in the scene
    if (scene) {
      var exporter = new STLExporter();
      var str = exporter.parse(scene);
      var blob = new Blob([str], { type: 'text/plain' });
      var link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.href = URL.createObjectURL(blob);
      link.download = 'Scene.stl';
      link.click();
    }
  };
  */

  // ---

  const on3dShapeClicked = (shape: Geometry3DType) => {
    dispatch(addOrRemoveSelectedShapeId(shape.geom3d.id));
  };

  return (
    <>
      {bitbybit &&
        sketchCycleOcctContainers.map((sketchCycleContainer, index) => {
          return sketchCycleContainer.cycles.map((sketchCycle) => {
            return (
              <SketchCycleObjectNg
                key={sketchCycle.sketch.id + '-' + sketchCycle.index}
                sketchCycle={sketchCycle}
                sketchCycleMap={sketchCycleContainer.map}
              />
            );
          });
        })}

      {bitbybit && shapeToExtrude.length > 0 && (
        <R3fHtmlInput
          position={[0, 0, 0]}
          inputProps={{
            type: 'number',
            size: 5,
            onKeyDown: async (e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                //console.log('onKeyDown', e, input.value);
                const value = parseFloat(input.value);
                if (isNaN(value)) {
                  console.error('Value was Nan. Cannot add constraint');
                  input.value = '';
                  // make the input field disappear
                  dispatch(setSketchToExtrude([-1, '']));
                  return;
                }

                // Store the value of the extrude (e.g. the 3d model data) in redux,
                // visualization is done separately
                dispatch(createGeom3d({ sketchRef: [sketchToExtrude, labelOfCycle], distance: value }));

                dispatch(setSketchToExtrude([-1, '']));
              }
            },
          }}
        />
      )}

      {/* {bitbybit &&
        shapes3d.map((shape, index) => <TopoDSVisualizer key={index} bitbybitOcct={bitbybit} shape={shape} />)} */}
      {bitbybit &&
        shapes3d.map((shape, index) => (
          <Occt3dGeometryVisualizer
            key={index}
            bitbybitOcct={bitbybit}
            shape={shape}
            on3dShapeClicked={on3dShapeClicked}
          />
        ))}
    </>
  );
};

export default OcctRoot;
