/** This component contains the main geometry drawing functionality of occt 3D geometry. */
import React, { useEffect, useState } from 'react';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { occtShapeToBufferGeoms } from './occt_visualize';
import * as THREE from 'three';
import { Geometry3DType } from '@/app/types/Geometry3DType';

const TopoDSVisualizer = ({ bitbybitOcct, shape }: { bitbybitOcct: BitByBitOCCT; shape: Geometry3DType }) => {
  const [shapeGeometries, setShapeGeometries] = useState<THREE.BufferGeometry[]>([]);

  useEffect(() => {
    // https://stackoverflow.com/a/66071205
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const geometries = await occtShapeToBufferGeoms(bitbybitOcct, shape.occtShape, 0.01);
      if (!active) {
        return;
      }
      setShapeGeometries(geometries);
    }
  }, [bitbybitOcct, shape]);

  // check if visible at all
  if (!shape.geom3d?.isVisible) {
    return <></>;
  }

  return (
    <>
      {/* All faces of the shape are represented by its own buffer geometry.
      Therefore multiple of them need to be rendered.
      What about performance? Is there a better way to do it? */}
      {shapeGeometries.map((geom, index) => (
        <mesh
          key={index}
          geometry={geom}
          //onPointerOver={() => setHovered(true)}
          //onPointerOut={() => setHovered(false)}
          //onClick={() => dispatch(setSketchToExtrude([sketchCycle.sketch.id, sketchCycle.index]))}
        >
          {/* side={THREE.DoubleSide} as in SketchCycleObjectNg not needed since the inside is not visible */}
          <meshBasicMaterial color={'blue'} />
        </mesh>
      ))}
    </>
  );
};

export default TopoDSVisualizer;
