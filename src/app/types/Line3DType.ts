export interface Line3DType {
  id: number;
  p1_id: number;
  p2_id: number;
}

export type Line3DMapType = {
  [key: number]: Line3DType;
};
