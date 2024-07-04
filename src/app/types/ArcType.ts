/** This library contains the types used to represent arcs in the application. */
import { GeometryType } from './EntityType';
import { Point3DInlineType } from './Point3DType';

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
