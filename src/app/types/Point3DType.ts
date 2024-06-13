import { Vector3Like } from 'three';

export interface Point3DType extends Vector3Like {
  id: number;
}

export type Point3DMapType = {
  [key: number]: Point3DType;
};

export type Point3DInlineType = [number, number, number];
