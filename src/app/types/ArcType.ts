/** This library contains the types used to represent arcs in the application. */
import { floatNumbersEqual } from '@/utils/utils';
import { GeometryType } from './EntityType';
import { Point3DInlineType, point3DInlineEquals } from './Point3DType';

export interface ArcInlinePointType {
  t: GeometryType;
  start: Point3DInlineType;
  end: Point3DInlineType;
  mid_pt: Point3DInlineType;
  radius: number;
  start_angle: number;
  end_angle: number;
  clockwise: boolean;
  midPt2d: [number, number];
}

export const arcInlineEquals = (a: ArcInlinePointType, b: ArcInlinePointType) => {
  if (
    a.t === b.t &&
    point3DInlineEquals(a.start, b.start) &&
    point3DInlineEquals(a.end, b.end) &&
    point3DInlineEquals(a.mid_pt, b.mid_pt) &&
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
