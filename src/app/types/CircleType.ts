/** This library contains the types used to represent circles in the application. */
import { floatNumbersEqual } from '@/utils/utils';
import { GeometryType } from './EntityType';
import { Point3DInlineType, point3DInlineEquals } from './Point3DType';

export interface CircleType {
  id: number;
  mid_pt_id: number;
  radius: number;
}

export interface CircleInlinePointType {
  t: GeometryType;
  mid_pt: Point3DInlineType;
  radius: number;
  midPt2d: [number, number];
}

export const circleInlineEquals = (a: CircleInlinePointType, b: CircleInlinePointType) => {
  if (
    a.t === b.t &&
    point3DInlineEquals(a.mid_pt, b.mid_pt) &&
    floatNumbersEqual(a.radius, b.radius) &&
    floatNumbersEqual(a.midPt2d[0], b.midPt2d[0]) &&
    floatNumbersEqual(a.midPt2d[1], b.midPt2d[1])
  ) {
    return true;
  } else {
    return false;
  }
};
