/** This library contains the types used to represent lines in the application. */
import { GeometryType } from './EntityType';
import { Point3DInlineType } from './Point3DType';

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
