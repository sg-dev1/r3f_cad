import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addConstraint,
  selectConstraints,
  selectLastDof,
  selectLastSolverResultCode,
  updateConstraint,
  updateLinePoints,
} from '@/app/slices/sketchSlice';
import {
  ToolState,
  selectCurrentPlane,
  selectLengthConstraintLineId,
  selectSelectedEntityId,
  selectToolState,
  setLengthConstraintLineId,
} from '@/app/slices/sketchToolStateSlice';
import { SlvsConstraints } from '@/app/types/Constraints';
import { GeometryType } from '@/app/types/EntityType';
import { calcIntersectionWithPlaneFromRect } from '@/utils/threejs_utils';
import { Html, Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { useEffect, useState } from 'react';
import TextObject from './TextObject';

//   update the data in the redux store as well
const LineObject = ({
  id,
  pt1_id,
  pt2_id,
  start,
  end,
  onGeometryClick,
}: {
  id: number;
  pt1_id: number;
  pt2_id: number;
  start: [x: number, y: number, z: number];
  end: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
}) => {
  const [lastClickPos, setLastClickPos] = useState<number[]>([]);

  const sketchConstraints = useAppSelector(selectConstraints);
  const constraintsAffectingLine = sketchConstraints.filter((c) => c.v[3] === id || c.v[4] === id);
  const horizontalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_HORIZONTAL);
  const verticalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_VERTICAL);
  const lengthConstraints = sketchConstraints.filter(
    (c) =>
      (c.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE && c.v[1] === pt1_id && c.v[2] == pt2_id) ||
      (c.v[2] === pt1_id && c.v[1] == pt2_id)
  );
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);

  const sketchLengthConstraintLineId = useAppSelector(selectLengthConstraintLineId);
  const sketchSelectedEntityId = useAppSelector(selectSelectedEntityId);
  const selectedToolState = useAppSelector(selectToolState);
  const sketchCurrentPlane = useAppSelector(selectCurrentPlane);

  const dispatch = useAppDispatch();
  const { size, camera, raycaster } = useThree();

  // Drag n drop, hover
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = hovered ? 'grab' : 'auto';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [hovered, selectedToolState, sketchLastDof]);

  const bind = useDrag(({ down, xy: [x, y] }) => {
    if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof !== 0) {
      document.body.style.cursor = down ? 'grabbing' : 'grab';

      const result = calcIntersectionWithPlaneFromRect(raycaster, camera, sketchCurrentPlane, x, y, size);
      if (result) {
        //console.log('down', down, 'result', result, 'start', start, 'end', end);

        if (down) {
          if (lastClickPos.length === 0) {
            setLastClickPos([result.x, result.y]);
          }
        } else {
          if (lastClickPos.length !== 0) {
            const diff = [result.x - lastClickPos[0], result.y - lastClickPos[1]];
            //console.log('diff', diff, 'result', result, 'lastClickPos', lastClickPos);
            dispatch(
              updateLinePoints({
                id: id,
                newStart: [start[0] + diff[0], start[1] + diff[1], start[2]],
                newEnd: [end[0] + diff[0], end[1] + diff[0], end[2]],
              })
            );
          }

          setLastClickPos([]);
        }
      } else {
        setLastClickPos([]);
      }

      //setPos(new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0).unproject(camera).multiply({ x: 1, y: 1, z: 0 }).clone())
      //dispatch(updatePoint({ id: id, position: [newPos.x, newPos.y, newPos.z] }));
    }
  });

  return (
    <>
      <Line
        {...(bind() as any)}
        userData={{ id: id }}
        points={[start, end]} // array of points
        // use green color for fully constraint
        color={
          sketchSelectedEntityId === id
            ? 'yellow'
            : sketchLastSolverResultCode !== 0
            ? 'red'
            : sketchLastDof === 0
            ? 'green'
            : hovered
            ? 'black'
            : 'white'
        } // TODO color should be configured via redux store
        onClick={(e) => onGeometryClick(GeometryType.LINE, e.eventObject.userData.id)}
        onPointerOver={() => {
          //console.log('onPointerOver');
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        lineWidth={hovered ? 4 : 1.5} // default is 1
        segments
        dashed={false} // default
      />

      {verticalConstraints.length > 0 ? (
        <TextObject
          position={[(start[0] + end[0]) / 2 - 5, (start[1] + end[1]) / 2 + 5, (start[2] + end[2]) / 2]}
          baseFontWeight={1000}
          label={'|'}
          constraintId={verticalConstraints[0].id}
        />
      ) : (
        ''
      )}
      {horizontalConstraints.length > 0 ? (
        <TextObject
          position={[(start[0] + end[0]) / 2 + 3, (start[1] + end[1]) / 2 + 15, (start[2] + end[2]) / 2]}
          baseFontWeight={1000}
          label={'_'}
          constraintId={horizontalConstraints[0].id}
        />
      ) : (
        ''
      )}

      {/* Number input for length constraint */}
      {sketchLengthConstraintLineId === id ? (
        <Html position={[(start[0] + end[0]) / 2 - 3, (start[1] + end[1]) / 2 - 2, (start[2] + end[2]) / 2]}>
          <input
            type="number"
            placeholder=""
            size={5}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                //console.log('onKeyDown', e, input.value);
                const value = parseFloat(input.value);
                if (isNaN(value)) {
                  console.error('Value was Nan. Cannot add constraint');
                  input.value = '';
                  return;
                }

                if (lengthConstraints.length === 0) {
                  dispatch(
                    addConstraint({
                      id: 0,
                      t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
                      v: [value, pt1_id, pt2_id, 0, 0],
                    })
                  );
                } else {
                  dispatch(
                    updateConstraint({
                      id: lengthConstraints[0].id,
                      t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
                      v: [value, pt1_id, pt2_id, 0, 0],
                    })
                  );
                }

                dispatch(setLengthConstraintLineId(-1));
              }
            }}
          />
        </Html>
      ) : (
        ''
      )}

      {/* Display a length constraint */}
      {lengthConstraints.length > 0 && (
        <TextObject
          position={[(start[0] + end[0]) / 2 + 15, (start[1] + end[1]) / 2 - 12, (start[2] + end[2]) / 2]}
          baseFontWeight={500}
          label={String(lengthConstraints[0].v[0])}
          constraintId={lengthConstraints[0].id}
          lineId={id}
        />
      )}
    </>
  );
};

export default LineObject;
