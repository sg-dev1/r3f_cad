/** This library contains the types used to represent lines in the application. */
import { Point3DInlineType } from './Point3DType';
import { SHAPE3D_TYPE } from './ShapeType';

export interface Line3DType {
  id: number;
  p1_id: number;
  p2_id: number;
}

export type Line3DMapType = {
  [key: number]: Line3DType;
};

export interface Line3DInlinePointType {
  t: SHAPE3D_TYPE;
  start: Point3DInlineType;
  end: Point3DInlineType;
}
