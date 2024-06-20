import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectSketchToExtrude, setSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { selectSketchs } from '@/app/slices/sketchSlice';
import { SketchCycleType, findCyclesInSketchAndConvertToOcct } from '@/utils/algo3d';
import useKeyboard from '@/utils/useKeyboard';
import SketchCycleObjectNg from './SketchCycleObjectNg';
import R3fHtmlInput from '../Utils/R3fHtmlInput';
import { Inputs } from '@bitbybit-dev/occt';
import { getNormalVectorForPlane } from '@/utils/threejs_planes';
import { SketchType } from '@/app/slices/Sketch';
import { STLExporter } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const { scene, gl, camera } = useThree();

  const dispatch = useAppDispatch();
  const sketchs = useAppSelector(selectSketchs);
  const [sketchToExtrude, cycleIndex] = useAppSelector(selectSketchToExtrude);
  const [sketchShapes, setSketchShapes] = useState<SketchCycleType[]>([]);
  const shapeToExtrude = sketchShapes.filter(
    (shape) => shape.sketch.id === sketchToExtrude && shape.index === cycleIndex
  );

  // keyboard events
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

  // Note: Currently the init() needs to be re called when coming back from Sketcher
  // Most likely this is because this component needs to be mounted again
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    createSketchShapes(bitbybit);
  }, [sketchs]);

  const createSketchShapes = async (bitbybit?: BitByBitOCCT) => {
    if (!bitbybit) {
      return;
    }

    /*
    // Disabled this since it created issues on rerender, e.g.
    // after deleting a sketch
    // Occt lib occassionally behaves a bit strange ...
    if (sketchShapes.length > 0) {
      console.log('Deleting previous sketchShapes');
      await bitbybit.occt.deleteShapes({
        shapes: sketchShapes.map((sketchCycle) => sketchCycle.face),
      });
    }
    */

    const shapes: SketchCycleType[] = [];
    const allSketchs = Object.entries(sketchs).map(([key, value]) => value);
    for (const sketch of allSketchs) {
      const sketchCycle = await findCyclesInSketchAndConvertToOcct(sketch, bitbybit);
      //console.log('faces', faces, faces.length);
      shapes.push(...sketchCycle);
    }

    //console.log('newGroups', newGroups);
    //console.log('shapes', shapes);

    setSketchShapes(shapes);
  };

  const init = async () => {
    //console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
    await bitbybit.init(occt);
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

        // TODO here some static things to display may be created
        //    e.g. small rotation gizmo cube at top right, e.g.
        //         to display camera orientation and change it to look at plane
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  //console.log('[OcctRoot] sketchShapes', sketchShapes);

  // just for debug
  if (shapeToExtrude.length > 0) {
    console.log('shapeToExtrude', shapeToExtrude);
  }

  const extrudeSketch = async (face: Inputs.OCCT.TopoDSFacePointer, sketch: SketchType, length: number) => {
    if (!bitbybit) {
      return;
    }

    const directionVectNumbers = getNormalVectorForPlane(sketch.plane);
    const directionVect = new THREE.Vector3(directionVectNumbers[0], directionVectNumbers[1], directionVectNumbers[2]);
    directionVect.setLength(length);

    const extrude = await bitbybit.occt.operations.extrude({
      shape: face,
      direction: [directionVect.x, directionVect.y, directionVect.z],
    });
    console.log(extrude);

    await downloadStep(extrude);
  };

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

  return (
    <>
      {bitbybit &&
        sketchShapes.map((sketchCycle, index) => (
          <SketchCycleObjectNg key={sketchCycle.face.hash} sketchCycle={sketchCycle} />
        ))}

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
                  return;
                }

                // do the work
                console.log('extruding sketch by', value);
                await extrudeSketch(shapeToExtrude[0].face, shapeToExtrude[0].sketch, value);

                dispatch(setSketchToExtrude([-1, -1]));
              }
            },
          }}
        />
      )}
    </>
  );
};

export default OcctRoot;
