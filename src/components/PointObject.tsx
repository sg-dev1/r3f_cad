import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updatePoint } from '@/app/slices/sketchSlice';
import { selectSelectedEntityId } from '@/app/slices/sketchToolStateSlice';
import { GeometryType } from '@/app/types/EntityType';
import { XY_PLANE } from '@/utils/threejs_planes';
import { calcIntersectionWithPlaneFromRect } from '@/utils/threejs_utils';
import { Point } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { useEffect, useState } from 'react';

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
  const sketchSelectedEntityId = useAppSelector(selectSelectedEntityId);

  const dispatch = useAppDispatch();
  const { size, camera, raycaster } = useThree();

  useEffect(() => void (document.body.style.cursor = hovered ? 'grab' : 'auto'), [hovered]);
  const bind = useDrag(({ down, xy: [x, y] }) => {
    document.body.style.cursor = down ? 'grabbing' : 'grab';

    const result = calcIntersectionWithPlaneFromRect(raycaster, camera, XY_PLANE, x, y, size);
    if (result) {
      //console.log('result', result);
      dispatch(updatePoint({ id: id, position: [result.x, result.y, result.z] }));
    }

    //setPos(new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0).unproject(camera).multiply({ x: 1, y: 1, z: 0 }).clone())
    //dispatch(updatePoint({ id: id, position: [newPos.x, newPos.y, newPos.z] }));
  });

  return (
    <Point
      {...(bind() as any)}
      userData={{ id: id }}
      position={position}
      color={sketchSelectedEntityId === id ? 'yellow' : hovered ? 'darkred' : 'red'} // TODO color should be configured via redux store
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
