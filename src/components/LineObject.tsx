import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addConstraint,
  selectConstraints,
  selectLastDof,
  selectLastSolverResultCode,
  selectLines,
  selectPointsMap,
  updateConstraint,
  updateLinePoints,
} from '@/app/slices/sketchSlice';
import {
  ToolState,
  selectAngleConstraintLineIds,
  selectCurrentPlane,
  selectLengthConstraintLineId,
  selectSelectedEntityId,
  selectToolState,
  setAngleConstraintLineIds,
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
  onGeometryPointerOver,
  onGeometryPointerOut,
}: {
  id: number;
  pt1_id: number;
  pt2_id: number;
  start: [x: number, y: number, z: number];
  end: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
  onGeometryPointerOver: (type: GeometryType, id: number) => void;
  onGeometryPointerOut: (type: GeometryType, id: number) => void;
}) => {
  const [lastClickPos, setLastClickPos] = useState<number[]>([]);

  const sketchLines = useAppSelector(selectLines);
  const sketchPointsMap = useAppSelector(selectPointsMap);
  const sketchConstraints = useAppSelector(selectConstraints);
  const constraintsAffectingLine = sketchConstraints.filter((c) => c.v[3] === id || c.v[4] === id);
  const horizontalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_HORIZONTAL);
  const verticalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_VERTICAL);
  const lengthConstraints = sketchConstraints.filter(
    (c) =>
      (c.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE && c.v[1] === pt1_id && c.v[2] == pt2_id) ||
      (c.v[2] === pt1_id && c.v[1] == pt2_id)
  );
  const parallelConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_PARALLEL);
  const equalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_EQUAL_LENGTH_LINES);
  // only select the constraint for the second line at c.v[4] in constraintsAffectingLine
  const angleConstraints = constraintsAffectingLine.filter(
    (c) => c.t === SlvsConstraints.SLVS_C_ANGLE && c.v[4] === id
  );
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);

  const sketchLengthConstraintLineId = useAppSelector(selectLengthConstraintLineId);
  const sketchAngleConstraintLineIds = useAppSelector(selectAngleConstraintLineIds);
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
    } else if (selectedToolState === ToolState.CURSOR_TOOL && sketchLastDof === 0) {
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
        onPointerOver={(e) => {
          //console.log('onPointerOver');
          setHovered(true);
          onGeometryPointerOver(GeometryType.LINE, e.eventObject.userData.id);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          onGeometryPointerOut(GeometryType.LINE, e.eventObject.userData.id);
        }}
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

      {parallelConstraints.length > 0 && (
        <TextObject
          position={[(start[0] + end[0]) / 2 + 3, (start[1] + end[1]) / 2 + 15, (start[2] + end[2]) / 2]}
          baseFontWeight={500}
          label={'||'}
          constraintId={parallelConstraints[0].id}
        />
      )}

      {equalConstraints.length > 0 && (
        <TextObject
          position={[(start[0] + end[0]) / 2 - 3, (start[1] + end[1]) / 2 - 10, (start[2] + end[2]) / 2]}
          baseFontWeight={1000}
          label={'='}
          constraintId={equalConstraints[0].id}
        />
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

      {sketchAngleConstraintLineIds[1] === id && (
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

                if (
                  angleConstraints.length === 0 ||
                  (angleConstraints[0].v[3] !== sketchAngleConstraintLineIds[0] &&
                    angleConstraints[0].v[4] !== sketchAngleConstraintLineIds[1]) ||
                  (angleConstraints[0].v[3] !== sketchAngleConstraintLineIds[1] &&
                    angleConstraints[0].v[4] !== sketchAngleConstraintLineIds[0])
                ) {
                  dispatch(
                    addConstraint({
                      id: 0,
                      t: SlvsConstraints.SLVS_C_ANGLE,
                      v: [value, 0, 0, sketchAngleConstraintLineIds[0], sketchAngleConstraintLineIds[1]],
                    })
                  );
                } else {
                  dispatch(
                    updateConstraint({
                      id: angleConstraints[0].id,
                      t: SlvsConstraints.SLVS_C_ANGLE,
                      v: [value, 0, 0, angleConstraints[0].v[3], angleConstraints[0].v[4]],
                    })
                  );
                }

                dispatch(setAngleConstraintLineIds([-1, -1]));
              }
            }}
          />
        </Html>
      )}

      {angleConstraints.map((angleConstraint) => {
        const otherLine = sketchLines.filter((line) => line.id === angleConstraint.v[3]);
        const this_mid: [number, number, number] = [
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2,
          (start[2] + end[2]) / 2,
        ];
        let mid: [number, number, number] | null = null;
        let textPosition: [number, number, number];
        if (otherLine.length > 0) {
          const pt1 = sketchPointsMap[otherLine[0].p1_id];
          const pt2 = sketchPointsMap[otherLine[0].p2_id];
          mid = [(pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2, (pt1.z + pt2.z) / 2];
        }
        if (mid) {
          textPosition = [(mid[0] + this_mid[0]) / 2, (mid[1] + this_mid[1]) / 2, (mid[2] + this_mid[2]) / 2];
        } else {
          textPosition = this_mid;
        }
        //console.log('mid', mid, 'this_mid', this_mid, 'textPosition', textPosition);
        return (
          <>
            {mid && (
              <Line
                points={[mid, this_mid]} // array of points
                color={'red'}
                lineWidth={1.5} // default is 1
                segments
                dashed={false} // default
              />
            )}
            <TextObject
              key={angleConstraint.id}
              position={textPosition}
              baseFontWeight={500}
              label={String(angleConstraint.v[0]) + '°'}
              constraintId={angleConstraint.id}
              lineId={id}
            />
          </>
        );
      })}
    </>
  );
};

export default LineObject;
