/** This component contains the main geometry drawing functionality of occt 3D geometry.
 *  Simple way to visualize by
 *  - converting the occt shape to a mesh (bitbybitOcct.occt.shapeToMesh)
 *  - visualize the mesh by using a buffer geometry
 *  - additionally, show a Wireframe for the mesh
 *
 * Maybe this should be called MeshVisualizer.tsx
 */
import React, { useEffect, useState } from 'react';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { occtShapeToBufferGeometry, occtShapeToBufferGeoms } from './occt_visualize';
import * as THREE from 'three';
import { Geometry3DType } from '@/app/types/Geometry3DType';
import { Wireframe } from '@react-three/drei';

const TopoDSVisualizer = ({ bitbybitOcct, shape }: { bitbybitOcct: BitByBitOCCT; shape: Geometry3DType }) => {
  const [shapeGeometry, setShapeGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    // https://stackoverflow.com/a/66071205
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const bufferGeometry = await occtShapeToBufferGeometry(bitbybitOcct, shape.occtShape, 0.1);
      if (!active) {
        return;
      }
      setShapeGeometry(bufferGeometry);
    }
  }, [bitbybitOcct, shape]);

  return (
    <>
      {shapeGeometry && (
        <>
          <mesh
            geometry={shapeGeometry}
            visible={shape.geom3d?.isVisible}
            //onPointerOver={() => setHovered(true)}
            //onPointerOut={() => setHovered(false)}
            //onClick={() => dispatch(setSketchToExtrude([sketchCycle.sketch.id, sketchCycle.index]))}
          >
            {/* side={THREE.DoubleSide} as in SketchCycleObjectNg not needed since the inside is not visible */}
            <meshBasicMaterial color={'blue'} />
            {/* <meshStandardMaterial color={'blue'} /> */}
          </mesh>
          {/* Use the second way to display the Wireframe from
          https://github.com/pmndrs/drei?tab=readme-ov-file#wireframe
          The first way inside the mesh behaved a bit buggy. */}
          <Wireframe
            geometry={shapeGeometry} // Will create the wireframe based on input geometry.
            visible={shape.geom3d?.isVisible}
            // Other props
            simplify={false} // Remove some edges from wireframes
            fill={'#00ff00'} // Color of the inside of the wireframe
            fillMix={0} // Mix between the base color and the Wireframe 'fill'. 0 = base; 1 = wireframe
            fillOpacity={0.25} // Opacity of the inner fill
            stroke={'#E0E0E0'} // Color of the stroke
            strokeOpacity={1} // Opacity of the stroke
            thickness={0.01} // Thinkness of the lines
            colorBackfaces={false} // Whether to draw lines that are facing away from the camera
            backfaceStroke={'#0000ff'} // Color of the lines that are facing away from the camera
            dashInvert={true} // Invert the dashes
            dash={false} // Whether to draw lines as dashes
            dashRepeats={4} // Number of dashes in one seqment
            dashLength={0.5} // Length of each dash
            squeeze={false} // Narrow the centers of each line segment
            squeezeMin={0.2} // Smallest width to squueze to
            squeezeMax={1} // Largest width to squeeze from
          />
        </>
      )}
    </>
  );
};

export default TopoDSVisualizer;
