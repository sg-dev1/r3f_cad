export interface Geom3dType {
  id: number;
  name: string;

  // history of all modelling operations applied to a 3D Geometry
  modellingOperations: ModellingOperation[];
}

export interface ModellingOperation {
  type: ModellingOperationType;
  sketchRef: [number, number];
  distance: number;
}

export enum ModellingOperationType {
  EXTRUDE = 1,
}
