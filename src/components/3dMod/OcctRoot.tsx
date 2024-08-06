/** This component is the root for (bitbybit) occt. Main entry point for 3D modelling operations. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addOrRemoveSelectedShapeId,
  clearSelectedShapeIds,
  ModellingToolStateEnum,
  selectDeletedSketchId,
  selectModellingToolState,
  selectSelectedShapeIds,
  selectSketchToExtrude,
  selectUpdatedSketchId,
  setDeletedSketchId,
  setSketchToExtrude,
  setUpdatedSketchId,
} from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { selectSketchs } from '@/app/slices/sketchSlice';
import { SketchCyclesOcctContainer, patchSketchCycleContainer } from '@/utils/algo3d-occ';
import SketchCycleObjectNg from './SketchCycleObjectNg';
import R3fHtmlInput from '../Utils/R3fHtmlInput';
import { createGeom3d, createUnion, select3dGeometries } from '@/app/slices/geom3dSlice';
import { Geometry3DType } from '@/app/types/Geometry3DType';
import Occt3dGeometryVisualizer from './Occt3dGeometryVisualizer';
import { SketchShapeLabelingGraphNode } from '@/utils/algo3d';
import { selectStateGraphs, setStateGraph } from '@/app/slices/graphGeom2dSlice';
import { createGeom3dShapes, createSketchCycleContainers, occ_init } from '@/utils/occ_utils';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const dispatch = useAppDispatch();
  const sketchs = useAppSelector(selectSketchs);
  const [sketchCycleOcctContainers, setSketchCycleOcctContainers] = useState<SketchCyclesOcctContainer[]>([]);
  const geometries3d = useAppSelector(select3dGeometries);
  const [shapes3d, setShapes3d] = useState<Geometry3DType[]>([]);
  const selectedShapeIds = useAppSelector(selectSelectedShapeIds);

  const [sketchToExtrude, labelOfCycle] = useAppSelector(selectSketchToExtrude);
  const graphGeom2dStateGraphs = useAppSelector(selectStateGraphs);
  const toolState = useAppSelector(selectModellingToolState);

  const updatedSketchId = useAppSelector(selectUpdatedSketchId);
  const deletedSketchId = useAppSelector(selectDeletedSketchId);

  // ---

  const sketchShapes = useMemo(() => {
    return sketchCycleOcctContainers.map((container) => container.cycles).flat(1);
  }, [sketchCycleOcctContainers]);

  const shapeToExtrude = sketchShapes.filter(
    (shape) => shape.sketch.id === sketchToExtrude && shape.label === labelOfCycle
  );

  // ---

  // Note: Currently the init() needs to be re called when coming back from Sketcher
  // Most likely this is because this component needs to be mounted again
  useEffect(() => {
    console.log('Initializing occt ...');
    const [occt, newBitBybit] = occ_init(onOcctInitialized);
    setBitbybit(newBitBybit);

    // we need to terminate the worker thread else there are more and more threads
    return () => occt.terminate();
    // The onOcctInitialized() callback function causes a react-hooks/exhaustive-deps warning,
    // however we only want to run this effect only on component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note: This useEffect is needed if f.e. a sketch is deleted so it can also be removed from display
  //       (needs an updated of sketchShapes list).
  useEffect(() => {
    if (deletedSketchId === -1 || !bitbybit) {
      return;
    }

    let active = true;
    cleanup();
    return () => {
      active = false;
    };

    async function cleanup() {
      if (!active || !bitbybit) {
        return;
      }

      //console.log('---useEffect sketchs', bitbybit);
      const sketchIds = Object.keys(sketchs).map((key) => Number(key));
      const sketchContainersFiltered = sketchCycleOcctContainers.filter((container) =>
        sketchIds.includes(container.cycles[0].sketch.id)
      );
      //console.log('sketchShapesFiltered', sketchShapesFiltered);

      const containersToRemove = sketchCycleOcctContainers.filter(
        (container) => !sketchIds.includes(container.cycles[0].sketch.id)
      );

      if (active) {
        await bitbybit.occt.deleteShapes({
          shapes: containersToRemove.map((container) => container.cycles.map((cycle) => cycle.occtFace)).flat(1),
        });
        setSketchCycleOcctContainers(sketchContainersFiltered);
        dispatch(setDeletedSketchId(-1));
      }
    }
  }, [sketchs, deletedSketchId, bitbybit, sketchCycleOcctContainers, dispatch]);

  useEffect(() => {
    let active = true;

    async function doWork() {
      if (!active || !bitbybit || sketchShapes.length === 0) {
        return;
      }
      const finalShapes = await createGeom3dShapes(bitbybit, dispatch, sketchShapes, geometries3d);
      if (active) {
        setShapes3d(finalShapes);
      }
    }

    doWork();
    return () => {
      active = false;
    };
  }, [bitbybit, sketchShapes, geometries3d, dispatch]);

  useEffect(() => {
    //console.log('Calling the UNION creation useEffect.');
    if (ModellingToolStateEnum.UNION === toolState) {
      if (selectedShapeIds.length >= 2) {
        // Note: this only allows two shapes to be part of the union
        dispatch(createUnion({ geometries: selectedShapeIds }));
        dispatch(clearSelectedShapeIds());
      }
    }
  }, [selectedShapeIds, toolState, dispatch]);

  // Handles the update of the plane offset of a sketch.
  // In this case the affected SketchCyclesOcctContainer needs to be patched.
  // This function implements the proper interaction with async data using an ignore flag:
  //   https://react.dev/learn/you-might-not-need-an-effect#fetching-data
  //   #147 of the following article:
  //   https://sebastiancarlos.com/react-js-best-practices-from-the-new-docs-1c65570e785d
  useEffect(() => {
    let ignore = false;
    if (updatedSketchId === -1 || !bitbybit) {
      return;
    }

    //console.log('---updatedSketchId', updatedSketchId);

    const sketch = sketchs[updatedSketchId];
    const containerToPatch = sketchCycleOcctContainers.filter(
      (container) => container.cycles[0].sketch.id === sketch.id
    );
    if (containerToPatch.length > 0) {
      const otherContainers = sketchCycleOcctContainers.filter(
        (container) => container.cycles[0].sketch.id !== sketch.id
      );
      if (containerToPatch.length > 1) {
        console.warn('There should be only a single container per sketch');
      }
      const patchContainer = async () => {
        const patchedSketchCycleContainer = await patchSketchCycleContainer(sketch, bitbybit, containerToPatch[0]);
        if (!ignore) {
          setSketchCycleOcctContainers([...otherContainers, patchedSketchCycleContainer]);
          dispatch(setUpdatedSketchId(-1));
        }
      };
      patchContainer();
    }

    return () => {
      ignore = true;
    };
  }, [updatedSketchId, dispatch, bitbybit, sketchCycleOcctContainers, sketchs]);

  // ---

  /** Save the state graph for sketch shape labeling to redux */
  const saveGraphGeom2dToRedux = useCallback(
    (sketchId: number, nodes: SketchShapeLabelingGraphNode[], adjacencyList: number[][]): void => {
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
    },
    [dispatch]
  );

  /** Callback to be called when occt has been initialized. */
  const onOcctInitialized = useCallback(
    async (bitbybit: BitByBitOCCT) => {
      // Launch the function converting Sketches to be visualized in 3D
      const sketchCycleContainers = await createSketchCycleContainers(
        bitbybit,
        sketchs,
        saveGraphGeom2dToRedux,
        graphGeom2dStateGraphs
      );
      setSketchCycleOcctContainers(sketchCycleContainers);
      // disabled the animation loop because it make f.e. the GizmoHelper disappear
      //gl.setAnimationLoop(animation);
      console.log('Occt init completed');
    },
    [graphGeom2dStateGraphs, saveGraphGeom2dToRedux, sketchs]
  );

  // ---

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

  /** Callback to be called when a 3d shape was clicked. */
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
