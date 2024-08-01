/** This library contains helper functionality to work with three.js planes. */
import { SketchPlaneType } from '@/app/slices/Sketch';
import { Point3DInlineType } from '@/app/types/Point3DType';
import * as THREE from 'three';

const XY_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const YZ_PLANE = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

const SKETCH_PLANE_MAP: { [key: string]: THREE.Plane } = {
  xy: XY_PLANE,
  xz: XZ_PLANE,
  yz: YZ_PLANE,
};

/** Returns the THREE.Plane for a given SketchPlaneType. */
export const getThreePlane = (plane: SketchPlaneType) => {
  const planeObj = SKETCH_PLANE_MAP[plane.plane];
  if (planeObj) {
    return planeObj;
  } else {
    return new THREE.Plane(new THREE.Vector3(...plane.normalVector), plane.offset);
  }
};

/** Get the first coordinate of a 2d point. */
export const getPointU = (plane: SketchPlaneType, point: THREE.Vector3Like) => {
  return getPointU2(plane, [point.x, point.y, point.z]);
};

/** Get the first coordinate of a 2d point. */
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

/** Get the second coordinate of a 2d point. */
export const getPointV = (plane: SketchPlaneType, point: THREE.Vector3Like) => {
  return getPointV2(plane, [point.x, point.y, point.z]);
};

/** Get the second coordinate of a 2d point. */
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

/** Get the rotation Quaternion for a given SketchPlaneType. */
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

/** Get the camera position for a given SketchPlaneType (e.g. used in Sketcher). */
export const getCameraPositionForPlane = (plane: SketchPlaneType): [number, number, number] => {
  if (plane.plane === 'xy') {
    return [0, 0, 100 + plane.offset];
  } else if (plane.plane === 'xz') {
    // y coordinate is negative because we look on the "negative side" of the y axis on this plane
    // so we look from the bottom at the plane
    return [0, -100 + plane.offset, 0];
  } else if (plane.plane === 'yz') {
    // x coordinate is negative because we look on the "negative side" of the x axis on this plane
    // so we look from the right on the plane
    return [-100 + plane.offset, 0, 0];
  } else {
    console.error('[getRotationForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

/** Get the endpoints of the X axis to draw in the Sketcher tool. */
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

/** Get the endpoints of the Y axis to draw in the Sketcher tool. */
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

/** Convert a 2d point to 3d by considering the 2d coordinates [u, v] and the SketchPlaneType. */
export const convert2DPointTo3D = (plane: SketchPlaneType, u: number, v: number): [number, number, number] => {
  if ('xy' === plane.plane) {
    return [u, v, plane.offset];
  } else if ('xz' === plane.plane) {
    return [u, plane.offset, v];
  } else if ('yz' == plane.plane) {
    // beware that y is up per default in three.js
    return [plane.offset, v, u];
  } else {
    console.error('[convert2DPointTo3D] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

/** Convert a 3d point to 2d. */
export const convert3dPointTo2d = (plane: SketchPlaneType, p: Point3DInlineType): [number, number] => {
  return [getPointU2(plane, p), getPointV2(plane, p)];
};

/** Get the normal vector of a given plane. */
export const getNormalVectorForPlane = (plane: SketchPlaneType): [number, number, number] => {
  if ('xy' === plane.plane) {
    return [0, 0, 1];
  } else if ('xz' === plane.plane) {
    return [0, 1, 0]; // actual normal vector is [0, -1, 0]
  } else if ('yz' == plane.plane) {
    return [1, 0, 0]; //actual normal vector is [-1, 0, 0]
  } else {
    console.error('[getNormalVectorForPlane] Invalid plane given: ' + plane);
    return [0, 0, 0];
  }
};

export const getPlaneOffsetAsCoordinates = (plane: SketchPlaneType): [number, number, number] => {
  const normVector = getNormalVectorForPlane(plane);
  return [normVector[0] * plane.offset, normVector[1] * plane.offset, normVector[2] * plane.offset];
};

/** Get a plane aware sketch position at basePosition with offsets into
 *  X (xOffset) and Y (yOffset) directions. */
export const getPlaneAwareSketchPosition = (
  plane: SketchPlaneType,
  basePosition: [number, number, number],
  xOffset: number,
  yOffset: number
) => {
  let result: [number, number, number];

  if ('xy' === plane.plane) {
    result = [basePosition[0] + xOffset, basePosition[1] + yOffset, basePosition[2] + plane.offset];
  } else if ('xz' === plane.plane) {
    result = [basePosition[0] + xOffset, basePosition[1] + plane.offset, basePosition[2] + yOffset];
  } else if ('yz' === plane.plane) {
    // beware that y is up per default in three.js
    result = [basePosition[0] + plane.offset, basePosition[1] + yOffset, basePosition[2] + xOffset];
  } else {
    console.error('[getPlaneAwarePosition] Invalid plane given: ' + plane);
    result = [0, 0, 0];
  }

  return result;
};
