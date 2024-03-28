// Add a (hidden plane) as background, e.g. to not need the boxes and more as drawing surface and to have only single drawing surface
//      --> this is the "sketch plane"
//      Plane should lie on the X and Y axes, e.g. looking from front on it with ortographic camera  (XY plane)  - in future all different planes shall be supported
//      - current issue of solution is that plane is limited in size
//      - app also behaves strangely together with orbit controls (maybe disable it - only support zooming and panning and no rotation)
// NOTE: To fix this issue use Plane instead (mathematical infinite plane)
// https://www.columbia.edu/~njn2118/journal/2019/2/18.html
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
import GeometryTool, { ClickableLineRefType } from './GeometryTool';
import { Button } from 'antd';

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

  const geometryToolRef = React.useRef<ClickableLineRefType>(null);

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

        <GeometryTool ref={geometryToolRef} />

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
