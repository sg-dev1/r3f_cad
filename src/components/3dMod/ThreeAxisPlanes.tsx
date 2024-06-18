import { Plane, Point, Points } from '@react-three/drei';
import React, { useState } from 'react';
import * as THREE from 'three';

interface ThreeAxisPlanesProps {
  isVisible: boolean;
  onPlaneClicked: (plane: 'xy' | 'xz' | 'yz') => void;
}

const ThreeAxisPlanes = ({ isVisible, onPlaneClicked }: ThreeAxisPlanesProps) => {
  if (!isVisible) {
    return <></>;
  }

  const [xyPlaneHovered, setXyPlaneHovered] = useState<boolean>(false);
  const [xzPlaneHovered, setXzPlaneHovered] = useState<boolean>(false);
  const [yzPlaneHovered, setYzPlaneHovered] = useState<boolean>(false);

  return (
    <>
      {/* XY */}
      <Plane
        args={[100, 100]}
        onPointerOver={(e) => {
          setXyPlaneHovered(true);
          e.stopPropagation();
        }}
        onPointerOut={(e) => setXyPlaneHovered(false)}
        onClick={(e) => {
          onPlaneClicked('xy');
          e.stopPropagation();
        }}
      >
        <meshBasicMaterial
          color={xyPlaneHovered ? 'yellow' : 'blue'}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </Plane>

      {/* XZ */}
      <Plane
        args={[100, 100]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          setXzPlaneHovered(true);
          e.stopPropagation();
        }}
        onPointerOut={(e) => setXzPlaneHovered(false)}
        onClick={(e) => {
          onPlaneClicked('xz');
          e.stopPropagation();
        }}
      >
        <meshBasicMaterial
          color={xzPlaneHovered ? 'yellow' : 'green'}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </Plane>

      {/* YZ */}
      <Plane
        args={[100, 100]}
        rotation={[0, Math.PI / 2, 0]}
        onPointerOver={(e) => {
          setYzPlaneHovered(true);
          e.stopPropagation();
        }}
        onPointerOut={(e) => setYzPlaneHovered(false)}
        onClick={(e) => {
          onPlaneClicked('yz');
          e.stopPropagation();
        }}
      >
        <meshBasicMaterial
          color={yzPlaneHovered ? 'yellow' : 'red'}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </Plane>

      <Points>
        <pointsMaterial vertexColors size={4} />
        <Point
          position={[0, 0, 0]}
          color={'magenta'} // TODO color should be configured via redux store
        />
      </Points>
    </>
  );
};

export default ThreeAxisPlanes;
