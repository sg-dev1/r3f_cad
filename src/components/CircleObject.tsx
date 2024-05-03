import { Line } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

const CircleObject = ({
  centerX,
  centerY,
  radius,
  color,
}: {
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
}) => {
  const points = useMemo(() => {
    const points = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(centerX, centerY, radius, radius, 0, 2 * Math.PI, false, 0).getPoints(128)
    );
    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push(p);
    }
    return points;
  }, [centerX, centerY, radius]);
  return <Line points={points} color={color} lineWidth={1.5} />;
};

export default CircleObject;
