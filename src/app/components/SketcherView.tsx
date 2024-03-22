// Add a (hidden plane) as background, e.g. to not need the boxes and more as drawing surface and to have only single drawing surface
//      --> this is the "sketch plane"
//      Plane should lie on the X and Y axes, e.g. looking from front on it with ortographic camera  (XY plane)  - in future all different planes shall be supported
//      - current issue of solution is that plane is limited in size
//      - app also behaves strangely together with orbit controls (maybe disable it - only support zooming and panning and no rotation)
// NOTE: To fix this issue use Plane instead (mathematical infinite plane)
// https://www.columbia.edu/~njn2118/journal/2019/2/18.html
//
// TODO improve the forward ref (what types to use instead of any)
// TODO disable camera rotation (only zooming and paning should be allowed) - rotation creates weird behaviour
'use client';

import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, OrthographicCamera, Line, Plane } from '@react-three/drei';
import { BoxGeometry, Vector3 } from 'three';
import * as THREE from 'three';
import ClickableLine, { ClickableLineRefType } from './ClickableLine';

// This is just a test object and will be removed in the future
// const Box = (props: any) => {
//   const boxRef = useRef<BoxGeometry>();

//   return (
//     <mesh ref={boxRef} {...props}>
//       <boxGeometry args={[100, 100, 100]} />
//       <meshStandardMaterial attach="material" color={'red'} />
//     </mesh>
//   );
// };

const SketcherView = () => {
  const clickRef = React.useRef<ClickableLineRefType>(null);

  return (
    <>
      <Canvas
        className="sketcherview"
        onClick={(e) => clickRef.current?.onClick(e)}
        //onPointerOver={(e) => clickRef.current?.onPointerOver(e)}
        onPointerMove={(e) => clickRef.current?.onPointerMove(e)}
      >
        <CameraControls minDistance={1.2} maxDistance={4} />

        <ambientLight intensity={0.25} />
        <pointLight intensity={0.75} position={[500, 500, 1000]} />

        {/* <Box position={[70, 70, 0]} />
        <Box position={[-70, 70, 0]} />
        <Box position={[70, -70, 0]} />
        <Box position={[-70, -70, 0]} /> */}

        {/* Have a drawing plane where to draw the sketch */}
        {/* <Plane args={[2000, 2000]} /> */}

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
