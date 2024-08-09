/** This library contains the types used to represent arcs in the application. */
import { calcAngle2d, floatNumbersEqual, round, toDegree } from '@/utils/utils';
import { GeometryType } from './EntityType';
import { Point3DInlineType, Point3DType, point3DInlineEquals } from './Point3DType';
import { SketchPlaneType } from '../slices/Sketch';
import { convert2DPointTo3D, convert3dPointTo2d } from '@/utils/threejs_planes';
import { Arc, Point } from '@flatten-js/core';

export interface ArcInlinePointType {
  t: GeometryType;
  start: Point3DInlineType;
  end: Point3DInlineType;
  mid_pt: Point3DInlineType;
  // the middle point on the arc, required for occt edge generation
  middle: Point3DInlineType;
  radius: number;
  start_angle: number;
  end_angle: number;
  clockwise: boolean;
  midPt2d: [number, number];
}

export const createArc2 = (plane: SketchPlaneType, midPoint: Point3DType, start: Point3DType, end: Point3DType) => {
  return createArc(plane, [midPoint.x, midPoint.y, midPoint.z], [start.x, start.y, start.z], [end.x, end.y, end.z]);
};

export const createArc = (
  plane: SketchPlaneType,
  midPoint: Point3DInlineType,
  start: Point3DInlineType,
  end: Point3DInlineType
): ArcInlinePointType => {
  const midPoint2d = convert3dPointTo2d(plane, midPoint);
  const start2d = convert3dPointTo2d(plane, start);
  const end2d = convert3dPointTo2d(plane, end);

  const v1Vect: [number, number] = [start2d[0] - midPoint2d[0], start2d[1] - midPoint2d[1]];
  const v2Vect: [number, number] = [end2d[0] - midPoint2d[0], end2d[1] - midPoint2d[1]];

  // - calc radius (use v2, v1 has different length)
  const radius = round(Math.sqrt(v2Vect[0] * v2Vect[0] + v2Vect[1] * v2Vect[1]));
  // - calc p0  (point on arc with angle === 0)
  //const p0: [number, number] = [midPoint2d[0] + radius, midPoint2d[1]];
  const p0Vect: [number, number] = [radius, 0];

  // - calc angle alpha: v1=(midPoint, start) v2=(midPoint, end)=distVect
  const a1 = calcAngle2d(p0Vect, v1Vect);
  let a2 = calcAngle2d(p0Vect, v2Vect);
  //     - smaller angle is angle alpha
  //     - bigger angle = alpha + beta (= angle from constraint)

  console.log('[createArc]', 'midPoint', midPoint2d, 'start', start2d, 'end', end2d);
  console.log('[createArc]', 'radius', radius, 'v1', v1Vect, 'v2', v2Vect, 'p0Vect', p0Vect);
  console.log('[createArc]', 'a1', round(toDegree(a1)), 'a2', round(toDegree(a2)));

  let isCounterClockwise = true;
  if (a2 < a1) {
    a2 = 2 * Math.PI - a2;
    if (a2 < a1) {
      isCounterClockwise = false;
    }
    console.log('[createArc]', 'corrected a2', round(toDegree(a2)), 'ccw', isCounterClockwise);
  }

  // TODO need to test if this is always correct
  const startAngle = a1;
  const endAngle = a2;

  const r = radius / 6;
  // points start, end, and middle need to be calculdated
  // use flatten library to simplify this
  const flattenArc = new Arc(new Point(midPoint2d), r, a1, a2, isCounterClockwise);
  const arcStart2d = flattenArc.start;
  const arcEnd2d = flattenArc.end;
  const arcMiddle2d = flattenArc.middle();
  const arcStart = convert2DPointTo3D(plane, arcStart2d.x, arcStart2d.y);
  const arcEnd = convert2DPointTo3D(plane, arcEnd2d.x, arcEnd2d.y);
  const arcMiddle = convert2DPointTo3D(plane, arcMiddle2d.x, arcMiddle2d.y);

  return {
    t: GeometryType.ARC,
    start: arcStart,
    end: arcEnd,
    mid_pt: midPoint,
    middle: arcMiddle,
    radius: r,
    start_angle: startAngle,
    end_angle: endAngle,
    clockwise: !isCounterClockwise,
    midPt2d: midPoint2d,
  };
};

export const arcInlineEquals = (a: ArcInlinePointType, b: ArcInlinePointType) => {
  if (
    a.t === b.t &&
    point3DInlineEquals(a.start, b.start) &&
    point3DInlineEquals(a.end, b.end) &&
    point3DInlineEquals(a.mid_pt, b.mid_pt) &&
    // don't add this check else we have to fix the test cases
    //point3DInlineEquals(a.middle, b.middle) &&
    floatNumbersEqual(a.radius, b.radius) &&
    floatNumbersEqual(a.start_angle, b.start_angle) &&
    floatNumbersEqual(a.end_angle, b.end_angle) &&
    a.clockwise === b.clockwise &&
    floatNumbersEqual(a.midPt2d[0], b.midPt2d[0]) &&
    floatNumbersEqual(a.midPt2d[1], b.midPt2d[1])
  ) {
    return true;
  } else {
    return false;
  }
};
