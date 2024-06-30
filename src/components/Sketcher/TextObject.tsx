/** This component contains the drawing functionality for text objects in the sketcher tool. */
import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { Vector3Tuple } from 'three';
import {
  selectSelectedConstraintId,
  setLengthConstraintLineId,
  setSelectedConstraintId,
} from '@/app/slices/sketchToolStateSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import * as THREE from 'three';

// lineId ... only needed for edit function of length constraint (of line)
const TextObject = ({
  position,
  quaternion,
  label,
  baseFontWeight,
  lineId,
  constraintId,
}: {
  position: Vector3Tuple;
  quaternion: THREE.Quaternion;
  label: string;
  baseFontWeight: number;
  lineId?: number;
  constraintId?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const sketchSelectedConstraintId = useAppSelector(selectSelectedConstraintId);
  const dispatch = useAppDispatch();

  const handleClickEvent = () => {
    if (lineId !== undefined) {
      dispatch(setLengthConstraintLineId(lineId));
    }
    if (constraintId !== undefined) {
      dispatch(setSelectedConstraintId(constraintId));
    }
  };

  // TODO colors should be configurable via redux store
  const getColor = () => {
    if (constraintId === sketchSelectedConstraintId) {
      return 'yellow';
    } else {
      return hovered ? 'darkred' : 'red';
    }
  };

  return (
    <Text
      position={position}
      quaternion={quaternion}
      color={getColor()}
      anchorX="center"
      anchorY="middle"
      fontSize={12}
      fontWeight={hovered ? baseFontWeight * 2 : baseFontWeight}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => handleClickEvent()}
    >
      {label}
    </Text>
  );
};

export default TextObject;
