// TODO this component is no longer needed
// it may be removed
import { ArcInlinePointType } from '@/app/types/ArcType';
import { Line, Point, Points } from '@react-three/drei';
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';

const ArcObject = ({ arc }: { arc: ArcInlinePointType }) => {
  const [hovered, setHovered] = useState<boolean>(false);

  const points = useMemo(() => {
    const points = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(
        arc.midPt2d[0],
        arc.midPt2d[1],
        arc.radius,
        arc.radius,
        arc.start_angle,
        arc.end_angle,
        arc.clockwise,
        0 // aRotation, see https://threejs.org/docs/index.html#api/en/extras/curves/EllipseCurve
      ).getPoints(128)
    );
    let positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(positions, i);
      points.push(p);
    }
    return points;
  }, [arc]);

  if (points.length === 0) {
    return <></>;
  }

  return (
    <>
      <Line
        points={points}
        color={hovered ? 'yellow' : 'blue'}
        onPointerOver={() => {
          setHovered(true);
          //console.log('arc', arc);
        }}
        onPointerOut={() => setHovered(false)}
      />
      {/* <Points>
        <pointsMaterial vertexColors size={4} />
        <Point position={arc.mid_pt} color={hovered ? 'yellow' : 'blue'} />
      </Points> */}
    </>
  );
};

export default ArcObject;
