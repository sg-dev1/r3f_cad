import { CircleInlinePointType } from '@/app/types/CircleType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { useMemo } from 'react';
import * as THREE from 'three';

export const useCirclePoints = ({ circle }: { circle: CircleInlinePointType }) => {
  const points = useMemo(() => {
    const points = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        circle.mid_pt[0],
        circle.mid_pt[1],
        circle.radius,
        circle.radius,
        0,
        2 * Math.PI,
        false,
        0
      ).getPoints(128)
    );
    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push([p.x, p.y, p.z] as Point3DInlineType);
    }
    return points;
  }, [circle]);

  return points;
};

export default useCirclePoints;
