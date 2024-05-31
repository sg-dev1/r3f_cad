'use client';

import React from 'react';
import { Button, Layout } from 'antd';
import OcTest from './OcTest';
import { createSketch, selectActiveSketchId } from '@/app/slices/sketchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import OcctWorkerTest from './OcctWorkerTest';

const { Header, Content } = Layout;

const MainView = () => {
  //const activeSketchId = useAppSelector(selectActiveSketchId);
  const dispatch = useAppDispatch();
  // const cameraControlsRef = useRef<CameraControls>(null);

  // const fov = 60;
  // const aspect = 2; // the canvas default
  // const near = 0.1;
  // const far = 10;

  const onCreateNewSketch = () => {
    dispatch(createSketch());
  };

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="primary" className="primary-button" onClick={() => onCreateNewSketch()}>
            Create new Sketch
          </Button>
        </Header>

        <Content style={{ padding: '10px 24px 24px', backgroundColor: 'slategray' }}>
          {/* <OcTest /> */}
          <OcctWorkerTest />
        </Content>
      </Layout>

      {/* <Canvas camera={{ fov, aspect, near, far }} className="mainview">
        <CameraControls minDistance={1.2} maxDistance={4} ref={cameraControlsRef} />
        <ambientLight intensity={2} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color={0xff0000} />
        </mesh>
      </Canvas> */}
    </>
  );
};

export default MainView;
