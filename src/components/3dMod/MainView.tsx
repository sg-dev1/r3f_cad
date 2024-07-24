/** This component contains the main view for the 3D modelling tool. */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Layout } from 'antd';
import { createSketch } from '@/app/slices/sketchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import SketchTable from './SketchTable';
import OcctRoot from './OcctRoot';
import { Canvas } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei';
import ThreeAxisPlanes from './ThreeAxisPlanes';
import Geom3DTable from './Geom3DTable';
import { DirectionalLight } from 'three';
import {
  clearSelectedShapeIds,
  ModellingToolStateEnum,
  selectModellingToolState,
  setModellingToolState,
} from '@/app/slices/modellingToolStateSlice';

const { Header, Content, Sider } = Layout;

const MainView = () => {
  const [stateIndicator, setStateIndicator] = useState<string>('');
  const toolState = useAppSelector(selectModellingToolState);

  //const activeSketchId = useAppSelector(selectActiveSketchId);
  const dispatch = useAppDispatch();
  // const cameraControlsRef = useRef<CameraControls>(null);
  const directionalLightRef = useRef<DirectionalLight>(null);

  const [threeAxisPlanesVisible, setThreeAxisPlanesVisible] = useState<boolean>(false);

  const fov = 70;
  const aspect = 2; // the canvas default
  // Needs to be tuned to mitigate the z-fighting problem
  // (e.g. one surface drawn onto the other is flickering because it is not sure which pixel is in front)
  // see https://stackoverflow.com/a/21106656
  const near = 1; // do not make this too small else we get screen flickering (due to z-fighting problem)
  const far = 10000; // with a higher value the objects start to disappear very light (when they are already very small)
  // with that you have to zoom very far out to see anything
  //const near = 1000;
  //const far = 3500000;

  // ---

  useEffect(() => {
    switch (toolState) {
      case ModellingToolStateEnum.EXTRUDE:
        setStateIndicator('Extrude Tool');
        break;
      case ModellingToolStateEnum.UNION:
        setStateIndicator('Union Tool');
        break;
      default:
        console.error('Should not get here. Invalid Tool State.');
    }
    dispatch(clearSelectedShapeIds());
  }, [toolState]);

  // ---

  const onCreateNewSketch = () => {
    // In this way it is possible to select the plane for where to draw the sketch
    // TODO still some issues with drawing - need to get rotations right
    setThreeAxisPlanesVisible(true);
  };

  const onPlaneClicked = (plane: 'xy' | 'xz' | 'yz') => {
    if (threeAxisPlanesVisible) {
      console.log('clicked plane', plane);
      dispatch(createSketch(plane));
      setThreeAxisPlanesVisible(false);
    }
  };

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', height: '7vh' }}>
          <Button type="primary" className="primary-button" onClick={() => onCreateNewSketch()}>
            Create new Sketch
          </Button>

          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setModellingToolState(ModellingToolStateEnum.EXTRUDE))}
          >
            Extrude
          </Button>

          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setModellingToolState(ModellingToolStateEnum.UNION))}
          >
            Union
          </Button>

          <div className="white-text">{stateIndicator}</div>
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
            <Geom3DTable />
          </Sider>

          <Content style={{ marginLeft: 500, padding: '10px 24px 24px', backgroundColor: 'slategray' }}>
            <Canvas
              //camera={{ zoom: 200 }}
              camera={{ fov, aspect, near, far, position: [200, 50, 200] }}
            >
              {/* <CameraControls minDistance={1.2} maxDistance={4} ref={cameraControlsRef} /> */}
              <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.1}
                onChange={(e) => {
                  if (e && directionalLightRef && directionalLightRef.current) {
                    directionalLightRef.current.position.copy(e.target.object.position);
                  }
                }}
              />
              {/* Set this light intensity a bit lower than the intensity of the directional light below to see shadows */}
              <ambientLight intensity={2} />
              {/* DirectionalLight behaves similar to sun light (e.g. to simulate daylight) 
                  https://threejs.org/docs/index.html#api/en/lights/DirectionalLight
              */}
              <directionalLight ref={directionalLightRef} color={0xffffff} intensity={3} position={[200, 50, 200]} />

              {/* Constains test component adding test object using Occt */}
              {/* <OcctWorkerTest /> */}
              <OcctRoot />

              <GizmoHelper
                alignment="bottom-right" // widget alignment within scene
                margin={[80, 80]} // widget margins (X, Y)
                //onUpdate={/* called during camera animation  */}
                //onTarget={/* return current camera target (e.g. from orbit controls) to center animation */}
                //renderPriority={10}
              >
                <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
                {/* <GizmoViewcube /> */}
              </GizmoHelper>

              {/* Enable the grid for debugging for now */}
              <Grid
                args={[100, 100]}
                cellSize={10} // make it same as sectionSize so there are no cells in between
                //cellColor={'#6f6f6f'}
                sectionSize={10}
                sectionColor={'blue'}
                //infiniteGrid
              />

              <ThreeAxisPlanes isVisible={threeAxisPlanesVisible} onPlaneClicked={onPlaneClicked} />
            </Canvas>
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default MainView;
