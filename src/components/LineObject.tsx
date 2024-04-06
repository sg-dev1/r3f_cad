// Functionality required for this custom Line component
// - Highlight color + make thicker on mouse over                (done)
// - Selection with on click (then maybe different color)        // selection not needed now
// - drag'n'drop - a bit more tricky since it needs to           // will be implemented later
//                 consider constraints

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addConstraint,
  selectConstraints,
  selectLastDof,
  selectLastSolverResultCode,
  selectLengthConstraintLineId,
  setLengthConstraintLineId,
} from '@/app/slices/sketchSlice';
import { SlvsConstraints } from '@/app/types/Constraints';
import { GeometryType } from '@/app/types/GeometryType';
import { Html, Line } from '@react-three/drei';
import { useState } from 'react';

//   update the data in the redux store as well
const LineObject = ({
  id,
  start,
  end,
  onGeometryClick,
  length,
}: {
  id: number;
  start: [x: number, y: number, z: number];
  end: [x: number, y: number, z: number];
  onGeometryClick: (type: GeometryType, id: number) => void;
  length?: number;
}) => {
  const sketchConstraints = useAppSelector(selectConstraints);
  const constraintsAffectingLine = sketchConstraints.filter((c) => c.v[3] === id || c.v[4] === id);
  const horizontalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_HORIZONTAL);
  const verticalConstraints = constraintsAffectingLine.filter((c) => c.t === SlvsConstraints.SLVS_C_VERTICAL);
  const sketchLastSolverResultCode = useAppSelector(selectLastSolverResultCode);
  const sketchLastDof = useAppSelector(selectLastDof);

  const sketchLengthConstraintLineId = useAppSelector(selectLengthConstraintLineId);

  const dispatch = useAppDispatch();

  // Drag n drop, hover
  const [hovered, setHovered] = useState(false);
  //useEffect(() => void (document.body.style.cursor = hovered ? 'grab' : 'auto'), [hovered]);
  //const bind = useDrag(({ down, xy: [x, y] }) => {
  //  document.body.style.cursor = down ? 'grabbing' : 'grab';
  //setPos(new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0).unproject(camera).multiply({ x: 1, y: 1, z: 0 }).clone())
  //});

  return (
    <>
      <Line
        userData={{ id: id }}
        points={[start, end]} // array of points
        // use green color for fully constraint
        color={sketchLastSolverResultCode !== 0 ? 'red' : sketchLastDof === 0 ? 'green' : hovered ? 'black' : 'white'} // TODO color should be configured via redux store
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
      {/* TODO the positioning of constraints needs to be improved - weird behaviour when zooming in and out */}
      {verticalConstraints.length > 0 ? (
        <Html position={[(start[0] + end[0]) / 2 + 3, (start[1] + end[1]) / 2 + 8, (start[2] + end[2]) / 2]}>
          <div style={{ color: 'red', fontSize: 20, fontWeight: 'bold' }}>|</div>
        </Html>
      ) : (
        ''
      )}
      {horizontalConstraints.length > 0 ? (
        <Html position={[(start[0] + end[0]) / 2 + 1, (start[1] + end[1]) / 2 + 15, (start[2] + end[2]) / 2]}>
          <div style={{ color: 'red', fontSize: 50 }}>-</div>
        </Html>
      ) : (
        ''
      )}

      {/* Number input for length constraint */}
      {sketchLengthConstraintLineId === id ? (
        <Html position={[(start[0] + end[0]) / 2 - 3, (start[1] + end[1]) / 2 - 2, (start[2] + end[2]) / 2]}>
          <input
            type="number"
            placeholder=""
            size={3}
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
                dispatch(
                  addConstraint({
                    id: 0,
                    t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
                    v: [value, 0, 0, id, 0],
                  })
                );
                dispatch(setLengthConstraintLineId(-1));
              }
            }}
          />
        </Html>
      ) : (
        ''
      )}

      {/* Display a length - if available */}
      {length ? (
        <Html position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]}>
          <div style={{ color: 'red', fontSize: 20 }}>{length}</div>
        </Html>
      ) : (
        ''
      )}
    </>
  );
};

export default LineObject;
