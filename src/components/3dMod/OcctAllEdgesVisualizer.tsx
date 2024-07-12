import React, { useMemo } from 'react';
import { DecomposedOcctShapeDto } from './occt_visualize';
import { Line } from '@react-three/drei';
import OcctEdgeVisualizer from './OcctEdgeVisualizer';

const OcctAllEdgesVisualizer = ({ shape, visible }: { shape: DecomposedOcctShapeDto; visible: boolean }) => {
  const edges = useMemo(() => {
    return shape.edges.flat(2);
  }, [shape]);
  const points = useMemo(() => {
    return shape.points.flat(3);
  }, [shape]);

  //console.log('---edges', edges);
  //console.log('---points', points);

  return (
    <>
      {edges.map((edge, index) => {
        const edgePoints = points[index];
        return <OcctEdgeVisualizer key={index} points={edgePoints} visible={visible} />;
      })}
    </>
  );
};

export default OcctAllEdgesVisualizer;
