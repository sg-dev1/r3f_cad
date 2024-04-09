//
// TODO check if this implementation of line drawing (using a raycaster its setFromCamera function) is the best way to do it,
//      e.g. it requires the creation of THREE.Vector2 instance all the time, are there alternative ways?
//
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Points } from '@react-three/drei';
import * as THREE from 'three';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  addEntity,
  resetLastPoint,
  selectLines,
  selectPoints,
  selectPointsMap,
  selectLastPoint,
  callSketchSolverBackend,
  selectConstraints,
  buildSolverRequestType,
} from '@/app/slices/sketchSlice';
import { calcIntersectionWithPlane } from '@/utils/threejs_utils';
import { GeometryType } from '@/app/types/EntityType';
import LineObject from './LineObject';
import PointObject from './PointObject';

export interface GeometryToolRefType {
  lineToolOnClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  lineToolOnPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  pointToolOnClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;

  onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

export interface GeometryToolProps {
  onGeometryClick: (type: GeometryType, id: number) => void;
}

const xyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const GeometryTool = forwardRef<any, any>(({ onGeometryClick }: GeometryToolProps, ref) => {
  const [currentMousePos, setCurrentMousePos] = useState<[x: number, y: number, z: number] | null>(null);
  const [pointsToDraw, setPointsToDraw] = useState<[x: number, y: number, z: number][]>([]);
  const { camera, scene, raycaster } = useThree();

  const dispatch = useAppDispatch();
  const sketchPoints = useAppSelector(selectPoints);
  const sketchPointsMap = useAppSelector(selectPointsMap);
  const sketchLines = useAppSelector(selectLines);
  const sketchLastPoint = useAppSelector(selectLastPoint);
  const sketchConstraints = useAppSelector(selectConstraints);

  useEffect(() => {
    dispatch(
      callSketchSolverBackend(
        buildSolverRequestType({
          workplane: 'xy',
          points: sketchPoints,
          lines: sketchLines,
          constraints: sketchConstraints,
        })
      )
    );
  }, [sketchPoints, sketchLines, sketchConstraints]);

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
          dispatch(addEntity({ p: { ...intersect, id: 0 }, type: GeometryType.LINE }));
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
          dispatch(addEntity({ p: { ...intersect, id: 0 }, type: GeometryType.POINT }));
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
      {/* Old solution using Segements, does not support event handlers like onClick or onPointerOver */}
      {/* <Segments lineWidth={0.5}>
        {pointsToDraw.length === 2 && <Segment key={-1} start={pointsToDraw[0]} end={pointsToDraw[1]} color="gray" />}
        {sketchLines.map((line) => {
          const p1 = sketchPointsMap[line.p1_id];
          const p2 = sketchPointsMap[line.p2_id];
          //console.log('id', line.id, 'line', line);
          return (
            <Segment
              key={line.id}
              start={[p1.x, p1.y, p1.z]}
              end={[p2.x, p2.y, p2.z]}
              color="white"
              onClick={() => console.log('Line Segment OnClick')}
              onPointerOver={() => console.log('onPointerOver line segment')}
            />
            //<SegmentWithEvents key={line.id} start={[p1.x, p1.y, p1.z]} end={[p2.x, p2.y, p2.z]} color="white" />
          );
          //return <LineObject key={line.id} start={[p1.x, p1.y, p1.z]} end={[p2.x, p2.y, p2.z]} color="white" />;
        })}
      </Segments> */}

      {pointsToDraw.length === 2 && (
        <Line
          points={[pointsToDraw[0], pointsToDraw[1]]} // array of points
          color={'gray'}
          lineWidth={1.5} // default is 1
          segments
          dashed={false} // default
        />
      )}
      {sketchLines.map((line) => {
        const p1 = sketchPointsMap[line.p1_id];
        const p2 = sketchPointsMap[line.p2_id];
        //console.log('id', line.id, 'line', line);
        return (
          <LineObject
            key={line.id}
            id={line.id}
            start={[p1.x, p1.y, p1.z]}
            end={[p2.x, p2.y, p2.z]}
            onGeometryClick={onGeometryClick}
            length={line.length}
          />
        );
      })}

      <Points>
        <pointsMaterial vertexColors size={8} />
        {sketchPoints.map((point) => {
          //console.log('id', point.id, 'point', point);
          return (
            <PointObject
              key={point.id}
              id={point.id}
              position={[point.x, point.y, point.z]}
              onGeometryClick={onGeometryClick}
            />
          );
        })}
      </Points>
    </>
  );
});

export default GeometryTool;
