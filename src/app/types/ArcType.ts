import { Point3DInlineType } from './Point3DType';
import { SHAPE3D_TYPE } from './ShapeType';

export interface ArcInlinePointType {
  t: SHAPE3D_TYPE;
  start: Point3DInlineType;
  end: Point3DInlineType;
  mid_pt: Point3DInlineType;
}
