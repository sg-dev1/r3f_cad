// TODOs
// - snap to parallel for x/y axis
// - tangent, parallel, ... contraints  --> needs a constraint solver   (e.g. use solvespace in a "backend")
// TODO it would be also good to have a behaviour where the lines are closed, e.g. detect when a new point is close to and existing
//      --> then use the existing one  --> coincidence constraint in solver
//
// TODO check if this implementation of line drawing (using a raycaster its setFromCamera function) is the best way to do it,
//      e.g. it requires the creation of THREE.Vector2 instance all the time, are there alternative ways?
// TODO The ClickableLine component will be the line drawing tool for the sketcher
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { addPoint, selectPoints } from '@/app/slices/sketchSlice';
import { calcIntersectionWithPlane } from '@/utils/threejs_utils';

export interface ClickableLineRefType {
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const xyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const ClickableLine = forwardRef<any, any>(({}, ref) => {
  const [currentMousePos, setCurrentMousePos] = useState<Vector3 | undefined>(undefined);
  const [pointsToDraw, setPointsToDraw] = useState<Vector3[]>([]);
  const { camera, scene, raycaster } = useThree();

  const dispatch = useAppDispatch();
  const sketchPoints = useAppSelector(selectPoints);

  // Convert the sketchPoints from redux state to pointsToDraw
  useEffect(() => {
    console.log('sketchPoints', sketchPoints);

    const pointsLst = sketchPoints.map((p) => new Vector3(p.x, p.y, p.z));
    if (currentMousePos) {
      pointsLst.push(currentMousePos);
    }
    setPointsToDraw(pointsLst);
  }, [sketchPoints]);

  useImperativeHandle(
    ref,
    () => ({
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        //console.log(event);

        const intersect = calcIntersectionWithPlane(
          raycaster,
          camera,
          xyPlane,
          event.clientX,
          event.clientY,
          event.target as HTMLElement
        );
        if (intersect) {
          dispatch(addPoint({ ...intersect, id: 0 }));
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
        const intersect = calcIntersectionWithPlane(
          raycaster,
          camera,
          xyPlane,
          event.clientX,
          event.clientY,
          event.target as HTMLElement
        );
        if (intersect) {
          setCurrentMousePos(intersect);
        }
      },
    }),
    [camera, scene, raycaster]
  );

  useEffect(() => {
    if (currentMousePos) {
      const pointsLst = sketchPoints.map((p) => new Vector3(p.x, p.y, p.z));
      setPointsToDraw([...pointsLst, currentMousePos]);
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
