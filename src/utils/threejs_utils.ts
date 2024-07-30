/** This library contains helper functionality for three.js. */
import * as THREE from 'three';
import { getPointU2, getPointV2, getThreePlane } from './threejs_planes';
import { CadTool3DShapeSubset } from './algo3d';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { GeometryType } from '@/app/types/EntityType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { SketchPlaneType } from '@/app/slices/Sketch';

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
  plane: SketchPlaneType,
  xCoord: number,
  yCoord: number,
  target: HTMLElement
) => {
  const rect = target.getBoundingClientRect();
  return calcIntersectionWithPlaneFromRect(raycaster, camera, plane, xCoord, yCoord, rect);
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
  plane: SketchPlaneType,
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
  const result = raycaster.ray.intersectPlane(getThreePlane(plane), planeIntersection);
  //console.log('Plane intersection:', out);

  return result;
};

/** Convert a CadTool3DShapeSubset array to a THREE.Shape using the given plane. */
export const cadTool3DShapeToThreeShape = (shapesFromCycle: CadTool3DShapeSubset[], plane: SketchPlaneType) => {
  // https://threejs.org/docs/index.html?q=shape#api/en/extras/core/Shape
  const threeShape = new THREE.Shape();

  if (shapesFromCycle.length > 1) {
    const firstShape = shapesFromCycle[0];
    let firstPoint: Point3DInlineType | null = null;
    if (firstShape.t === GeometryType.LINE) {
      firstPoint = (firstShape as Line3DInlinePointType).start;
    } else if (firstShape.t === GeometryType.ARC) {
      firstPoint = (firstShape as ArcInlinePointType).start;
    }
    // CIRCLE is handled differently (see below)

    if (firstPoint !== null) {
      threeShape.moveTo(getPointU2(plane, firstPoint), getPointV2(plane, firstPoint));
      //console.log('moveto', firstPoint);
      let arcIdx = 0;
      shapesFromCycle.forEach((shape) => {
        if (shape.t === GeometryType.LINE) {
          const lineSegment = shape as Line3DInlinePointType;
          threeShape.lineTo(getPointU2(plane, lineSegment.end), getPointV2(plane, lineSegment.end));
          //console.log('lineto', lineSegment.end);
        } else if (shape.t === GeometryType.ARC) {
          const arc = shape as ArcInlinePointType;
          //console.log('arc', arc);
          threeShape.absarc(arc.midPt2d[0], arc.midPt2d[1], arc.radius, arc.start_angle, arc.end_angle, arc.clockwise);
          arcIdx++;
        } else {
          console.warn('Should not get here. Type t ' + shape.t + ' not supported');
        }
      });
    } else {
      console.warn('firstPoint was null.');
    }
  } else {
    // CIRCLE
    if (shapesFromCycle[0].t === GeometryType.CIRCLE) {
      const circle = shapesFromCycle[0] as CircleInlinePointType;
      threeShape.moveTo(circle.midPt2d[0], circle.midPt2d[1]);
      threeShape.absellipse(
        circle.midPt2d[0],
        circle.midPt2d[1],
        circle.radius,
        circle.radius,
        0,
        2 * Math.PI,
        true,
        0
      );
    } else {
      console.warn('Should not get here. Type t ' + shapesFromCycle[0].t + ' with one element not supported');
    }
  }

  return threeShape;
};

/** Convert a CadTool3DShapeSubset array to Point3DInlineType array. */
export const cadTool3DShapeTo3DPoints = (
  shapesFromCycle: CadTool3DShapeSubset[],
  arcPointsArray: Point3DInlineType[][],
  circlePointsArray: Point3DInlineType[][]
) => {
  const points: Point3DInlineType[] = [];

  if (shapesFromCycle.length > 1) {
    const firstShape = shapesFromCycle[0];
    let firstPoint: Point3DInlineType | null = null;
    if (firstShape.t === GeometryType.LINE) {
      firstPoint = (firstShape as Line3DInlinePointType).start;
    } else if (firstShape.t === GeometryType.ARC) {
      firstPoint = (firstShape as ArcInlinePointType).start;
    }
    // CIRCLE is handled differently (see below)

    if (firstPoint !== null) {
      points.push(firstPoint);
      //console.log('moveto', firstPoint);
      let arcIdx = 0;
      shapesFromCycle.forEach((shape) => {
        if (shape.t === GeometryType.LINE) {
          const lineSegment = shape as Line3DInlinePointType;
          points.push(lineSegment.end);
          //console.log('lineto', lineSegment.end);
        } else if (shape.t === GeometryType.ARC) {
          const [_, ...otherArcPoints] = arcPointsArray[arcIdx];
          points.push(...otherArcPoints);
          arcIdx++;
        } else {
          console.warn('Should not get here. Type t ' + shape.t + ' not supported');
        }
      });
    } else {
      console.warn('firstPoint was null.');
    }
  } else {
    // CIRCLE
    if (shapesFromCycle[0].t === GeometryType.CIRCLE) {
      points.push(...circlePointsArray[0]);
    } else {
      console.warn('Should not get here. Type t ' + shapesFromCycle[0].t + ' with one element not supported');
    }
  }

  return points;
};
