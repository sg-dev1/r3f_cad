/** This component visualizes a face using Occt. */
import React, { useEffect, useMemo, useState } from 'react';
import { Inputs } from '@bitbybit-dev/occt';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { BufferAttribute, BufferGeometry } from 'three';
import { Point, Points } from '@react-three/drei';
import { occtShapeToBufferGeometry } from './occt_visualize';

const OcctFaceVisualizer = ({
  bitbybitOcct,
  faceShape: faceShape,
  edgePoints,
  visible,
}: {
  bitbybitOcct: BitByBitOCCT;
  faceShape: Inputs.OCCT.TopoDSFacePointer;
  edgePoints: [number, number, number][][][][];
  visible: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const [bufferGeom, setBufferGeom] = useState<BufferGeometry | null>(null);

  useEffect(() => {
    // https://stackoverflow.com/a/66071205
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const bufferGeom = await occtShapeToBufferGeometry(bitbybitOcct, faceShape, 0.1);

      if (!active) {
        return;
      }
      setBufferGeom(bufferGeom);
    }
  }, [bitbybitOcct, faceShape]);

  //   const pointsOfDecomposedOcctShape: Inputs.Base.Point3[] = useMemo(() => {
  //     return edgePoints.flat(3);
  //   }, [edgePoints]);

  return (
    <>
      {bufferGeom && (
        <mesh
          frustumCulled={false}
          geometry={bufferGeom}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          //onClick={() => {
          //  if (sketchIsVisible && selectedSketch === sketchCycle.sketch.id) {
          //    dispatch(setSketchToExtrude([sketchCycle.sketch.id, sketchCycle.index]));
          //  }
          //}}
          visible={visible}
        >
          {/* - Use a positive polygonOffset to solve the z-fighting problem with SketchCycleObjectNg.tsx component
                (which has negative offset to be always drawn in front of this component)
              - Use MeshStandardMaterial (instead of MeshBasicMaterial) to see shadows
                https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial
                https://threejs.org/docs/index.html#api/en/materials/MeshBasicMaterial
           */}
          <meshStandardMaterial color={hovered ? 'yellow' : 'gray'} polygonOffset polygonOffsetFactor={0.1} />
        </mesh>
      )}

      {/* <Points frustumCulled={false} visible={visible}>
        <pointsMaterial vertexColors size={1} />
        {pointsOfDecomposedOcctShape.map((point, index) => {
          return <Point key={index} position={point} color="cyan" />;
        })}
      </Points> */}
    </>
  );
};

export default OcctFaceVisualizer;
