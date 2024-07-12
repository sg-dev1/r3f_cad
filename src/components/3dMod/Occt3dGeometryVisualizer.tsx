import { Geometry3DType } from '@/app/types/Geometry3DType';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import React, { useEffect, useState } from 'react';
import { DecomposedOcctShapeDto, occtGetFacesWiresEdgesPoints4Shape } from './occt_visualize';
import OcctAllEdgesVisualizer from './OcctAllEdgesVisualizer';

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

  // TODO faces need to be visualized as well
  return (
    <>
      {decomposedOcctShape && <OcctAllEdgesVisualizer shape={decomposedOcctShape} visible={shape.geom3d.isVisible} />}
    </>
  );
};

export default Occt3dGeometryVisualizer;
