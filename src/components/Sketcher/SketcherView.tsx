/** This component contains the main view for the sketcher tool. */
'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import GeometryTool, { GeometryToolRefType } from './GeometryTool';
import { Button, Layout } from 'antd';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  deleteConstraintById,
  deleteLengthConstraintForLine,
  resetActiveSketch,
  selectConstraints,
  selectLastDof,
  selectLastSolverFailedConstraints,
  selectLastSolverResultCode,
  selectSketchCurrentPlane,
} from '@/app/slices/sketchSlice';
import {
  ToolState,
  selectLengthConstraintLineId,
  selectSelectedConstraintId,
  selectToolState,
  setAngleConstraintLineIds,
  setDiamConstraintCircleId,
  setLengthConstraintLineId,
  setSelectedConstraintId,
  setSelectedEntityId,
  setToolState,
} from '@/app/slices/sketchToolStateSlice';
import ConstraintTable from './ConstraintTable';
import EntitiesTable from './EntitiesTable';
import useKeyboard from '@/utils/useKeyboard';
import { getCameraPositionForPlane } from '@/utils/threejs_planes';

const { Header, Content, Sider } = Layout;

const SketcherView = () => {
  const [stateIndicator, setStateIndicator] = useState<string>('');
  const [solverResult, setSolverResult] = useState<string>('');

  const geometryToolRef = React.useRef<GeometryToolRefType>(null);
  const dispatch = useAppDispatch();
  const sketchConstraints = useAppSelector(selectConstraints);
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);
  const sketchLastSolverFailedConstraints = useAppSelector(selectLastSolverFailedConstraints);

  const sketchLengthConstraintLineId = useAppSelector(selectLengthConstraintLineId);
  const sketchSelectedConstraintId = useAppSelector(selectSelectedConstraintId);
  const toolState = useAppSelector(selectToolState);
  const sketchCurrentPlane = useAppSelector(selectSketchCurrentPlane);

  // keyboard events
  const keyMap = useKeyboard();
  useEffect(() => {
    //console.log(keyMap);
    if (keyMap['Delete'] === true) {
      if (sketchLengthConstraintLineId !== -1) {
        //console.log('Deleting sketchLengthConstraintLineId', sketchLengthConstraintLineId);
        dispatch(deleteLengthConstraintForLine(sketchLengthConstraintLineId));
        dispatch(setLengthConstraintLineId(-1));
      }
      if (sketchSelectedConstraintId !== -1) {
        //console.log('Deleting sketchSelectedConstraintId', sketchSelectedConstraintId);
        dispatch(deleteConstraintById(sketchSelectedConstraintId));
        dispatch(setSelectedConstraintId(-1));
      }
    } else if (keyMap['Escape'] === true) {
      dispatch(setSelectedEntityId(-1));
      dispatch(setSelectedConstraintId(-1));
      dispatch(setLengthConstraintLineId(-1));
      dispatch(setDiamConstraintCircleId(-1));
      dispatch(setAngleConstraintLineIds([-1, -1]));
    }
  }, [keyMap]);

  // Just for debugging
  useEffect(() => {
    console.log('[SketcherView.useEffect(_,[sketchConstraints])', sketchConstraints);
  }, [sketchConstraints]);

  useEffect(() => {
    if (sketchLastSolverResultCode === 0) {
      setSolverResult('Solver OK, Dof=' + sketchLastDof);
    } else {
      setSolverResult('Solver Error, Failed Constraints=' + sketchLastSolverFailedConstraints.map(String));
    }
  }, [sketchLastSolverResultCode, sketchLastDof]);

  useEffect(() => {
    switch (toolState) {
      case ToolState.DISABLED:
        setStateIndicator('No Tool selected!');
        break;
      case ToolState.LINE_TOOL:
        setStateIndicator('Line Tool');
        break;
      case ToolState.POINT_TOOL:
        setStateIndicator('Point Tool');
        break;
      case ToolState.CIRCLE_TOOL:
        setStateIndicator('Circle Tool');
        break;
      case ToolState.CONSTRAINT_COINCIDENCE:
        setStateIndicator('Coincidence Tool');
        break;
      case ToolState.CONSTRAINT_HORIZONTAL:
        setStateIndicator('Horizontal Constraint Tool');
        break;
      case ToolState.CONSTRAINT_VERTICAL:
        setStateIndicator('Vertical Constraint Tool');
        break;
      case ToolState.CONSTRAINT_LENGTH:
        setStateIndicator('Length Constraint Tool');
        break;
      case ToolState.CONSTRAINT_DIAMETER:
        setStateIndicator('Diameter Constraint Tool');
        break;
      case ToolState.CONSTRAINT_PARALLEL:
        setStateIndicator('Parallel Constraint Tool');
        break;
      case ToolState.CONSTRAINT_EQUAL:
        setStateIndicator('Equal Constraint Tool');
        break;
      case ToolState.CONSTRAINT_MID_POINT:
        setStateIndicator('Midpoint Constraint Tool');
        break;
      case ToolState.CONSTRAINT_PERPENDICULAR:
        setStateIndicator('Perpendicular Constraint Tool');
        break;
      case ToolState.CONSTRAINT_ANGLE:
        setStateIndicator('Angle Constraint Tool');
        break;
      case ToolState.CONSTRAINT_POINT_ON_OBJECT:
        setStateIndicator('Point on Line/ Circle Constraint Tool');
        break;
      case ToolState.CURSOR_TOOL:
        setStateIndicator('Cursor Tool');
        break;
      default:
        console.error('Should not get here. Invalid Tool State.');
    }

    // remove the length constraint edit input
    if (ToolState.CONSTRAINT_LENGTH !== toolState && sketchLengthConstraintLineId !== -1) {
      dispatch(setLengthConstraintLineId(-1));
    }
  }, [toolState]);

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', height: '7vh' }}>
          <Button type="primary" className="primary-button" onClick={() => dispatch(setToolState(ToolState.LINE_TOOL))}>
            Line
            {/* <LineOutlined /> */}
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.POINT_TOOL))}
          >
            Point
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CIRCLE_TOOL))}
          >
            Circle
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_COINCIDENCE))}
          >
            Coincidence
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_HORIZONTAL))}
          >
            Horizontal
            {/* <LineOutlined style={{ color: 'red' }} /> */}
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_VERTICAL))}
          >
            Vertical
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_LENGTH))}
          >
            Length
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_DIAMETER))}
          >
            Diameter
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_PARALLEL))}
          >
            Parallel
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_EQUAL))}
          >
            Equal
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_MID_POINT))}
          >
            Mid Point
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_PERPENDICULAR))}
          >
            Perpendicular
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_POINT_ON_OBJECT))}
          >
            Point on Object
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CONSTRAINT_ANGLE))}
          >
            Angle
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => dispatch(setToolState(ToolState.CURSOR_TOOL))}
          >
            Cursor
          </Button>

          <div className={sketchLastSolverResultCode === 0 ? 'white-text' : 'red-text'}>
            {stateIndicator} | {solverResult}
          </div>
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
            <Button type="primary" className="primary-button" onClick={() => dispatch(resetActiveSketch())}>
              Back to 3D Modeller
            </Button>

            <ConstraintTable />
            <EntitiesTable />
          </Sider>
          <Content style={{ marginLeft: 500, padding: '10px 24px 24px', backgroundColor: 'slategray' }}>
            <Canvas
              orthographic
              //camera={{ zoom: 1, position: [0, 0, 200], top: 200, bottom: -200, left: 200, right: -200, near: 1, far: 2000 }}
              camera={{
                zoom: 2,
                near: 0.01,
                far: 1000,
                position: getCameraPositionForPlane(sketchCurrentPlane),
                // it seems that for the camera no rotation is needed ...
                //quaternion: getRotationForPlaneAsQuaternion(sketchCurrentPlane),
              }}
              onClick={(e) => geometryToolRef.current?.onClick(e)}
              onPointerMove={(e) => geometryToolRef.current?.onPointerMove(e)}
            >
              {/* <CameraControls minDistance={1.2} maxDistance={4} /> */}
              <OrbitControls minDistance={1} maxDistance={4} enableRotate={false} />

              <ambientLight intensity={0.25} />
              <pointLight intensity={0.75} position={[500, 500, 1000]} />

              <GeometryTool ref={geometryToolRef} />

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

              {/* If the camera is used like that it behaves a bit strange - scene gets rerendered when it is resized.
                  This lead to the issue where lines on the screen are not shown in correct aspect ratio. */}
              {/* <OrthographicCamera
                    makeDefault
                    zoom={1}
                    top={200}
                    bottom={-200}
                    left={200}
                    right={-200}
                    near={1}
                    far={2000}
                    position={[0, 0, 200]}
              /> */}
            </Canvas>
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default SketcherView;
