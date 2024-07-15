/** This component contains the drawing functionality for 2D sketches in 3D space. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectSelectedSketch, setSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { RootState } from '@/app/store';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { GeometryType } from '@/app/types/EntityType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { SketchCycleTypeOcct } from '@/utils/algo3d-occ';
import { getRotationForPlaneAsQuaternion } from '@/utils/threejs_planes';
import { cadTool3DShapeTo3DPoints, cadTool3DShapeToThreeShape } from '@/utils/threejs_utils';
import useArcPoints from '@/utils/useArcPoints';
import useCirclePoints from '@/utils/useCirclePoints';
import { Line } from '@react-three/drei';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import * as THREE from 'three';

export interface SketchCycleObjectNgProps {
  sketchCycle: SketchCycleTypeOcct;
}

const SketchCycleObjectNg = ({ sketchCycle }: SketchCycleObjectNgProps) => {
  const sketchIsVisible = useSelector((state: RootState) => state.sketchs.sketches[sketchCycle.sketch.id]?.isVisible);
  const selectedSketch = useAppSelector(selectSelectedSketch);

  const quaternion = useMemo(() => getRotationForPlaneAsQuaternion(sketchCycle.sketch.plane), [sketchCycle]);
  const dispatch = useAppDispatch();

  const arcs = useMemo(
    () => sketchCycle.cycle.filter((shape) => shape.t === GeometryType.ARC) as ArcInlinePointType[],
    [sketchCycle]
  );
  const circles = useMemo(
    () => sketchCycle.cycle.filter((shape) => shape.t === GeometryType.CIRCLE) as CircleInlinePointType[],
    [sketchCycle]
  );
  // Cannot use useMemo for both of these because cannot use a hook in a hook
  const arcsPointsArray = arcs.map((arc) => useArcPoints({ arc: arc, quaternion: quaternion }));
  const circlePointsArray = circles.map((circle) => useCirclePoints({ circle: circle, quaternion: quaternion }));

  const [hovered, setHovered] = useState<boolean>(false);

  // ---

  const drawShape = (): [THREE.ShapeGeometry | null, Point3DInlineType[]] => {
    const points = cadTool3DShapeTo3DPoints(sketchCycle.cycle, arcsPointsArray, circlePointsArray);
    let threeShapeGeometry: THREE.ShapeGeometry | null = null;
    if (sketchCycle.cycle.length > 0) {
      const threeShape = cadTool3DShapeToThreeShape(sketchCycle.cycle, sketchCycle.sketch.plane);
      // add the holes
      // after example from
      // https://discourse.threejs.org/t/use-a-shape-as-a-reference-to-make-a-hole/43595
      sketchCycle.innerCycles.forEach((cycle) => {
        const holeShape = cadTool3DShapeToThreeShape(cycle, sketchCycle.sketch.plane);
        threeShape.holes.push(holeShape);
      });

      threeShapeGeometry = new THREE.ShapeGeometry(threeShape);
      threeShapeGeometry.applyQuaternion(quaternion);
    }

    return [threeShapeGeometry, points];
  };
  const [shapeGeometry, shapePoints] = useMemo(() => drawShape(), [sketchCycle]);

  const obtainShapeColor = () => {
    if (hovered) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  // ---

  return (
    <>
      {shapeGeometry && (
        <mesh
          frustumCulled={false}
          geometry={shapeGeometry}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => {
            if (sketchIsVisible && selectedSketch === sketchCycle.sketch.id) {
              dispatch(setSketchToExtrude([sketchCycle.sketch.id, sketchCycle.index]));
            }
          }}
          visible={sketchIsVisible && selectedSketch === sketchCycle.sketch.id}
        >
          {/* Use a negative polygonOffset to solve the z-fighting problem with OcctFaceVisualizer.tsx component
              (which has positive offset to be always drawn behind this component)
           */}
          <meshBasicMaterial
            color={obtainShapeColor()}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-0.1}
          />
        </mesh>
      )}
      {shapePoints.length > 0 && (
        // Do not rotate line since all points already have the correct coordinates
        <Line points={shapePoints} color="blue" visible={sketchIsVisible} />
      )}
    </>
  );
};

export default SketchCycleObjectNg;
