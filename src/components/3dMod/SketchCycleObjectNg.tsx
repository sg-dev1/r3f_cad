import { ArcInlinePointType } from '@/app/types/ArcType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { Point3DInlineType } from '@/app/types/Point3DType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';
import { SketchCycleType } from '@/utils/algo3d';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

export interface SketchCycleObjectNgProps {
  sketchCycle: SketchCycleType;
}

const SketchCycleObjectNg = ({ sketchCycle }: SketchCycleObjectNgProps) => {
  // if hidden we don't have to do anything
  if (sketchCycle.isHidden) {
    return <></>;
  }

  const [hovered, setHovered] = useState<boolean>(false);
  const [shapeGeom, setShapeGeom] = useState<THREE.ShapeGeometry | null>(null);

  const drawShape = () => {
    if (sketchCycle.cycle.length > 0) {
      // https://threejs.org/docs/index.html?q=shape#api/en/extras/core/Shape
      const threeShape = new THREE.Shape();

      const firstShape = sketchCycle.cycle[0];
      let firstPoint: Point3DInlineType | null = null;
      if (firstShape.t === SHAPE3D_TYPE.LINE) {
        firstPoint = (firstShape as Line3DInlinePointType).start;
      } else if (firstShape.t === SHAPE3D_TYPE.ARC) {
        firstPoint = (firstShape as ArcInlinePointType).start;
      }
      // CIRCLE needs to be handled differently

      // TODO it need to be accounted for the plane
      if (firstPoint !== null) {
        threeShape.moveTo(firstPoint[0], firstPoint[1]);
        //console.log('moveto', firstPoint);
        sketchCycle.cycle.forEach((shape) => {
          if (shape.t === SHAPE3D_TYPE.LINE) {
            const lineSegment = shape as Line3DInlinePointType;
            threeShape.lineTo(lineSegment.end[0], lineSegment.end[1]);
            //console.log('lineto', lineSegment.end);
          } else if (shape.t === SHAPE3D_TYPE.ARC) {
            const arc = shape as ArcInlinePointType;
            //console.log('arc', arc);
            threeShape.absarc(
              arc.midPt2d[0],
              arc.midPt2d[1],
              arc.radius,
              arc.start_angle,
              arc.end_angle,
              arc.clockwise
            );
          } else {
            console.warn('Should not get here. Type t ' + shape.t + ' not supported');
          }
        });
      }

      const geometry = new THREE.ShapeGeometry(threeShape);
      setShapeGeom(geometry);
    }
  };

  useEffect(() => {
    drawShape();
  }, [sketchCycle]);

  const obtainShapeColor = () => {
    if (hovered) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  return (
    <>
      {shapeGeom && (
        <mesh geometry={shapeGeom} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <meshBasicMaterial color={obtainShapeColor()} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
};

export default SketchCycleObjectNg;
