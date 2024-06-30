/** This library contains the types used to represent circles in the application. */
import { Point3DInlineType } from './Point3DType';
import { SHAPE3D_TYPE } from './ShapeType';

export interface CircleType {
  id: number;
  mid_pt_id: number;
  radius: number;
}

export interface CircleInlinePointType {
  t: SHAPE3D_TYPE;
  mid_pt: Point3DInlineType;
  radius: number;
  midPt2d: [number, number];
}
