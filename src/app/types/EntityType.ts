/** This library contains the types to represent sketch entities generically. */
export enum GeometryType {
  POINT = 0,
  LINE = 1,
  CIRCLE = 2,
  ARC = 3,
}

export const geometryTypeToString = (type: GeometryType) => {
  switch (type) {
    case GeometryType.POINT:
      return 'Point';
    case GeometryType.LINE:
      return 'Line';
    case GeometryType.CIRCLE:
      return 'Circle';
    case GeometryType.ARC:
      return 'Arc';
    default:
      return 'Unknown Type(' + String(type) + ')';
  }
};

type EntityType = {
  id: number;
  type: GeometryType;
};

export default EntityType;
