'use client';

import React from 'react';
import { Button, Layout } from 'antd';
import { createSketch, selectActiveSketchId } from '@/app/slices/sketchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import OcctWorkerTest from './OcctWorkerTest';
import SketchTable from './SketchTable';
import OcctRoot from './OcctRoot';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const { Header, Content, Sider } = Layout;

const MainView = () => {
  //const activeSketchId = useAppSelector(selectActiveSketchId);
  const dispatch = useAppDispatch();
  // const cameraControlsRef = useRef<CameraControls>(null);

  const fov = 70;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 1000;

  const onCreateNewSketch = () => {
    // TODO when creating sketch on plane different than XY is implemented
    // the sketchCurrentPlane needs to be updated
    dispatch(createSketch('xy'));
  };

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', height: '7vh' }}>
          <Button type="primary" className="primary-button" onClick={() => onCreateNewSketch()}>
            Create new Sketch
          </Button>
        </Header>

        <Layout style={{ height: '93vh' }}>
          <Sider
            width={500}
            style={{
              overflow: 'auto',
              //height: '100vh',
              position: 'fixed',
              left: 0,
              top: 64,
              bottom: 0,
            }}
          >
            <SketchTable />
          </Sider>

          <Content style={{ marginLeft: 500, padding: '10px 24px 24px', backgroundColor: 'slategray' }}>
            <Canvas
              //camera={{ zoom: 2 }}
              camera={{ fov, aspect, near, far, position: [30, 50, 50] }}
            >
              {/* <CameraControls minDistance={1.2} maxDistance={4} ref={cameraControlsRef} /> */}
              <OrbitControls makeDefault enableDamping={true} dampingFactor={0.1} />
              <ambientLight intensity={2} />

              {/* Constains test component adding test object using Occt */}
              {/* <OcctWorkerTest /> */}
              <OcctRoot />
            </Canvas>
          </Content>
        </Layout>
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
