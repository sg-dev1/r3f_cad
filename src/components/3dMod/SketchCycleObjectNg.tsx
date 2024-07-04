/** This component contains the drawing functionality for 2D sketches in 3D space. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectSelectedSketch, setSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { RootState } from '@/app/store';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { GeometryType } from '@/app/types/EntityType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { SketchCycleType } from '@/utils/algo3d';
import { getPointU2, getPointV2, getRotationForPlaneAsQuaternion } from '@/utils/threejs_planes';
import useArcPoints from '@/utils/useArcPoints';
import useCirclePoints from '@/utils/useCirclePoints';
import { Line } from '@react-three/drei';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import * as THREE from 'three';

export interface SketchCycleObjectNgProps {
  sketchCycle: SketchCycleType;
}

const SketchCycleObjectNg = ({ sketchCycle }: SketchCycleObjectNgProps) => {
  const sketchIsVisible = useSelector((state: RootState) => state.sketchs.sketches[sketchCycle.sketch.id].isVisible);
  const selectedSketch = useAppSelector(selectSelectedSketch);

  const quaternion = useMemo(() => getRotationForPlaneAsQuaternion(sketchCycle.sketch.plane), [sketchCycle]);
  const dispatch = useAppDispatch();

  const arcs = useMemo(
    () => sketchCycle.cycle.filter((shape) => shape.t === GeometryType.ARC) as ArcInlinePointType[],
    [sketchCycle]
  );
  const circles = useMemo(
    () => sketchCycle.cycle.filter((shape) => shape.t === GeometryType.CIRCLE) as CircleInlinePointType[],
    [sketchCycle]
  );
  // Cannot use useMemo for both of these because cannot use a hook in a hook
  const arcsPointsArray = arcs.map((arc) => useArcPoints({ arc: arc, quaternion: quaternion }));
  const circlePointsArray = circles.map((circle) => useCirclePoints({ circle: circle, quaternion: quaternion }));

  const [hovered, setHovered] = useState<boolean>(false);
  const [shapeGeom, setShapeGeom] = useState<THREE.ShapeGeometry | null>(null);
  const [shapePoints, setShapePoints] = useState<Point3DInlineType[]>([]);

  // ---

  useEffect(() => {
    if (sketchIsVisible) {
      if (selectedSketch === sketchCycle.sketch.id) {
        setShapeGeom(shapeGeometryPrecomputed);
      } else {
        setShapeGeom(null);
      }
      setShapePoints(shapePointsPrecomputed);
    } else {
      // in case shape is not visible, nothing needs to be drawn
      setShapeGeom(null);
      setShapePoints([]);
    }
  }, [sketchIsVisible, selectedSketch]);

  // ---

  const drawShape = (): [THREE.ShapeGeometry | null, Point3DInlineType[]] => {
    const points: Point3DInlineType[] = [];
    if (sketchCycle.cycle.length > 0) {
      // https://threejs.org/docs/index.html?q=shape#api/en/extras/core/Shape
      const threeShape = new THREE.Shape();

      if (sketchCycle.cycle.length > 1) {
        const firstShape = sketchCycle.cycle[0];
        let firstPoint: Point3DInlineType | null = null;
        if (firstShape.t === GeometryType.LINE) {
          firstPoint = (firstShape as Line3DInlinePointType).start;
        } else if (firstShape.t === GeometryType.ARC) {
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
            if (shape.t === GeometryType.LINE) {
              const lineSegment = shape as Line3DInlinePointType;
              threeShape.lineTo(
                getPointU2(sketchCycle.sketch.plane, lineSegment.end),
                getPointV2(sketchCycle.sketch.plane, lineSegment.end)
              );
              points.push(lineSegment.end);
              //console.log('lineto', lineSegment.end);
            } else if (shape.t === GeometryType.ARC) {
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
        if (sketchCycle.cycle[0].t === GeometryType.CIRCLE) {
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

      return [geometry, points];
    }

    return [null, points];
  };
  const [shapeGeometryPrecomputed, shapePointsPrecomputed] = useMemo(() => drawShape(), [sketchCycle]);

  const obtainShapeColor = () => {
    if (hovered) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  // ---

  return (
    <>
      {shapeGeom && (
        <mesh
          frustumCulled={false}
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
