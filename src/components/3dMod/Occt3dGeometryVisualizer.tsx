/** This component visualizes 3D geometry using Occt. */
import { Geometry3DType } from '@/app/types/Geometry3DType';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import React, { useEffect, useMemo, useState } from 'react';
import { DecomposedOcctShapeDto, occtGetFacesWiresEdgesPoints4Shape } from './occt_visualize';
import OcctFaceVisualizer from './OcctFaceVisualizer';
import OcctEdgeVisualizer from './OcctEdgeVisualizer';

const Occt3dGeometryVisualizer = ({ bitbybitOcct, shape }: { bitbybitOcct: BitByBitOCCT; shape: Geometry3DType }) => {
  const [decomposedOcctShape, setDecomposedOcctShape] = useState<DecomposedOcctShapeDto | null>(null);

  useEffect(() => {
    // https://stackoverflow.com/a/66071205
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const decomposedOcctShape = await occtGetFacesWiresEdgesPoints4Shape(bitbybitOcct, shape.occtShape);
      if (!active) {
        return;
      }
      setDecomposedOcctShape(decomposedOcctShape);
    }
  }, [bitbybitOcct, shape]);

  // const edgesOfDecomposedOcctShape: Inputs.OCCT.TopoDSEdgePointer[] = useMemo(() => {
  //   if (decomposedOcctShape === null) {
  //     return [];
  //   }
  //   return decomposedOcctShape.edges.flat(2);
  // }, [decomposedOcctShape]);
  const pointsOfDecomposedOcctShape: Inputs.Base.Point3[][] = useMemo(() => {
    if (decomposedOcctShape === null) {
      return [];
    }
    return decomposedOcctShape.points.flat(3);
  }, [decomposedOcctShape]);

  //console.log('decomposedOcctShape.faces', decomposedOcctShape?.faces);
  //console.log('pointsOfDecomposedOcctShape', pointsOfDecomposedOcctShape);

  return (
    <>
      {pointsOfDecomposedOcctShape.map((edgePoints, index) => {
        return <OcctEdgeVisualizer key={index} points={edgePoints} visible={shape.geom3d.isVisible} />;
      })}

      {decomposedOcctShape &&
        decomposedOcctShape.faces.map((face, index) => (
          <OcctFaceVisualizer
            key={index}
            bitbybitOcct={bitbybitOcct}
            faceShape={face}
            edgePoints={decomposedOcctShape.points[index]}
            visible={shape.geom3d.isVisible}
          />
        ))}
    </>
  );
};

export default Occt3dGeometryVisualizer;
