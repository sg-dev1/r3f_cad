import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectLastDof, selectLastSolverResultCode, updateCircleRadius } from '@/app/slices/sketchSlice';
import {
  ToolState,
  selectCurrentPlane,
  selectSelectedEntityId,
  selectToolState,
} from '@/app/slices/sketchToolStateSlice';
import { GeometryType } from '@/app/types/EntityType';
import { getPointU, getPointV } from '@/utils/threejs_planes';
import { calcIntersectionWithPlaneFromRect } from '@/utils/threejs_utils';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

const CircleObject = ({
  id,
  midPoint,
  radius,
  color,
  enableHover,
  onGeometryClick,
}: {
  id: number;
  midPoint: THREE.Vector3Like;
  radius: number;
  color: string;
  enableHover: boolean;
  onGeometryClick?: (type: GeometryType, id: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const sketchSelectedEntityId = useAppSelector(selectSelectedEntityId);
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);
  const selectedToolState = useAppSelector(selectToolState);
  const sketchCurrentPlane = useAppSelector(selectCurrentPlane);

  const dispatch = useAppDispatch();
  const { size, camera, raycaster } = useThree();

  useEffect(() => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = hovered ? 'grab' : 'auto';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [hovered, selectedToolState, sketchLastDof]);

  const bind = useDrag(({ down, xy: [x, y] }) => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = down ? 'grabbing' : 'grab';

      const result = calcIntersectionWithPlaneFromRect(raycaster, camera, sketchCurrentPlane, x, y, size);
      if (result) {
        //console.log('down', down, 'result', result, 'midPoint', midPoint);
        if (!down) {
          const radius = result.sub(midPoint).length();
          //console.log('new circle radius', radius);
          dispatch(updateCircleRadius({ id: id, radius: radius }));
        }
      }
    }
  });

  const points = useMemo(() => {
    const points = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        getPointU(sketchCurrentPlane, midPoint),
        getPointV(sketchCurrentPlane, midPoint),
        radius,
        radius,
        0,
        2 * Math.PI,
        false,
        0
      ).getPoints(128)
    );
    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push(p);
    }
    return points;
  }, [midPoint, radius]);

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
      {...(bind() as any)}
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
