/** This hook contains functionality to get points for a 2D arc in 3D space. */
import { SketchPlaneType } from '@/app/slices/Sketch';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { useMemo } from 'react';
import * as THREE from 'three';
import { getPlaneOffsetAsCoordinates } from './threejs_planes';

export const useArcPoints = ({
  arc,
  quaternion,
  plane,
}: {
  arc: ArcInlinePointType;
  quaternion?: THREE.Quaternion;
  plane: SketchPlaneType;
}) => {
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        arc.midPt2d[0],
        arc.midPt2d[1],
        arc.radius,
        arc.radius,
        arc.start_angle,
        arc.end_angle,
        arc.clockwise,
        0 // aRotation, see https://threejs.org/docs/index.html#api/en/extras/curves/EllipseCurve
      ).getPoints(128)
    );

    if (quaternion) {
      geometry.applyQuaternion(quaternion);
    }

    return geometry;
  }, [arc, quaternion]);

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

export default useArcPoints;
