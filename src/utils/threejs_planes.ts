/** This library contains helper functionality to work with three.js planes. */
import { SketchPlaneType } from '@/app/slices/Sketch';
import { Point3DInlineType } from '@/app/types/Point3DType';
import * as THREE from 'three';

export const XY_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
export const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const YZ_PLANE = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

export const SKETCH_PLANE_MAP: { [key: string]: THREE.Plane } = {
  xy: XY_PLANE,
  xz: XZ_PLANE,
  yz: YZ_PLANE,
};

export const getPointU = (plane: SketchPlaneType, point: THREE.Vector3Like) => {
  return getPointU2(plane, [point.x, point.y, point.z]);
};

export const getPointU2 = (plane: SketchPlaneType, point: Point3DInlineType) => {
  if ('xy' === plane.plane) {
    return point[0];
  } else if ('xz' === plane.plane) {
    return point[0];
  } else if ('yz' === plane.plane) {
    // y is up per default in three.js (therefore z is left and right)
    // Could be changed, see https://stackoverflow.com/a/58554774
    // but I stick to the default
    return point[2];
  } else {
    console.error('[getPointU] Invalid plane given: ' + plane);
    return 0;
  }
};

export const getPointV = (plane: SketchPlaneType, point: THREE.Vector3Like) => {
  return getPointV2(plane, [point.x, point.y, point.z]);
};

export const getPointV2 = (plane: SketchPlaneType, point: Point3DInlineType) => {
  if ('xy' === plane.plane) {
    return point[1];
  } else if ('xz' === plane.plane) {
    return point[2];
  } else if ('yz' === plane.plane) {
    // y is up per default in three.js (see above)
    return point[1];
  } else {
    console.error('[getPointV] Invalid plane given: ' + plane);
    return 0;
  }
};

/*
// rotations as Eulers, but we use Quaternion
export const getRotationForPlane = (plane: string): [number, number, number] => {
  //console.log('getRotationForPlane', plane);
  if (plane === 'xy') {
    return [0, 0, 0];
  } else if (plane === 'xz') {
    return [Math.PI / 2, 0, 0];
  } else if (plane === 'yz') {
    return [0, -Math.PI / 2, 0];
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};
*/

export const getRotationForPlaneAsQuaternion = (plane: SketchPlaneType): THREE.Quaternion => {
  const quaternion = new THREE.Quaternion();
  if (plane.plane === 'xy' /*blue*/) {
    // no rotation for xy needed
  } else if (plane.plane === 'xz' /*green*/) {
    quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  } else if (plane.plane === 'yz' /*red*/) {
    // Y axis need to be rotated counter clockwise to get desired location
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
  }
  return quaternion;
};

export const getCameraPositionForPlane = (plane: SketchPlaneType): [number, number, number] => {
  if (plane.plane === 'xy') {
    return [0, 0, 100];
  } else if (plane.plane === 'xz') {
    // y coordinate is negative because we look on the "negative side" of the y axis on this plane
    // so we look from the bottom at the plane
    return [0, -100, 0];
  } else if (plane.plane === 'yz') {
    // x coordinate is negative because we look on the "negative side" of the x axis on this plane
    // so we look from the right on the plane
    return [-100, 0, 0];
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const getXAxisPointsForPlane = (plane: SketchPlaneType): [number, number, number][] => {
  if (plane.plane === 'xy') {
    return [
      [-1000, 0, 0],
      [1000, 0, 0],
    ];
  } else if (plane.plane === 'xz') {
    return [
      [-1000, 0, 0],
      [1000, 0, 0],
    ];
  } else if (plane.plane === 'yz') {
    return [
      [0, 0, -1000],
      [0, 0, 1000],
    ];
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
    return [
      [0, 0, 0],
      [0, 0, 0],
    ];
  }
};

export const getYAxisPointsForPlane = (plane: SketchPlaneType): [number, number, number][] => {
  if (plane.plane === 'xy') {
    return [
      [0, -1000, 0],
      [0, 1000, 0],
    ];
  } else if (plane.plane === 'xz') {
    return [
      [0, 0, -1000],
      [0, 0, 1000],
    ];
  } else if (plane.plane === 'yz') {
    return [
      [0, -1000, 0],
      [0, 1000, 0],
    ];
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
    return [
      [0, 0, 0],
      [0, 0, 0],
    ];
  }
};

/*
export const getCameraPositionForPlaneVec3 = (plane: string): THREE.Vector3Tuple => {
  const camPos = getCameraPositionForPlane(plane);
  return [camPos[0], camPos[1], camPos[2]];
};
*/

export const convert2DPointTo3D = (plane: SketchPlaneType, u: number, v: number): [number, number, number] => {
  if ('xy' === plane.plane) {
    return [u, v, 0];
  } else if ('xz' === plane.plane) {
    return [u, 0, v];
  } else if ('yz' == plane.plane) {
    // beware that y is up per default in three.js
    return [0, v, u];
  } else {
    console.error('[convert2DPointTo3D] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const convert3dPointTo2d = (plane: SketchPlaneType, p: Point3DInlineType): [number, number] => {
  return [getPointU2(plane, p), getPointV2(plane, p)];
};

export const getNormalVectorForPlane = (plane: SketchPlaneType): [number, number, number] => {
  if ('xy' === plane.plane) {
    return [0, 0, 1];
  } else if ('xz' === plane.plane) {
    return [0, 1, 0];
  } else if ('yz' == plane.plane) {
    return [1, 0, 0];
  } else {
    console.error('[getNormalVectorForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const getPlaneAwareSketchPosition = (
  plane: SketchPlaneType,
  basePosition: [number, number, number],
  xOffset: number,
  yOffset: number
) => {
  let result: [number, number, number];

  if ('xy' === plane.plane) {
    result = [basePosition[0] + xOffset, basePosition[1] + yOffset, basePosition[2]];
  } else if ('xz' === plane.plane) {
    result = [basePosition[0] + xOffset, basePosition[1], basePosition[2] + yOffset];
  } else if ('yz' === plane.plane) {
    // beware that y is up per default in three.js
    result = [basePosition[0], basePosition[1] + yOffset, basePosition[2] + xOffset];
  } else {
    console.error('[getPlaneAwarePosition] Invalid plane given: ' + plane);
    result = [0, 0, 0];
  }

  return result;
};
