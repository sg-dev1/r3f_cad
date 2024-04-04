export interface Line3DType {
  id: number;
  p1_id: number;
  p2_id: number;

  // optional properties, e.g. for display
  length?: number; // for displaying length constraint
}

export type Line3DMapType = {
  [key: number]: Line3DType;
};
