/** This library contains the combined type to represent 3D geometry. */
import { Geom3dType } from '../slices/geom3d';
import { Inputs } from '@bitbybit-dev/occt';

export interface Geometry3DType {
  geom3d: Geom3dType;
  occtShape: Inputs.OCCT.TopoDSShapePointer;
}
