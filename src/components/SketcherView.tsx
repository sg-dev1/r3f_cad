//
// TODO sketch slice refactoring: Split it into parts
//   - current state of sketcher tool (lengthConstraintLineId, selectedEntityId) - no persistence needed
//   - current state of sketch - persistence needed
//          - entities (entityIdCounter, points, pointsMap, lines, lastPoint3D)
//          - constraints (constraintIdCounter, constraints)
//          - solver state // the state itself need to be here but the thunk needs to have access to the points to manipulate them
// TODO sketch slice refactoring: Extending it for multi sketch support
//   - Each sketch has its own id
//   - Maybe this should also go into its own slice (needs to be persistetd)
//   - Provide functionality to store the state from the sketch slice (and load it again into the sketch slice)
//        - e.g. trigger this functionality on open/ close of the sketcher tool
//
// TODO drag'n'drop of lines (needs to consider constraints)
//
// TODO improve positioning of constraints drawn on canvas
//
// TODO update of constraints on canvas (e.g. makes sense for length constraint), improved update on ConstraintsTable.tsx
// TODO delete of constraints on canvas
//
// TODO integration of redux persist
//   Examine possiblilities how to save redux state (e.g. to local storage etc.)
//     - e.g. add persistence because currently all data is lost after a reload
//     Use Redux Persist: https://blog.logrocket.com/persist-state-redux-persist-redux-toolkit-react/
//
// TODO Implement remove entities in sketcher slice via canvas
//  - Select an Entity (e.g. a line, a point) --> press ENTF key to delete it
//    (click listener on Entity for selection; then event listener on keyboard - could be combined with drag'n'drop of lines)
//
// TODO add more tools:
//   - Currently we simply have a simple line drawing tool that saves its points into the redux state and some basic constraint tools
//   - We need tools to draw other primitives (e.g. circles, arcs) and to add additional constraints (parallel, equal, mid point, ...)
//
// TODO put common settings in a "settingsSlice" s.t. they can be changed, e.g. color of lines etc.
//
// TODO improve the forward ref (what types to use instead of any)
'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import GeometryTool, { GeometryToolRefType } from './GeometryTool';
import { Button, Layout } from 'antd';
import { GeometryType, geometryTypeToString } from '@/app/types/EntityType';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addConstraint,
  selectConstraints,
  selectLastDof,
  selectLastSolverFailedConstraints,
  selectLastSolverResultCode,
  selectLengthConstraintLineId,
  setLengthConstraintLineId,
} from '@/app/slices/sketchSlice';
import { SlvsConstraints } from '@/app/types/Constraints';
import ZeroCoordinateCross from './ZeroCoordinateCross';
import ConstraintTable from './ConstraintTable';
import EntitiesTable from './EntitiesTable';

const { Header, Content, Sider } = Layout;

enum ToolState {
  DISABLED = 0,
  LINE_TOOL,
  POINT_TOOL,

  CONSTRAINT_COINCIDENCE,
  CONSTRAINT_HORIZONTAL,
  CONSTRAINT_VERTICAL,
  CONSTRAINT_LENGTH,
}

const SketcherView = () => {
  const [toolState, setToolState] = useState<ToolState>(ToolState.LINE_TOOL);
  const [stateIndicator, setStateIndicator] = useState<string>('');
  const [solverResult, setSolverResult] = useState<string>('');

  const geometryToolRef = React.useRef<GeometryToolRefType>(null);
  const dispatch = useAppDispatch();
  const sketchConstraints = useAppSelector(selectConstraints);
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);
  const sketchLastSolverFailedConstraints = useAppSelector(selectLastSolverFailedConstraints);

  const sketchLengthConstraintLineId = useAppSelector(selectLengthConstraintLineId);

  // Needed for (constraint) tools
  const [objectsClicked, setObjectsClicked] = useState<{ type: GeometryType; id: number }[]>([]);

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
      default:
        console.error('Should not get here. Invalid Tool State.');
    }

    // remove the length constraint edit input
    if (ToolState.CONSTRAINT_LENGTH !== toolState && sketchLengthConstraintLineId !== -1) {
      dispatch(setLengthConstraintLineId(-1));
    }
  }, [toolState]);

  const onGeometryClick = (type: GeometryType, id: number) => {
    console.log(
      '[SketcherView.onGeometryClick] Geometry with type ' + geometryTypeToString(type) + ' and id ' + id + ' clicked'
    );

    // Add constraint in case a constraint tool was selected
    if (ToolState.CONSTRAINT_COINCIDENCE === toolState) {
      if (type === GeometryType.POINT) {
        console.log(objectsClicked);
        if (objectsClicked.length === 1) {
          dispatch(
            addConstraint({
              id: 0,
              t: SlvsConstraints.SLVS_C_POINTS_COINCIDENT,
              v: [0, objectsClicked[0].id, id, 0, 0],
            })
          );
          setObjectsClicked([]);
        } else if (objectsClicked.length === 0) {
          setObjectsClicked([{ type: type, id: id }]);
        }
      }
      // line not supported - TODO indicate that visually
    } else if (ToolState.CONSTRAINT_HORIZONTAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, id, 0] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    } else if (ToolState.CONSTRAINT_VERTICAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_VERTICAL, v: [0, 0, 0, id, 0] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    } else if (ToolState.CONSTRAINT_LENGTH === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(setLengthConstraintLineId(id));
      }
      // Point type not supported - TODO indicate that visually
    }
  };

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.LINE_TOOL)}>
            Line
          </Button>
          <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.POINT_TOOL)}>
            Point
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => setToolState(ToolState.CONSTRAINT_COINCIDENCE)}
          >
            Coincidence
          </Button>
          <Button
            type="primary"
            className="primary-button"
            onClick={() => setToolState(ToolState.CONSTRAINT_HORIZONTAL)}
          >
            Horizontal
          </Button>
          <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.CONSTRAINT_VERTICAL)}>
            Vertical
          </Button>
          <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.CONSTRAINT_LENGTH)}>
            Length
          </Button>

          <div className={sketchLastSolverResultCode === 0 ? 'white-text' : 'red-text'}>
            {stateIndicator} | {solverResult}
          </div>
        </Header>

        <Layout>
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
            <ConstraintTable />
            <EntitiesTable />
          </Sider>
          <Content style={{ marginLeft: 500, padding: '10px 24px 24px', backgroundColor: 'slategray' }}>
            <Canvas
              orthographic
              //camera={{ zoom: 1, position: [0, 0, 200], top: 200, bottom: -200, left: 200, right: -200, near: 1, far: 2000 }}
              camera={{ zoom: 2 }}
              className="sketcherview"
              onClick={(e) => {
                if (ToolState.LINE_TOOL === toolState) {
                  geometryToolRef.current?.lineToolOnClick(e);
                } else if (ToolState.POINT_TOOL === toolState) {
                  geometryToolRef.current?.pointToolOnClick(e);
                }
              }}
              onPointerMove={(e) => {
                if (ToolState.LINE_TOOL === toolState) {
                  geometryToolRef.current?.lineToolOnPointerMove(e);
                } else {
                  geometryToolRef.current?.reset();
                }
              }}
            >
              {/* <CameraControls minDistance={1.2} maxDistance={4} /> */}
              <OrbitControls minDistance={1} maxDistance={4} enableRotate={false} />

              <ambientLight intensity={0.25} />
              <pointLight intensity={0.75} position={[500, 500, 1000]} />

              <GeometryTool onGeometryClick={onGeometryClick} ref={geometryToolRef} />

              <ZeroCoordinateCross onGeometryClick={onGeometryClick} />

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
