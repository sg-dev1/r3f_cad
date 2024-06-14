import { useAppSelector } from '@/app/hooks';
import { selectSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/Addons.js';
import { Inputs } from '@bitbybit-dev/occt';
import { addShapeToScene } from './occt_visualize';
import { selectSketchs } from '@/app/slices/sketchSlice';
import { SketchCycleType, findCyclesInSketchAndConvertToOcct } from '@/utils/algo3d';
import SketchCycleObject from './SketchCycleObject';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const { scene, gl, camera } = useThree();

  const sketchs = useAppSelector(selectSketchs);
  const sketchToExtrude = useAppSelector(selectSketchToExtrude);

  const [sketchShapes, setSketchShapes] = useState<SketchCycleType[]>([]);

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
    const newGroups: THREE.Group[] = [];
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

    const animation = (time: number) => {
      gl.render(scene, camera);
      //controls.update();
    };

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        // Launch the function converting Sketches to be visualized in 3D
        await createSketchShapes(bitbybit);
        gl.setAnimationLoop(animation);
        console.log('Occt init completed');

        // TODO here some static things to display may be created
        //    e.g. small rotation gizmo cube at top right, e.g.
        //         to display camera orientation and change it to look at plane
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  console.log('[OcctRoot] sketchShapes', sketchShapes);

  return (
    <>
      {bitbybit &&
        sketchShapes.map((sketchCycle) => (
          <SketchCycleObject key={sketchCycle.face.hash} sketchCycle={sketchCycle} bitbybit={bitbybit} />
        ))}
    </>
  );
};

export default OcctRoot;
