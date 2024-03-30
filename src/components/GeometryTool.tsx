//
// TODO check if this implementation of line drawing (using a raycaster its setFromCamera function) is the best way to do it,
//      e.g. it requires the creation of THREE.Vector2 instance all the time, are there alternative ways?
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line, Point, Points, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  addPoint,
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
import { GeometryType } from '@/app/types/GeometryType';
import { SlvsConstraints } from '@/app/types/Constraints';

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
          />
        );
      })}

      <Points>
        <pointsMaterial vertexColors size={6} />
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

// Functionality required for this custom Line component
// - Highlight color + make thicker on mouse over                (done)
// - Selection with on click (then maybe different color)        // selection not needed now
// - drag'n'drop - a bit more trick since it needs to            // will be implemented later
//   update the data in the redux store as well
const LineObject = ({
  id,
  start,
  end,
  onGeometryClick,
}: {
  id: number;
  start: [x: number, y: number, z: number];
  end: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
}) => {
  const sketchConstraints = useAppSelector(selectConstraints);
  const constraintsAffectingLine = sketchConstraints.filter((c) => c.v[3] === id || c.v[4] === id);
  const horizontalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_HORIZONTAL);
  const verticalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_VERTICAL);

  // Drag n drop, hover
  const [hovered, setHovered] = useState(false);
  //useEffect(() => void (document.body.style.cursor = hovered ? 'grab' : 'auto'), [hovered]);
  //const bind = useDrag(({ down, xy: [x, y] }) => {
  //  document.body.style.cursor = down ? 'grabbing' : 'grab';
  //setPos(new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0).unproject(camera).multiply({ x: 1, y: 1, z: 0 }).clone())
  //});

  return (
    <>
      <Line
        userData={{ id: id }}
        points={[start, end]} // array of points
        color={hovered ? 'black' : 'white'} // TODO color should be configured via redux store
        onClick={(e) => onGeometryClick(GeometryType.LINE, e.eventObject.userData.id)}
        onPointerOver={() => {
          //console.log('onPointerOver');
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        lineWidth={hovered ? 2.5 : 1.5} // default is 1
        segments
        dashed={false} // default
      />
      {/* Crude way to display constraints visually on the canvas using Text/ Html from drei
          Text is position on mid point of line adding some "offset" to align it - values found out via try and error */}
      {verticalConstraints.length > 0 ? (
        // Here it looks with Text better ...
        <Text
          color="red"
          position={[(start[0] + end[0]) / 2 + 3, (start[1] + end[1]) / 2 + 5, (start[2] + end[2]) / 2]}
          rotation={[0, Math.PI, 0]}
          fontSize={12}
        >
          |
        </Text>
      ) : (
        // <Html position={[(start[0] + end[0]) / 2 + 3, (start[1] + end[1]) / 2 + 5, (start[2] + end[2]) / 2]}>
        //   <div style={{ color: 'red', fontSize: 16, fontWeight: 'bold' }}>|</div>
        // </Html>
        ''
      )}
      {horizontalConstraints.length > 0 ? (
        // ... wherease here the Html looks better.
        // <Text
        //   color="red"
        //   position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 7, (start[2] + end[2]) / 2]}
        //   rotation={[0, Math.PI, 0]}
        //   fontSize={12}
        // >
        //   -
        // </Text>
        <Html position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 15, (start[2] + end[2]) / 2]}>
          <div style={{ color: 'red', fontSize: 50 }}>-</div>
        </Html>
      ) : (
        ''
      )}

      {/* Here some example code to add a text input next to a line, e.g. to insert a constraint
          Also tried Input von antd but this behaved strangely ... */}
      {/* <Html position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]}>
        <input placeholder="fill in a number" />
      </Html> */}
    </>
  );
};

const PointObject = ({
  id,
  position,
  onGeometryClick,
}: {
  id: number;
  position: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Point
      userData={{ id: id }}
      position={position}
      color={hovered ? 'darkred' : 'red'} // TODO color should be configured via redux store
      onClick={(e) => onGeometryClick(GeometryType.POINT, e.eventObject.userData.id)}
      onPointerOver={(e) => {
        //console.log('onPointerOver point', e);
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      //size={hovered ? 8 : 4}  // changing size seems to not work, most likely due to using Points component
    />
  );
};

export default GeometryTool;
