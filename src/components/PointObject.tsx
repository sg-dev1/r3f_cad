import { GeometryType } from '@/app/types/GeometryType';
import { Point } from '@react-three/drei';
import { useState } from 'react';

const PointObject = ({
  id,
  position,
  onGeometryClick,
}: {
  id: number;
  position: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Point
      userData={{ id: id }}
      position={position}
      color={hovered ? 'darkred' : 'red'} // TODO color should be configured via redux store
      onClick={(e) => onGeometryClick(GeometryType.POINT, e.eventObject.userData.id)}
      onPointerOver={(e) => {
        //console.log('onPointerOver point', e);
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      //size={hovered ? 8 : 4}  // changing size seems to not work, most likely due to using Points component
    />
  );
};

export default PointObject;
