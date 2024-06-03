import { useAppSelector } from '@/app/hooks';
import { selectSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scene } from 'three';
import { STLExporter } from 'three/examples/jsm/Addons.js';
import { Inputs } from '@bitbybit-dev/occt';
import { addShapeToScene } from './occt_visualize';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const { scene, gl, camera } = useThree();

  const sketchToExtrude = useAppSelector(selectSketchToExtrude);

  const firstRenderRef = useRef(true);

  useEffect(() => {
    console.log('occt root init ...', firstRenderRef);
    /*
    if (process.env.REACT_APP_ENVIRONMENT !== 'production' && firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    */
    init();
  }, []);

  //const [vase, setVase] = useState<Inputs.OCCT.TopoDSShapePointer>();
  //const [group, setGroup] = useState<THREE.Group>();

  const init = async () => {
    console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
    await bitbybit.init(occt);
    console.log('bitbybit.init(occt) finished');

    const animation = (time: number) => {
      gl.render(scene, camera);
      //controls.update();
    };

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        //await createVaseByLoft(bitbybit, scene);
        gl.setAnimationLoop(animation);
        console.log('Occt init completed');
        // TODO here some static things to display may be created
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  return <></>;
};

export default OcctRoot;
