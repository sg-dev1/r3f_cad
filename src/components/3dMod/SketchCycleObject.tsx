import { SketchCycleType } from '@/utils/algo3d';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Segment, Segments, Shape } from '@react-three/drei';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import useArcPoints from '@/utils/useArcPoints';
import useCirclePoints from '@/utils/useCirclePoints';

const SketchCycleObject = ({ sketchCycle, bitbybit }: { sketchCycle: SketchCycleType; bitbybit: BitByBitOCCT }) => {
  const segments = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.LINE) as Line3DInlinePointType[];
  const arcs = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.ARC) as ArcInlinePointType[];
  const circles = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.CIRCLE) as CircleInlinePointType[];

  //console.log('[SketchCycleObject], segments', segments);

  // TODO fixme - this does not work for arbitrary shapes
  // maybe points need to be sorted?
  // shapes have holes etc.
  const segmentShape = useMemo(() => {
    //const segmentArray = segments.map((segment) => [segment.start, segment.end])
    const newPoints: THREE.Vector2[] = [];
    segments.forEach((segment) => {
      // TODO this needs to be plane aware - depending on plane different coords need to be used I guess
      newPoints.push(new THREE.Vector2(segment.start[0], segment.start[1]));
      newPoints.push(new THREE.Vector2(segment.end[0], segment.end[1]));
    });
    //console.log('newPoints', newPoints);
    if (newPoints.length === 0) {
      return null;
    } else {
      return new THREE.Shape(newPoints);
    }
  }, [segments]);

  const arcsPointsArray = arcs.map((arc) => useArcPoints({ arc: arc }));
  const arcShape = useMemo(() => {
    const newPoints: THREE.Vector2[] = [];
    arcsPointsArray.forEach((points) => {
      points.forEach((point) => {
        // TODO this needs to be plane aware - depending on plane different coords need to be used I guess
        newPoints.push(new THREE.Vector2(point.x, point.y));
      });
    });
    //console.log('newPoints', newPoints);
    if (newPoints.length === 0) {
      return null;
    } else {
      return new THREE.Shape(newPoints);
    }
  }, [arcsPointsArray]);

  const circlePointsArray = circles.map((circle) => useCirclePoints({ circle: circle }));
  const circleShape = useMemo(() => {
    const newPoints: THREE.Vector2[] = [];
    circlePointsArray.forEach((points) => {
      points.forEach((point) => {
        // TODO this needs to be plane aware - depending on plane different coords need to be used I guess
        newPoints.push(new THREE.Vector2(point.x, point.y));
      });
    });
    //console.log('newPoints', newPoints);
    if (newPoints.length === 0) {
      return null;
    } else {
      return new THREE.Shape(newPoints);
    }
  }, [circlePointsArray]);

  return (
    <>
      {segmentShape !== null && (
        <Shape args={[segmentShape]}>
          <meshBasicMaterial color="green" side={THREE.DoubleSide} />
        </Shape>
      )}
      {segments.length > 0 && (
        <Segments
          limit={1000}
          lineWidth={1.0}
          // All THREE.LineMaterial props are valid
          // {...materialProps}
        >
          {segments.map((segment, index) => (
            <Segment key={index} start={segment.start} end={segment.end} color="blue" />
          ))}
        </Segments>
      )}

      {circleShape !== null && (
        <Shape args={[circleShape]}>
          <meshBasicMaterial color="green" side={THREE.DoubleSide} />
        </Shape>
      )}
      {circlePointsArray.length > 0 &&
        circlePointsArray.map((points, index) => <Line key={index} points={points} color={'blue'} />)}

      {arcShape !== null && (
        <Shape args={[arcShape]}>
          <meshBasicMaterial color="green" side={THREE.DoubleSide} />
        </Shape>
      )}
      {arcsPointsArray.length > 0 &&
        arcsPointsArray.map((points, index) => <Line key={index} points={points} color="blue" />)}
    </>
  );
};

export default SketchCycleObject;
