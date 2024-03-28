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
import { Point, Points, Segment, Segments } from '@react-three/drei';
import * as THREE from 'three';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  addPoint,
  resetLastPoint,
  selectLines,
  selectPoints,
  selectPointsMap,
  selectLastPoint,
} from '@/app/slices/sketchSlice';
import { calcIntersectionWithPlane } from '@/utils/threejs_utils';

export interface ClickableLineRefType {
  lineToolOnClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  lineToolOnPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  pointToolOnClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;

  onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

const xyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const GeometryTool = forwardRef<any, any>(({}, ref) => {
  const [currentMousePos, setCurrentMousePos] = useState<[x: number, y: number, z: number] | null>(null);
  const [pointsToDraw, setPointsToDraw] = useState<[x: number, y: number, z: number][]>([]);
  const { camera, scene, raycaster } = useThree();

  const dispatch = useAppDispatch();
  const sketchPoints = useAppSelector(selectPoints);
  const sketchPointsMap = useAppSelector(selectPointsMap);
  const sketchLines = useAppSelector(selectLines);
  const sketchLastPoint = useAppSelector(selectLastPoint);

  useImperativeHandle(
    ref,
    () => ({
      lineToolOnClick: (event: React.MouseEvent<HTMLElement>) => {
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
          dispatch(addPoint({ p: { ...intersect, id: 0 }, isLine: true }));
        }
        //console.log(intersect);
      },
      onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();

        //console.log('onPointerOver', event);
      },
      lineToolOnPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
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
          setCurrentMousePos([intersect.x, intersect.y, intersect.z]);
        }
      },
      pointToolOnClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();

        const intersect = calcIntersectionWithPlane(
          raycaster,
          camera,
          xyPlane,
          event.clientX,
          event.clientY,
          event.target as HTMLElement
        );
        if (intersect) {
          dispatch(addPoint({ p: { ...intersect, id: 0 }, isLine: false }));
        }
      },
      reset: () => {
        setCurrentMousePos(null);
        dispatch(resetLastPoint());
      },
    }),
    [camera, scene, raycaster]
  );

  useEffect(() => {
    if (currentMousePos && sketchLastPoint) {
      setPointsToDraw([[sketchLastPoint.x, sketchLastPoint.y, sketchLastPoint.z], currentMousePos]);
    } else if (!currentMousePos) {
      setPointsToDraw([]);
    }
  }, [currentMousePos]);

  return (
    <>
      <Segments lineWidth={0.5}>
        {pointsToDraw.length === 2 && <Segment key={-1} start={pointsToDraw[0]} end={pointsToDraw[1]} color="gray" />}
        {sketchLines.map((line) => {
          const p1 = sketchPointsMap[line.p1_id];
          const p2 = sketchPointsMap[line.p2_id];
          //console.log('id', line.id, 'line', line);
          return <Segment key={line.id} start={[p1.x, p1.y, p1.z]} end={[p2.x, p2.y, p2.z]} color="white" />;
        })}
      </Segments>
      <Points>
        <pointsMaterial vertexColors size={4} />
        {sketchPoints.map((point) => {
          //console.log('id', point.id, 'point', point);
          return <Point key={point.id} position={[point.x, point.y, point.z]} color="red" />;
        })}
      </Points>
    </>
  );
});

export default GeometryTool;
