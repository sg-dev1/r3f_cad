// TODOs
// - snap to parallel for x/y axis
// - tangent, parallel, ... contraints  --> needs a constraint solver   (e.g. use solvespace in a "backend")
// TODO it would be also good to have a behaviour where the lines are closed, e.g. detect when a new point is close to and existing
//      --> then use the existing one
// TODO save common state in the background, e.g. points/ lines drawn --> what to use for state management
//      react-redux? zustand (which comes from r3f)?
//
// TODO check if this implementation of line drawing (using a raycaster its setFromCamera function) is the best way to do it,
//      e.g. it requires the creation of THREE.Vector2 instance all the time, are there alternative ways?
// TODO The ClickableLine component will be the line drawing tool for the sketcher
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import * as THREE from 'three';

export interface ClickableLineRefType {
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const xyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const ClickableLine = forwardRef<any, any>(({}, ref) => {
  const [points, setPoints] = useState<Vector3[]>([]);
  const [currentMousePos, setCurrentMousePos] = useState<Vector3 | undefined>(undefined);
  const [pointsToDraw, setPointsToDraw] = useState<Vector3[]>([]);
  const { camera, scene, raycaster } = useThree();

  const calcIntersection = (xCoord: number, yCoord: number, target: HTMLElement) => {
    const rect = (target as HTMLElement).getBoundingClientRect();
    const x = ((xCoord - rect.left) / rect.width) * 2 - 1;
    const y = (-(yCoord - rect.top) / rect.height) * 2 + 1;
    const point = new THREE.Vector2(x, y);

    //console.log('x=', y, 'y=', y, 'clientX=', xCoord, 'clientY=', yCoord);

    raycaster.setFromCamera(point, camera);
    // For this to work the scene must have children, e.g. adding the boxes
    // Maybe the camera controls should be disabled --> weird behaviour
    //const [intersect] = raycaster.intersectObjects(scene.children, true);
    // UPDATE: Do not intersect with object on screen but with a plane!

    let planeIntersection: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    raycaster.ray.intersectPlane(xyPlane, planeIntersection);
    //console.log('Plane intersection:', out);

    return planeIntersection;
  };

  useImperativeHandle(
    ref,
    () => ({
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        //console.log(event);

        const intersect = calcIntersection(event.clientX, event.clientY, event.target as HTMLElement);
        if (intersect) {
          setPoints((points) => [...points, intersect]);
        }
        console.log(intersect);
      },
      onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();

        console.log('onPointerOver', event);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();

        //console.log('onPointerMove', event);
        const intersect = calcIntersection(event.clientX, event.clientY, event.target as HTMLElement);
        setCurrentMousePos(intersect);
      },
    }),
    [camera, scene, raycaster]
  );

  useEffect(() => {
    if (currentMousePos) {
      setPointsToDraw([...points, currentMousePos]);
    } else {
      setPointsToDraw(points);
    }
  }, [currentMousePos]);

  return (
    <>
      {pointsToDraw.length > 1 && (
        <Line
          points={pointsToDraw} // Array of THREE.Vector3
          color="pink"
          lineWidth={1} // In pixels (default)
          dashed={false} // Default
        />
      )}
    </>
  );
});

export default ClickableLine;
