import * as THREE from 'three';

export const XY_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
export const XZ_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const YZ_PLANE = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
