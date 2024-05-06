import { GeometryType } from '@/app/types/EntityType';
import { Line, Point, Points } from '@react-three/drei';
import React, { useState } from 'react';

const ZeroCoordinateCross = ({
  onGeometryClick,
  onGeometryPointerOver,
  onGeometryPointerOut,
}: {
  onGeometryClick: (type: GeometryType, id: number) => void;
  onGeometryPointerOver: (type: GeometryType, id: number) => void;
  onGeometryPointerOut: (type: GeometryType, id: number) => void;
}) => {
  const [originHovered, setOriginHovered] = useState(false);
  const [xAxisHovered, setXAxisHovered] = useState(false);
  const [yAxisHovered, setYAxisHovered] = useState(false);

  return (
    <>
      <Line
        points={[
          [0, -1000, 0],
          [0, 1000, 0],
        ]} // array of points
        color={'gray'}
        lineWidth={xAxisHovered ? 3 : 1.5} // default is 1
        segments
        dashed={false} // default
        onPointerOver={(e) => setXAxisHovered(true)}
        onPointerOut={() => setXAxisHovered(false)}
        //onClick={(e) => onGeometryClick(GeometryType.LINE, e.eventObject.userData.id)}
      />
      <Line
        points={[
          [-1000, 0, 0],
          [1000, 0, 0],
        ]} // array of points
        color={'gray'}
        lineWidth={yAxisHovered ? 3 : 1.5} // default is 1
        segments
        dashed={false} // default
        onPointerOver={(e) => setYAxisHovered(true)}
        onPointerOut={() => setYAxisHovered(false)}
        //onClick={(e) => onGeometryClick(GeometryType.LINE, e.eventObject.userData.id)}
      />
      <Points>
        <pointsMaterial vertexColors size={8} />
        <Point
          userData={{ id: 'zero' }} // To be checked if this works, because normally a number is expected for id
          position={[0, 0, 0]}
          color={originHovered ? 'darkmagenta' : 'magenta'} // TODO color should be configured via redux store
          onClick={(e) => onGeometryClick(GeometryType.POINT, e.eventObject.userData.id)}
          onPointerOver={(e) => {
            //console.log('onPointerOver point', e);
            setOriginHovered(true);
            onGeometryPointerOver(GeometryType.POINT, e.eventObject.userData.id);
          }}
          onPointerOut={(e) => {
            setOriginHovered(false);
            onGeometryPointerOut(GeometryType.POINT, e.eventObject.userData.id);
          }}
        />
      </Points>
    </>
  );
};

export default ZeroCoordinateCross;
