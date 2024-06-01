//
// Test component based on code found at
// https://github.com/bitbybit-dev/app-examples/tree/main/react/bitbybit-threejs/src
//
'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import log from '../../utils/log_utils';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { Group, Scene } from 'three';
import { OrbitControls, STLExporter } from 'three/examples/jsm/Addons.js';
import { Button, Flex, Slider, Spin } from 'antd';
import { addShapeToScene } from './occt_visualize';

console.log = log;

const OcctWorkerTest = () => {
  const [addRadiusWide, setAddRadiusWide] = useState<number>(0);
  const [addRadiusNarrow, setAddRadiusNarrow] = useState<number>(0);
  const [addTopHeight, setAddTopHeight] = useState<number>(0);
  const [addMiddleHeight, setAddMiddleHeight] = useState<number>(0);

  const [scene, setScene] = useState<Scene>();
  const [group, setGroup] = useState<Group>();

  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();
  const [vase, setVase] = useState<Inputs.OCCT.TopoDSShapePointer>();

  const [showSpinner, setShowSpinner] = useState<boolean>(true);

  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (process.env.REACT_APP_ENVIRONMENT !== 'production' && firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    init();
  }, []);

  const createVaseByLoft = async (bitbybit?: BitByBitOCCT, scene?: Scene) => {
    if (scene && bitbybit) {
      if (vase) {
        // delete previous
        await bitbybit.occt.deleteShape({ shape: vase });
      }

      const wire1 = await bitbybit.occt.shapes.wire.createCircleWire({
        radius: 10 + addRadiusNarrow,
        center: [0, 0, 0],
        direction: [0, 1, 0],
      });
      const wire2 = await bitbybit.occt.shapes.wire.createEllipseWire({
        radiusMinor: 20 + addRadiusWide,
        radiusMajor: 25 + addRadiusWide,
        center: [0, 20 + addMiddleHeight, 0],
        direction: [0, 1, 0],
      });
      const wire3 = await bitbybit.occt.shapes.wire.createCircleWire({
        radius: 10 + addRadiusNarrow,
        center: [0, 30 + addMiddleHeight, 0],
        direction: [0, 1, 0],
      });
      const wire4 = await bitbybit.occt.shapes.wire.createCircleWire({
        radius: 15 + addRadiusWide,
        center: [0, 40 + addMiddleHeight + addTopHeight, 0],
        direction: [0, 1, 0.1],
      });
      const lAdvOpt = new Inputs.OCCT.LoftAdvancedDto([wire1, wire2, wire3, wire4]);
      const loft = await bitbybit.occt.operations.loftAdvanced(lAdvOpt);
      const loftFace = await bitbybit.occt.shapes.face.getFace({ shape: loft, index: 0 });
      const baseFace = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire1, planar: true });
      const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [loftFace, baseFace], tolerance: 1e-7 });
      const fillet = await bitbybit.occt.fillets.filletEdges({ shape: shell, radius: 10 });
      const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: fillet, offset: -2 });
      const finalVase = await bitbybit.occt.fillets.chamferEdges({ shape: thick, distance: 0.3 });

      const group = await addShapeToScene(bitbybit, finalVase, scene, 0.05);

      await bitbybit.occt.deleteShapes({
        shapes: [wire1, wire2, wire3, wire4, loft, loftFace, baseFace, shell, fillet, thick],
      });

      setGroup(group);
      setVase(finalVase);
    }
  };

  const downloadStep = () => {
    if (bitbybit && vase) {
      bitbybit.occt.io.saveShapeSTEP({
        shape: vase,
        fileName: 'vase.stp',
        adjustYtoZ: true,
      });
    }
  };

  const downloadSTL = () => {
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

  const updateVase = async () => {
    setShowSpinner(true);
    group?.traverse((obj) => {
      scene?.remove(obj);
    });
    await createVaseByLoft(bitbybit, scene);
    setShowSpinner(false);
  };

  useEffect(() => {
    if (scene && bitbybit) {
      updateVase();
    }
  }, [addRadiusWide, addRadiusNarrow, addTopHeight, addMiddleHeight]);

  const init = async () => {
    console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
    await bitbybit.init(occt);
    console.log('bitbybit.init(occt) finished');

    const animation = (time: number) => {
      gl.render(scene, camera);
      controls.update();
    };

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);

    let scene = new THREE.Scene();
    setScene(scene);
    const gl = new THREE.WebGLRenderer({ antialias: true });
    gl.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(gl.domElement);

    const controls = new OrbitControls(camera, gl.domElement);
    camera.position.set(30, 50, 50);

    controls.update();
    controls.target = new THREE.Vector3(0, 20, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.zoomSpeed = 0.1;

    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      gl.setSize(window.innerWidth, window.innerHeight);
    }
    gl.setClearColor(new THREE.Color(0x000000), 1);

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        await createVaseByLoft(bitbybit, scene);
        gl.setAnimationLoop(animation);
        setShowSpinner(false);
        console.log('Occt init completed');
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  return (
    <>
      <div>Adjust wide radius:</div>
      <Slider
        disabled={showSpinner}
        defaultValue={0}
        min={-5}
        max={5}
        step={0.0001}
        onChangeComplete={(value) => {
          setAddRadiusWide(value);
        }}
      />

      <div>Adjust narrow radius:</div>
      <Slider
        disabled={showSpinner}
        defaultValue={0}
        min={-2}
        max={7}
        step={0.0001}
        onChangeComplete={(value) => {
          setAddRadiusNarrow(value);
        }}
      />

      <div>Adjust middle height:</div>
      <Slider
        disabled={showSpinner}
        defaultValue={0}
        min={0}
        max={5}
        step={0.0001}
        onChangeComplete={(value) => {
          setAddMiddleHeight(value);
        }}
      />

      <div>Adjust top height:</div>
      <Slider
        disabled={showSpinner}
        defaultValue={0}
        min={0}
        max={10}
        step={0.0001}
        onChangeComplete={(value) => {
          setAddTopHeight(value);
        }}
      />

      <Flex gap="small" vertical>
        <Flex>
          <Button disabled={showSpinner} type="primary" className="primary-button" onClick={() => downloadSTL()}>
            Download STL
          </Button>
          <Button disabled={showSpinner} type="primary" className="primary-button" onClick={() => downloadStep()}>
            Download Step
          </Button>
        </Flex>

        {showSpinner && <Spin size="large" />}
      </Flex>
    </>
  );
};

export default OcctWorkerTest;
