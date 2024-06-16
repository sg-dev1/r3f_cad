import { ArcInlinePointType } from '@/app/types/ArcType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { useMemo } from 'react';
import * as THREE from 'three';

export const useArcPoints = ({ arc }: { arc: ArcInlinePointType }) => {
  const points = useMemo(() => {
    const points = [];
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
    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push([p.x, p.y, p.z] as Point3DInlineType);
    }
    return points;
  }, [arc]);

  return points;
};

export default useArcPoints;
