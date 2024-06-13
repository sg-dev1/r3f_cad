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
import { findCyclesInSketchAndConvertToOcct } from '@/utils/algo3d';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const { scene, gl, camera } = useThree();

  const sketchs = useAppSelector(selectSketchs);
  const sketchToExtrude = useAppSelector(selectSketchToExtrude);

  const [groups, setGroups] = useState<THREE.Group[]>([]);
  const [sketchShapes, setSketchShapes] = useState<Inputs.OCCT.TopoDSShapePointer[]>([]);

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

    if (sketchShapes.length > 0) {
      console.log('Deleting previous sketchShapes');
      await bitbybit.occt.deleteShapes({
        shapes: sketchShapes,
      });
    }

    if (groups.length > 0) {
      console.log('Deleting previous groups');
      groups.forEach((group) =>
        group.traverse((obj) => {
          scene.remove(obj);
        })
      );
    }

    const shapes: Inputs.OCCT.TopoDSShapePointer[] = [];
    const newGroups: THREE.Group[] = [];
    const allSketchs = Object.entries(sketchs).map(([key, value]) => value);
    for (const sketch of allSketchs) {
      const faces = await findCyclesInSketchAndConvertToOcct(sketch, bitbybit);

      //console.log('faces', faces, faces.length);

      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        //console.log('add to scene', face);
        const group = await addShapeToScene(bitbybit, face, scene, 0.05);
        newGroups.push(group);
      }

      shapes.push(...faces);
    }

    console.log('newGroups', newGroups);
    console.log('shapes', shapes);

    setGroups(newGroups);
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

  console.log('[OcctRoot] groups', groups);
  console.log('[OcctRoot] sketchShapes', sketchShapes);

  return <></>;
};

export default OcctRoot;
