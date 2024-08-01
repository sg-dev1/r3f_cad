/** This hook contains functionality to get points for a 2D circle in 3D space. */
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { useMemo } from 'react';
import * as THREE from 'three';
import { getPlaneOffsetAsCoordinates } from './threejs_planes';
import { SketchPlaneType } from '@/app/slices/Sketch';

export const useCirclePoints = ({
  circle,
  quaternion,
  plane,
}: {
  circle: CircleInlinePointType;
  quaternion?: THREE.Quaternion;
  plane: SketchPlaneType;
}) => {
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        circle.midPt2d[0],
        circle.midPt2d[1],
        circle.radius,
        circle.radius,
        0,
        2 * Math.PI,
        false,
        0
      ).getPoints(128)
    );

    if (quaternion) {
      geometry.applyQuaternion(quaternion);
    }

    return geometry;
  }, [circle, quaternion]);

  const points = useMemo(() => {
    const points = [];
    const planeOffset = getPlaneOffsetAsCoordinates(plane);

    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push([p.x + planeOffset[0], p.y + planeOffset[1], p.z + planeOffset[2]] as Point3DInlineType);
    }
    return points;
  }, [geometry, plane]);

  return points;
};

export default useCirclePoints;
