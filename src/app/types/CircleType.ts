/** This library contains the types used to represent circles in the application. */
import { GeometryType } from './EntityType';
import { Point3DInlineType } from './Point3DType';

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
