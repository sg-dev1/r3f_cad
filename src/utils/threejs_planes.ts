import * as THREE from 'three';

export const XY_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
export const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const YZ_PLANE = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

export const SKETCH_PLANE_MAP: { [key: string]: THREE.Plane } = {
  xy: XY_PLANE,
  xz: XZ_PLANE,
  yz: YZ_PLANE,
};

export const getPointU = (plane: string, point: THREE.Vector3Like) => {
  if ('xy' === plane || 'xz' === plane) {
    return point.x;
  } else if ('yz' === plane) {
    return point.y;
  } else {
    console.error('[getPointU] Invalid plane given: ' + plane);
    return 0;
  }
};

export const getPointV = (plane: string, point: THREE.Vector3Like) => {
  if ('xy' === plane) {
    return point.y;
  } else if ('xz' === plane || 'yz' === plane) {
    return point.z;
  } else {
    console.error('[getPointV] Invalid plane given: ' + plane);
    return 0;
  }
};

export const convert2DPointTo3D = (plane: string, u: number, v: number): [number, number, number] => {
  if ('xy' === plane) {
    return [u, v, 0];
  } else if ('xz' === plane) {
    return [u, 0, v];
  } else if ('yz' == plane) {
    return [0, u, v];
  } else {
    console.error('[convert2DPointTo3D] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const getNormalVectorForPlane = (plane: string): [number, number, number] => {
  if ('xy' === plane) {
    return [0, 0, 1];
  } else if ('xz' === plane) {
    return [0, 1, 0];
  } else if ('yz' == plane) {
    return [1, 0, 0];
  } else {
    console.error('[getNormalVectorForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const getPlaneAwareSketchPosition = (
  plane: string,
  basePosition: [number, number, number],
  xOffset: number,
  yOffset: number
) => {
  let result: [number, number, number];

  if ('xy' === plane) {
    result = [basePosition[0] + xOffset, basePosition[1] + yOffset, basePosition[2]];
  } else if ('xz' === plane) {
    result = [basePosition[0] + xOffset, basePosition[1], basePosition[2] + yOffset];
  } else if ('yz' === plane) {
    result = [basePosition[0], basePosition[1] + xOffset, basePosition[2] + yOffset];
  } else {
    console.error('[getPlaneAwarePosition] Invalid plane given: ' + plane);
    result = [0, 0, 0];
  }

  return result;
};
