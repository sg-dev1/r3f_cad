/** This component contains the drawing functionality for angle constraints in the sketcher tool. */
import { useAppSelector } from '@/app/hooks';
import { selectLines, selectPointsMap, selectSketchCurrentPlane } from '@/app/slices/sketchSlice';
import { ConstraintType } from '@/app/types/Constraints';
import { getPlaneAwareSketchPosition, getRotationForPlaneAsQuaternion } from '@/utils/threejs_planes';
import React from 'react';
import TextObject from './TextObject';
import { selectSelectedConstraintId } from '@/app/slices/sketchToolStateSlice';
import { Line } from '@react-three/drei';
import { point3dEquals, Point3DType } from '@/app/types/Point3DType';
import { createArc2 } from '@/app/types/ArcType';
import useArcPoints from '@/utils/useArcPoints';
import { toRadiant } from '@/utils/utils';

const AngleConstraintObject = ({ angleConstraint }: { angleConstraint: ConstraintType }) => {
  const sketchCurrentPlane = useAppSelector(selectSketchCurrentPlane);
  const sketchPointsMap = useAppSelector(selectPointsMap);
  const sketchLines = useAppSelector(selectLines);
  const sketchSelectedConstraintId = useAppSelector(selectSelectedConstraintId);

  const quaternion = getRotationForPlaneAsQuaternion(sketchCurrentPlane);

  const line1 = sketchLines.filter((line) => line.id === angleConstraint.v[3]);
  const line2 = sketchLines.filter((line) => line.id === angleConstraint.v[4]);

  const pt1_1 = sketchPointsMap[line1[0].p1_id];
  const pt2_1 = sketchPointsMap[line1[0].p2_id];

  const pt1_2 = sketchPointsMap[line2[0].p1_id];
  const pt2_2 = sketchPointsMap[line2[0].p2_id];

  let arcMidPoint: Point3DType | null = null;
  let arcStart: Point3DType | null = null;
  let arcEnd: Point3DType | null = null;
  if (point3dEquals(pt1_1, pt1_2)) {
    arcMidPoint = pt1_1;
    arcStart = pt2_1;
    arcEnd = pt2_2;
  } else if (point3dEquals(pt1_1, pt2_2)) {
    arcMidPoint = pt1_1;
    arcStart = pt2_1;
    arcEnd = pt1_2;
  } else if (point3dEquals(pt2_1, pt1_2)) {
    arcMidPoint = pt2_1;
    arcStart = pt1_1;
    arcEnd = pt2_2;
  } /*if (point3dEquals(pt2_1, pt2_2))*/ else {
    arcMidPoint = pt2_1;
    arcStart = pt1_1;
    arcEnd = pt1_2;
  }

  //console.log('+++arcMidPoint', arcMidPoint, 'arcStart', arcStart, 'arcEnd', arcEnd, 'angle', angleConstraint.v[0]);

  const arcObj = createArc2(sketchCurrentPlane, arcMidPoint, arcStart, arcEnd, {
    radiusDivisor: 6,
    angleHint: toRadiant(angleConstraint.v[0] as number),
  });
  const arcPoints = useArcPoints({ arcs: [arcObj], quaternion: quaternion, plane: sketchCurrentPlane });

  //console.log(arcPoints);
  const textPos = arcObj.middle;

  if (line1.length === 0 || line2.length === 0) {
    console.error('Line with id ' + angleConstraint.v[3] + ' or ' + angleConstraint.v[4] + ' could not be found');
    return <></>;
  } else {
    return (
      <>
        <Line
          points={arcPoints[0]} // array of points
          color={angleConstraint.id === sketchSelectedConstraintId ? 'yellow' : 'red'}
          lineWidth={1.5} // default is 1
          dashed={true} // default false
        />
        <TextObject
          position={getPlaneAwareSketchPosition(sketchCurrentPlane, textPos, 0, 10)}
          quaternion={quaternion}
          baseFontWeight={500}
          label={String(angleConstraint.v[0]) + '°'}
          constraintId={angleConstraint.id}
        />
      </>
    );
  }
};

export default AngleConstraintObject;
