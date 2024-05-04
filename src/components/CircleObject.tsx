import { useAppSelector } from '@/app/hooks';
import { selectLastDof, selectLastSolverResultCode } from '@/app/slices/sketchSlice';
import { selectSelectedEntityId } from '@/app/slices/sketchToolStateSlice';
import { GeometryType } from '@/app/types/EntityType';
import { Line } from '@react-three/drei';
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';

const CircleObject = ({
  id,
  centerX,
  centerY,
  radius,
  color,
  enableHover,
  onGeometryClick,
}: {
  id: number;
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
  enableHover: boolean;
  onGeometryClick?: (type: GeometryType, id: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const sketchSelectedEntityId = useAppSelector(selectSelectedEntityId);
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);

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

  const getColor = () => {
    if (!enableHover) {
      return color;
    } else {
      // TODO color should be configured via redux store
      return sketchSelectedEntityId === id
        ? 'yellow'
        : sketchLastSolverResultCode !== 0
        ? 'red'
        : sketchLastDof === 0
        ? 'green'
        : hovered
        ? 'black'
        : color;
    }
  };

  return (
    <Line
      userData={{ id: id }}
      points={points}
      color={getColor()}
      lineWidth={hovered ? 4 : 1.5}
      onClick={(e) => onGeometryClick && onGeometryClick(GeometryType.CIRCLE, e.eventObject.userData.id)}
      onPointerOver={() => setHovered(enableHover)}
      onPointerOut={() => setHovered(false)}
    />
  );
};

export default CircleObject;
