// Add a (hidden plane) as background, e.g. to not need the boxes and more as drawing surface and to have only single drawing surface
//      --> this is the "sketch plane"
//      Plane should lie on the X and Y axes, e.g. looking from front on it with ortographic camera  (XY plane)  - in future all different planes shall be supported
//      - current issue of solution is that plane is limited in size
//      - app also behaves strangely together with orbit controls (maybe disable it - only support zooming and panning and no rotation)
// TODO it would be nicer if line to be drawn is already displayed (based on last point clicked and current position of mouse)
//      - here also a snap to parallel to x/y axis could be implemented
// TODO it would be also good to have a behaviour where the lines are closed, e.g. detect when a new point is close to and existing
//      --> then use the existing one
// TODO save common state in the background, e.g. points/ lines drawn --> what to use for state management
//      react-redux? zustand (which comes from r3f)?
//
// TODO improve the forward ref (what types to use instead of any)
// TODO disable camera rotation (only zooming and paning should be allowed) - rotation creates weird behaviour
// TODO check if this implementation of line drawing (using a raycaster its setFromCamera function) is the best way to do it,
//      e.g. it requires the creation of THREE.Vector2 instance all the time, are there alternative ways?
// TODO ClickableLine component should be moved into its own tsx file
//
// TODO The ClickableLine component will be the line drawing tool for the sketcher

'use client';

import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, OrthographicCamera, Line, Plane } from '@react-three/drei';
import { BoxGeometry, Vector3 } from 'three';
import * as THREE from 'three';

// This is just a test object and will be removed in the future
const Box = (props: any) => {
  const boxRef = useRef<BoxGeometry>();

  return (
    <mesh ref={boxRef} {...props}>
      <boxGeometry args={[100, 100, 100]} />
      <meshStandardMaterial attach="material" color={'red'} />
    </mesh>
  );
};

interface ClickableLineRefType {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const ClickableLine = forwardRef<any, any>(({}, ref) => {
  const [points, setPoints] = useState<Vector3[]>([]);
  const { camera, scene, raycaster } = useThree();

  useImperativeHandle(
    ref,
    () => ({
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();

        //console.log(event);

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
        const point = new THREE.Vector2(x, y);
        console.log('x=', y, 'y=', y, 'clientX=', event.clientX, 'clientY=', event.clientY);
        //const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(point, camera);
        // For this to work the scene must have children, e.g. adding the boxes
        // Maybe the camera controls should be disabled --> weird behaviour
        const [intersect] = raycaster.intersectObjects(scene.children, true);
        if (intersect) {
          setPoints((points) => [...points, intersect.point]);
        }
        console.log(intersect);
      },
    }),
    [camera, scene, raycaster]
  );

  return (
    <>
      {points.length > 1 && (
        <Line
          points={points} // Array of THREE.Vector3
          color="pink"
          lineWidth={1} // In pixels (default)
          dashed={false} // Default
        />
      )}
    </>
  );
});

const SketcherView = () => {
  const clickRef = React.useRef<ClickableLineRefType>(null);

  return (
    <>
      <Canvas className="sketcherview" onClick={(e) => clickRef.current?.onClick(e)}>
        <CameraControls minDistance={1.2} maxDistance={4} />

        <ambientLight intensity={0.25} />
        <pointLight intensity={0.75} position={[500, 500, 1000]} />

        {/* <Box position={[70, 70, 0]} />
        <Box position={[-70, 70, 0]} />
        <Box position={[70, -70, 0]} />
        <Box position={[-70, -70, 0]} /> */}

        {/* Have a drawing plane where to draw the sketch */}
        <Plane args={[2000, 2000]} />

        <ClickableLine ref={clickRef} />

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
