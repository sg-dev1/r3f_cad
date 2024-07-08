/** This library contains functionality to add occt data to all distinct circles in a sketch. */
import { SketchType } from '@/app/slices/Sketch';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { CadTool3DShapeSubset, findCyclesInSketch } from './algo3d';
import { Arc, Circle, Segment } from '@flatten-js/core';
import { convert2DPointTo3D, getNormalVectorForPlane } from './threejs_planes';

/** Datatype representing a sketch cycle including occt data (the face) */
export interface SketchCycleTypeOcct {
  cycle: CadTool3DShapeSubset[]; // the (outer) cycle
  innerCycles: CadTool3DShapeSubset[][]; // inner cycles (e.g. holes) if there are any
  cycleArea: number; // area of the cycle
  sketch: SketchType; // the Sketch this cycle belongs to. One Sketch may have multiple cycles.
  index: number; // index of this cycle for the given sketch
  occtFace: Inputs.OCCT.TopoDSFacePointer; // the cycle as occt face
}

/** Finds all cycles in a sketch and adds occt data to it. */
export const findCyclesInSketchAndConvertToOcct = async (sketch: SketchType, bitbybit: BitByBitOCCT) => {
  const cyclesInSketch = findCyclesInSketch(sketch);

  const result: SketchCycleTypeOcct[] = [];
  for (const cycle of cyclesInSketch) {
    // 1) Convert shapes to edges
    const edges = (await Promise.all(
      cycle.flattenShapes.map(async (shape) => {
        if (shape instanceof Segment) {
          const segment = shape as Segment;
          const dto = {
            start: convert2DPointTo3D(sketch.plane, segment.start.x, segment.start.y),
            end: convert2DPointTo3D(sketch.plane, segment.end.x, segment.end.y),
          };
          //console.log('dto', dto);
          return await bitbybit.occt.shapes.edge.line(dto);
        } else if (shape instanceof Arc) {
          const arc = shape as Arc;
          const startPoint = arc.start;
          const endPoint = arc.end;
          const middlePoint = arc.middle();
          const dto = {
            start: convert2DPointTo3D(sketch.plane, startPoint.x, startPoint.y),
            middle: convert2DPointTo3D(sketch.plane, middlePoint.x, middlePoint.y),
            end: convert2DPointTo3D(sketch.plane, endPoint.x, endPoint.y),
          };
          return await bitbybit.occt.shapes.edge.arcThroughThreePoints(dto);
        } else if (shape instanceof Circle) {
          const circle = shape as Circle;
          return await bitbybit.occt.shapes.edge.createCircleEdge({
            radius: circle.r,
            center: convert2DPointTo3D(sketch.plane, circle.center.x, circle.center.y),
            direction: getNormalVectorForPlane(sketch.plane),
          });
        }
        console.error('Must not get here ...', shape);
      })
    )) as Inputs.OCCT.TopoDSEdgePointer[];

    //console.log('edges', edges);

    // 2) Convert edges to wires
    const wire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });

    //console.log('wire', wire);

    //const isClosed = await bitbybit.occt.shapes.shape.isClosed({ shape: wire });
    //console.log('wire isClosed', isClosed); // returns true - if this is not the case this is an error!

    // 3) Convert wires to faces
    const face = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire, planar: true });

    result.push({
      cycle: cycle.cycle,
      innerCycles: cycle.innerCycles,
      cycleArea: cycle.cycleArea,
      sketch: cycle.sketch,
      index: cycle.index,
      occtFace: face,
    });
  }

  return result;
};
