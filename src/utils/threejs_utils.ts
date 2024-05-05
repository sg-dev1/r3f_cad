import * as THREE from 'three';
import { SKETCH_PLANE_MAP } from './threejs_planes';

/**
 * Calculates the intersection of a ray casted from the camera to a specific plane.
 *
 * @param raycaster The THREE.Raycaster instance, e.g. coming from useThree() hook.
 * @param camera    The THREE.Camera instance, e.g. coming from useThree() hook.
 * @param plane     The plane for which the intersection shall be calculated, e.g. xy plane.
 * @param xCoord    The x coordinate of a mouse onClick or onPointerMove event (event.clientX).
 * @param yCoord    The y coordinate of a mouse onClick or onPointerMove event (event.clientY).
 * @param target    The target of the mouse onClick or onPointerMove event (e.g. event.target as HTMLElement).
 * @returns         The THREE.Vector3 instance containing the intersection or null in case there was no intersection.
 */
export const calcIntersectionWithPlane = (
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  planeStr: string,
  xCoord: number,
  yCoord: number,
  target: HTMLElement
) => {
  const rect = target.getBoundingClientRect();
  return calcIntersectionWithPlaneFromRect(raycaster, camera, planeStr, xCoord, yCoord, rect);
};

export interface RectType {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Calculates the intersection of a ray casted from the camera to a specific plane.
 *
 * @param raycaster The THREE.Raycaster instance, e.g. coming from useThree() hook.
 * @param camera    The THREE.Camera instance, e.g. coming from useThree() hook.
 * @param plane     The plane for which the intersection shall be calculated, e.g. xy plane.
 * @param xCoord    The x coordinate of a mouse onClick or onPointerMove event (event.clientX).
 * @param yCoord    The y coordinate of a mouse onClick or onPointerMove event (event.clientY).
 * @param rect      The target rect to convert the screen coordinates (e.g. from a browser event) to rendering coordinates
 *                  (e.g. on the Canvas)
 * @returns         The THREE.Vector3 instance containing the intersection or null in case there was no intersection.
 */
export const calcIntersectionWithPlaneFromRect = (
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  planeStr: string,
  xCoord: number,
  yCoord: number,
  rect: RectType
) => {
  const x = ((xCoord - rect.left) / rect.width) * 2 - 1;
  const y = (-(yCoord - rect.top) / rect.height) * 2 + 1;
  const point = new THREE.Vector2(x, y);

  //console.log('x=', y, 'y=', y, 'clientX=', xCoord, 'clientY=', yCoord);

  raycaster.setFromCamera(point, camera);
  // For this to work the scene must have children, e.g. adding the boxes
  // Maybe the camera controls should be disabled --> weird behaviour
  //const [intersect] = raycaster.intersectObjects(scene.children, true);
  // UPDATE: Do not intersect with object on screen but with a plane!

  let planeIntersection: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  const plane = SKETCH_PLANE_MAP[planeStr];
  const result = raycaster.ray.intersectPlane(plane, planeIntersection);
  //console.log('Plane intersection:', out);

  return result;
};
