import { SketchCycleType } from '@/utils/algo3d';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Circle, Segment, Segments } from '@react-three/drei';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';
import ArcObject from './ArcObject';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { faceToMeshData } from './occt_visualize';

const SketchCycleObject = ({ sketchCycle, bitbybit }: { sketchCycle: SketchCycleType; bitbybit: BitByBitOCCT }) => {
  const segments = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.LINE) as Line3DInlinePointType[];
  const arcs = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.ARC) as ArcInlinePointType[];
  const circles = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.CIRCLE) as CircleInlinePointType[];

  //console.log('[SketchCycleObject], segments', segments);

  const [positions, setPositions] = useState<Float32Array>(new Float32Array());
  const [normals, setNormals] = useState<Float32Array>(new Float32Array());
  const [indices, setIndices] = useState<Uint32Array>(new Uint32Array());

  const updateFaceMesh = async () => {
    const meshData = await faceToMeshData(bitbybit, sketchCycle.face);
    setPositions(Float32Array.from(meshData.positions));
    setNormals(Float32Array.from(meshData.normals));
    setIndices(Uint32Array.from(meshData.indices));
  };

  // Disabled it because rendering using the data returned from occt fails with
  // WebGL warning: drawElementsInstanced: Index buffer too small.
  // It seems to not behave deterministic
  // useEffect(() => {
  //   updateFaceMesh();
  // }, [sketchCycle]);

  console.log('positions', positions, 'normals', normals, 'indices', indices);

  return (
    <>
      {segments.length > 0 && (
        <Segments
          limit={1000}
          lineWidth={1.0}
          // All THREE.LineMaterial props are valid
          // {...materialProps}
        >
          {segments.map((segment) => (
            <Segment
              key={String(segment.start) + '-' + String(segment.end)}
              start={segment.start}
              end={segment.end}
              color="blue"
            />
          ))}
        </Segments>
      )}

      {circles.map((circle) => (
        <Circle
          key={String(circle.mid_pt)}
          args={[circle.radius]}
          position={circle.mid_pt}
          onClick={(e) => console.log('circle clicked', e)}
        >
          <meshBasicMaterial color="blue" side={THREE.DoubleSide} transparent={true} opacity={0.5} />
        </Circle>
      ))}

      {arcs.map((arc) => (
        <ArcObject key={String(arc.mid_pt) + '-' + String(arc.radius) + String(arc.start_angle)} arc={arc} />
      ))}

      <mesh>
        <meshBasicMaterial color="blue" side={THREE.DoubleSide} transparent={true} opacity={0.7} />
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-normal" count={normals.length / 3} array={normals} itemSize={3} />
          <bufferAttribute attach="index" count={indices.length} array={indices} itemSize={1} />
        </bufferGeometry>
      </mesh>
    </>
  );
};

export default SketchCycleObject;
