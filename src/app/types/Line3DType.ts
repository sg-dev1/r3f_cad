/** This library contains the types used to represent lines in the application. */
import { GeometryType } from './EntityType';
import { Point3DInlineType, point3DInlineEquals } from './Point3DType';

export interface Line3DType {
  id: number;
  p1_id: number;
  p2_id: number;
}

export type Line3DMapType = {
  [key: number]: Line3DType;
};

export interface Line3DInlinePointType {
  t: GeometryType;
  start: Point3DInlineType;
  end: Point3DInlineType;
}

export const line3DInlineEquals = (a: Line3DInlinePointType, b: Line3DInlinePointType) => {
  if (a.t === b.t && point3DInlineEquals(a.start, b.start) && point3DInlineEquals(a.end, b.end)) {
    return true;
  } else {
    return false;
  }
};
