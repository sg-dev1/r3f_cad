/** This library contains the type and logic for handling 3D geometry built by modelling operations.
 */
export interface Geom3dType {
  id: number;
  name: string;
  isVisible: boolean;

  // history of all modelling operations applied to a 3D Geometry
  modellingOperations: ModellingOperation[];
}

export interface ModellingOperation {
  type: ModellingOperationType;
  sketchRef: [number, number]; // sketch id, id of cycle in sketch
  distance: number;
}

export enum ModellingOperationType {
  EXTRUDE = 1,
}
