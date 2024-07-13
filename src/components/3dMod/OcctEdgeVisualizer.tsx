/** This component visualizes an edge of a 3d shape. */
import { Line } from '@react-three/drei';
import React, { useState } from 'react';

const OcctEdgeVisualizer = ({ points, visible }: { points: [number, number, number][]; visible: boolean }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Line
      points={points}
      color={hovered ? 'yellow' : 'black'}
      lineWidth={hovered ? 4 : 1.5}
      visible={visible}
      onPointerOver={(e) => {
        setHovered(true);
      }}
      onPointerOut={(e) => {
        setHovered(false);
      }}
    />
  );
};

export default OcctEdgeVisualizer;
