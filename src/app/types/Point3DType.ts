/** This library contains the types used to represent points in the application. */
import { floatNumbersEqual } from '@/utils/utils';
import { Vector3Like } from 'three';

export interface Point3DType extends Vector3Like {
  id: number;
}

export type Point3DMapType = {
  [key: number]: Point3DType;
};

export type Point3DInlineType = [number, number, number];

export const point3DInlineEquals = (a: Point3DInlineType, b: Point3DInlineType) => {
  if (floatNumbersEqual(a[0], b[0]) && floatNumbersEqual(a[1], b[1]) && floatNumbersEqual(a[2], b[2])) {
    return true;
  } else {
    return false;
  }
};
