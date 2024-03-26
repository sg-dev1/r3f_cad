'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';

const MainView = () => {
  const cameraControlsRef = useRef<CameraControls>(null);

  const fov = 60;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 10;

  return (
    <>
      <Canvas camera={{ fov, aspect, near, far }} className="mainview">
        <CameraControls minDistance={1.2} maxDistance={4} ref={cameraControlsRef} />
        <ambientLight intensity={2} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color={0xff0000} />
        </mesh>
      </Canvas>
    </>
  );
};

export default MainView;
