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
