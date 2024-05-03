import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { Vector3Tuple } from 'three';
import { setLengthConstraintLineId, setSelectedConstraintId } from '@/app/slices/sketchToolStateSlice';
import { useAppDispatch } from '@/app/hooks';

const TextObject = ({
  position,
  label,
  baseFontWeight,
  lineId,
  constraintId,
}: {
  position: Vector3Tuple;
  label: string;
  baseFontWeight: number;
  lineId?: number;
  constraintId?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const dispatch = useAppDispatch();

  const handleClickEvent = () => {
    if (lineId !== undefined) {
      dispatch(setLengthConstraintLineId(lineId));
    }
    if (constraintId !== undefined) {
      dispatch(setSelectedConstraintId(constraintId));
    }
  };

  return (
    <Text
      position={position}
      color={hovered ? 'darkred' : 'red'}
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
