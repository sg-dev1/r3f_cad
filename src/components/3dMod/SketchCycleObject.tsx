import { SketchCycleType } from '@/utils/algo3d';
import React from 'react';
import * as THREE from 'three';
import { Circle, Segment, Segments } from '@react-three/drei';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';
import ArcObject from './ArcObject';

const SketchCycleObject = ({ sketchCycle }: { sketchCycle: SketchCycleType }) => {
  const segments = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.LINE) as Line3DInlinePointType[];
  const arcs = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.ARC) as ArcInlinePointType[];
  const circles = sketchCycle.cycle.filter((shape) => shape.t === SHAPE3D_TYPE.CIRCLE) as CircleInlinePointType[];

  console.log('[SketchCycleObject], segments', segments);

  // TODO visualize faces
  //  - face may consist of line segments and Arcs
  //  - could use similar technique as in occt_visualize

  return (
    <>
      {segments.length > 0 && (
        <Segments
          limit={1000}
          lineWidth={1.0}
          // All THREE.LineMaterial props are valid
          // {...materialProps}
        >
          {segments.map((segment) => (
            <Segment
              key={String(segment.start) + '-' + String(segment.end)}
              start={segment.start}
              end={segment.end}
              color="blue"
            />
          ))}
        </Segments>
      )}

      {circles.map((circle) => (
        <Circle
          key={String(circle.mid_pt)}
          args={[circle.radius]}
          position={circle.mid_pt}
          onClick={(e) => console.log('circle clicked', e)}
        >
          <meshBasicMaterial color="blue" side={THREE.DoubleSide} transparent={true} opacity={0.5} />
        </Circle>
      ))}

      {arcs.map((arc) => (
        <ArcObject key={String(arc.mid_pt) + '-' + String(arc.radius) + String(arc.start_angle)} arc={arc} />
      ))}
    </>
  );
};

export default SketchCycleObject;
