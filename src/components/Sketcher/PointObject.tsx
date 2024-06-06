import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectConstraints, selectLastDof, selectSketchCurrentPlane, updatePoint } from '@/app/slices/sketchSlice';
import { ToolState, selectSelectedEntityId, selectToolState } from '@/app/slices/sketchToolStateSlice';
import { SlvsConstraints } from '@/app/types/Constraints';
import { GeometryType } from '@/app/types/EntityType';
import { calcIntersectionWithPlaneFromRect } from '@/utils/threejs_utils';
import { Point } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { useEffect, useState } from 'react';
import TextObject from './TextObject';

const PointObject = ({
  id,
  position,
  onGeometryClick,
  onGeometryPointerOver,
  onGeometryPointerOut,
}: {
  id: number;
  position: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
  onGeometryPointerOver: (type: GeometryType, id: number) => void;
  onGeometryPointerOut: (type: GeometryType, id: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const sketchLastDof = useAppSelector(selectLastDof);
  const sketchSelectedEntityId = useAppSelector(selectSelectedEntityId);
  const selectedToolState = useAppSelector(selectToolState);
  const sketchCurrentPlane = useAppSelector(selectSketchCurrentPlane);
  const sketchConstraints = useAppSelector(selectConstraints);
  const constraintsAffectingPoint = sketchConstraints.filter((c) => c.v[1] === id || c.v[2] === id);
  const midPointConstraints = constraintsAffectingPoint.filter((c) => c.t === SlvsConstraints.SLVS_C_AT_MIDPOINT);
  const pointOnObjectConstraints = constraintsAffectingPoint.filter(
    (c) => c.t === SlvsConstraints.SLVS_C_PT_ON_LINE || c.t === SlvsConstraints.SLVS_C_PT_ON_CIRCLE
  );

  const dispatch = useAppDispatch();
  const { size, camera, raycaster } = useThree();

  useEffect(() => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = hovered ? 'grab' : 'auto';
    } else if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof === 0) {
      document.body.style.cursor = 'auto';
    }
  }, [hovered, selectedToolState, sketchLastDof]);
  const bind = useDrag(({ down, xy: [x, y] }) => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = down ? 'grabbing' : 'grab';

      const result = calcIntersectionWithPlaneFromRect(raycaster, camera, sketchCurrentPlane, x, y, size);
      if (result) {
        //console.log('result', result);
        dispatch(updatePoint({ id: id, position: [result.x, result.y, result.z] }));
      }

      //setPos(new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0).unproject(camera).multiply({ x: 1, y: 1, z: 0 }).clone())
      //dispatch(updatePoint({ id: id, position: [newPos.x, newPos.y, newPos.z] }));
    }
  });

  return (
    <>
      <Point
        {...(bind() as any)}
        userData={{ id: id }}
        position={position}
        color={sketchSelectedEntityId === id ? 'yellow' : hovered ? 'darkred' : 'red'} // TODO color should be configured via redux store
        onClick={(e) => onGeometryClick(GeometryType.POINT, e.eventObject.userData.id)}
        onPointerOver={(e) => {
          //console.log('onPointerOver point', e);
          setHovered(true);
          onGeometryPointerOver(GeometryType.POINT, e.eventObject.userData.id);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          onGeometryPointerOut(GeometryType.POINT, e.eventObject.userData.id);
        }}
        //size={hovered ? 8 : 4}  // changing size seems to not work, most likely due to using Points component
      />

      {midPointConstraints.length > 0 && (
        <TextObject
          position={[position[0], position[1] - 10, position[2]]}
          baseFontWeight={500}
          label={'>.<'}
          constraintId={midPointConstraints[0].id}
        />
      )}

      {pointOnObjectConstraints.length > 0 && (
        <TextObject
          position={[position[0], position[1] - 10, position[2]]}
          baseFontWeight={500}
          label={'(.)'}
          constraintId={pointOnObjectConstraints[0].id}
        />
      )}
    </>
  );
};

export default PointObject;
