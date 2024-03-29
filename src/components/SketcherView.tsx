//
// TODO Points and lines should be selectable (highlight on mouse over) --> preparation for constraint tools
//   --> all this will require changes in data model (redux)
//
// TODO add more tools:
//   - Currently we simply have a simple line drawing tool that saves its points into the redux state
//   - We need tools to draw other primitives (e.g. points, circles) and to add constraints (coincident, parallel, ...)
//
// TODO improve the forward ref (what types to use instead of any)
// TODO disable camera rotation (only zooming and paning should be allowed) - rotation creates weird behaviour
'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, OrthographicCamera } from '@react-three/drei';
import GeometryTool, { GeometryToolRefType } from './GeometryTool';
import { Button } from 'antd';
import { GeometryType } from '@/app/types/GeometryType';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addConstraint, selectConstraints } from '@/app/slices/sketchSlice';
import { SlvsConstraints } from '@/app/types/Constraints';

enum ToolState {
  DISABLED = 0,
  LINE_TOOL,
  POINT_TOOL,

  CONSTRAINT_COINCIDENCE,
  CONSTRAINT_HORIZONTAL,
  CONSTRAINT_VERTICAL,
}

const SketcherView = () => {
  const [toolState, setToolState] = useState<ToolState>(ToolState.LINE_TOOL);
  const [stateIndicator, setStateIndicator] = useState<string>('');

  const geometryToolRef = React.useRef<GeometryToolRefType>(null);
  const dispatch = useAppDispatch();
  const sketchConstraints = useAppSelector(selectConstraints);
  const [objectsClicked, setObjectsClicked] = useState<{ type: GeometryType; id: number }[]>([]);

  // Just for debugging
  useEffect(() => {
    console.log('sketchConstraints', sketchConstraints);
  }, [sketchConstraints]);

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
      default:
        console.error('Should not get here. Invalid Tool State.');
    }
  }, [toolState]);

  const onGeometryClick = (type: GeometryType, id: number) => {
    console.log('Geometry with type ' + type + ' and id ' + id + ' clicked');

    // Add constraint in case a constraint tool was selected
    if (ToolState.CONSTRAINT_COINCIDENCE === toolState) {
      if (type === GeometryType.POINT) {
        console.log(objectsClicked);
        if (objectsClicked.length === 1) {
          dispatch(
            addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_POINTS_COINCIDENT, v: [objectsClicked[0].id, id] })
          );
          setObjectsClicked([]);
        } else if (objectsClicked.length === 0) {
          setObjectsClicked([{ type: type, id: id }]);
        }
      }
      // line not supported - TODO indicate that visually
    } else if (ToolState.CONSTRAINT_HORIZONTAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [id] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    } else if (ToolState.CONSTRAINT_VERTICAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_VERTICAL, v: [id] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    }
  };

  return (
    <>
      <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.LINE_TOOL)}>
        Line
      </Button>
      <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.POINT_TOOL)}>
        Point
      </Button>
      <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.CONSTRAINT_COINCIDENCE)}>
        Coincidence
      </Button>
      <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.CONSTRAINT_HORIZONTAL)}>
        Horizontal
      </Button>
      <Button type="primary" className="primary-button" onClick={() => setToolState(ToolState.CONSTRAINT_VERTICAL)}>
        Vertical
      </Button>

      <div>{stateIndicator}</div>

      <Canvas
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
        <CameraControls minDistance={1.2} maxDistance={4} />

        <ambientLight intensity={0.25} />
        <pointLight intensity={0.75} position={[500, 500, 1000]} />

        <GeometryTool onGeometryClick={onGeometryClick} ref={geometryToolRef} />

        <OrthographicCamera
          makeDefault
          zoom={1}
          top={200}
          bottom={-200}
          left={200}
          right={-200}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
      </Canvas>
    </>
  );
};

export default SketcherView;
