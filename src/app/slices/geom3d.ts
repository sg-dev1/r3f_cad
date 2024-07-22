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
  sketchRef: [number, string]; // sketch id, label of sketch cycle
  distance: number;
}

export enum ModellingOperationType {
  ADDITIVE_EXTRUDE = 1,
  ADDITIVE_REVOLVE = 2,
  ADDITIVE_LOFT = 3,
  ADDITIVE_PIPE = 4,

  SUBTRACTIVE_EXTRUDE = 10,
  SUBTRACTIVE_REVOLVE = 11,
  SUBTRACTIVE_LOFT = 12,
  SUBTRACTIVE_PIPE = 13,

  UNION = 20,
  CUT = 21,
  INTERSECT = 22,

  FILLET = 30,
  CHAMFER = 31,
}

export const modellingOperationTypeToShortLabel = (type: ModellingOperationType) => {
  switch (type) {
    case ModellingOperationType.ADDITIVE_EXTRUDE:
      return 'AEXT';
    case ModellingOperationType.ADDITIVE_REVOLVE:
      return 'AREV';
    case ModellingOperationType.ADDITIVE_LOFT:
      return 'ALOF';
    case ModellingOperationType.ADDITIVE_PIPE:
      return 'APIP';

    case ModellingOperationType.SUBTRACTIVE_EXTRUDE:
      return 'SEXT';
    case ModellingOperationType.SUBTRACTIVE_REVOLVE:
      return 'SREV';
    case ModellingOperationType.SUBTRACTIVE_LOFT:
      return 'SLOF';
    case ModellingOperationType.SUBTRACTIVE_PIPE:
      return 'SPIP';

    case ModellingOperationType.UNION:
      return 'UNIO';
    case ModellingOperationType.CUT:
      return 'CUT';
    case ModellingOperationType.INTERSECT:
      return 'INTE';

    case ModellingOperationType.FILLET:
      return 'FILL';
    case ModellingOperationType.CHAMFER:
      return 'CHAM';

    default:
      return 'NA';
  }
};
