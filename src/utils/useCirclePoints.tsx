import { CircleInlinePointType } from '@/app/types/CircleType';
import { useMemo } from 'react';
import * as THREE from 'three';

const useCirclePoints = ({ circle }: { circle: CircleInlinePointType }) => {
  const points = useMemo(() => {
    const points = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        circle.mid_pt[0],
        circle.mid_pt[0],
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
      /*
      points.push(p.x);
      points.push(p.y);
      points.push(p.z);
      */
      points.push(p);
    }
    return points;
  }, [circle]);

  return points;
};

export default useCirclePoints;
