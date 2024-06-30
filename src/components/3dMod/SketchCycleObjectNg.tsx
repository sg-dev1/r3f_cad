/** This component contains the drawing functionality for 2D sketches in 3D space. */
import { useAppDispatch } from '@/app/hooks';
import { setSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { Point3DInlineType, point3DInlineEquals } from '@/app/types/Point3DType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';
import { SketchCycleType } from '@/utils/algo3d';
import { getPointU2, getPointV2, getRotationForPlaneAsQuaternion } from '@/utils/threejs_planes';
import useArcPoints from '@/utils/useArcPoints';
import useCirclePoints from '@/utils/useCirclePoints';
import { Line } from '@react-three/drei';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

export interface SketchCycleObjectNgProps {
  sketchCycle: SketchCycleType;
}

const SketchCycleObjectNg = ({ sketchCycle }: SketchCycleObjectNgProps) => {
  useEffect(() => {
    drawShape();
  }, [sketchCycle]);

  // if hidden we don't have to do anything
  if (sketchCycle.isHidden) {
    return <></>;
  }

  const quaternion = getRotationForPlaneAsQuaternion(sketchCycle.sketch.plane);
  const dispatch = useAppDispatch();

  const arcs = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.ARC) as ArcInlinePointType[];
  const circles = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.CIRCLE) as CircleInlinePointType[];
  const arcsPointsArray = arcs.map((arc) => useArcPoints({ arc: arc, quaternion: quaternion }));
  const circlePointsArray = circles.map((circle) => useCirclePoints({ circle: circle, quaternion: quaternion }));

  const [hovered, setHovered] = useState<boolean>(false);
  const [shapeGeom, setShapeGeom] = useState<THREE.ShapeGeometry | null>(null);
  const [shapePoints, setShapePoints] = useState<Point3DInlineType[]>([]);

  const drawShape = () => {
    if (sketchCycle.cycle.length > 0) {
      // https://threejs.org/docs/index.html?q=shape#api/en/extras/core/Shape
      const threeShape = new THREE.Shape();
      const points: Point3DInlineType[] = [];

      if (sketchCycle.cycle.length > 1) {
        const firstShape = sketchCycle.cycle[0];
        let firstPoint: Point3DInlineType | null = null;
        if (firstShape.t === SHAPE3D_TYPE.LINE) {
          firstPoint = (firstShape as Line3DInlinePointType).start;
        } else if (firstShape.t === SHAPE3D_TYPE.ARC) {
          firstPoint = (firstShape as ArcInlinePointType).start;
        }
        // CIRCLE is handled differently (see below)

        if (firstPoint !== null) {
          points.push(firstPoint);
          threeShape.moveTo(
            getPointU2(sketchCycle.sketch.plane, firstPoint),
            getPointV2(sketchCycle.sketch.plane, firstPoint)
          );
          //console.log('moveto', firstPoint);
          let arcIdx = 0;
          sketchCycle.cycle.forEach((shape) => {
            if (shape.t === SHAPE3D_TYPE.LINE) {
              const lineSegment = shape as Line3DInlinePointType;
              threeShape.lineTo(
                getPointU2(sketchCycle.sketch.plane, lineSegment.end),
                getPointV2(sketchCycle.sketch.plane, lineSegment.end)
              );
              points.push(lineSegment.end);
              //console.log('lineto', lineSegment.end);
            } else if (shape.t === SHAPE3D_TYPE.ARC) {
              const arc = shape as ArcInlinePointType;
              //console.log('arc', arc);
              threeShape.absarc(
                arc.midPt2d[0],
                arc.midPt2d[1],
                arc.radius,
                arc.start_angle,
                arc.end_angle,
                arc.clockwise
              );
              const [_, ...otherArcPoints] = arcsPointsArray[arcIdx];
              points.push(...otherArcPoints);
              arcIdx++;
            } else {
              console.warn('Should not get here. Type t ' + shape.t + ' not supported');
            }
          });
        } else {
          console.warn('firstPoint was null.');
        }
      } else {
        // CIRCLE
        if (sketchCycle.cycle[0].t === SHAPE3D_TYPE.CIRCLE) {
          const circle = sketchCycle.cycle[0] as CircleInlinePointType;
          threeShape.moveTo(circle.midPt2d[0], circle.midPt2d[1]);
          threeShape.absellipse(
            circle.midPt2d[0],
            circle.midPt2d[1],
            circle.radius,
            circle.radius,
            0,
            2 * Math.PI,
            true,
            0
          );
          points.push(...circlePointsArray[0]);
        } else {
          console.warn('Should not get here. Type t ' + sketchCycle.cycle[0].t + ' with one element not supported');
        }
      }

      const geometry = new THREE.ShapeGeometry(threeShape);
      geometry.applyQuaternion(quaternion);

      setShapeGeom(geometry);
      setShapePoints(points);
    }
  };

  const obtainShapeColor = () => {
    if (hovered) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  return (
    <>
      {shapeGeom && (
        <mesh
          geometry={shapeGeom}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => dispatch(setSketchToExtrude([sketchCycle.sketch.id, sketchCycle.index]))}
        >
          <meshBasicMaterial color={obtainShapeColor()} side={THREE.DoubleSide} />
        </mesh>
      )}
      {shapePoints.length > 0 && (
        // Do not rotate line since all points already have the correct coordinates
        <Line points={shapePoints} color="blue" />
      )}
    </>
  );
};

export default SketchCycleObjectNg;
