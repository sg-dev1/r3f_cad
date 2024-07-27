/** This library contains functionality to add occt data to all distinct circles in a sketch. */
import { SketchType } from '@/app/slices/Sketch';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { CadTool3DShapeSubset, SaveGraphToReduxFunction, SketchCycleType, findCyclesInSketch } from './algo3d';
import { Arc, Circle, Segment } from '@flatten-js/core';
import { convert2DPointTo3D, getNormalVectorForPlane } from './threejs_planes';
import { GraphGeom2d } from '@/app/slices/graphGeom2dSlice';
import { GeometryType } from '@/app/types/EntityType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { floatNumbersEqual } from './utils';

/** Datatype representing a sketch cycle including occt data (the face) */
export interface SketchCycleTypeOcct {
  cycle: CadTool3DShapeSubset[]; // the (outer) cycle
  innerCycles: CadTool3DShapeSubset[][]; // inner cycles (e.g. holes) if there are any
  cycleArea: number; // area of the cycle
  sketch: SketchType; // the Sketch this cycle belongs to. One Sketch may have multiple cycles.
  index: number; // index of this cycle for the given sketch
  occtFace: Inputs.OCCT.TopoDSFacePointer; // the cycle as occt face

  // optional fields of algo3d.ts SketchCycleType
  label?: string; // label of the sketch cycle
  centroid?: [number, number];
}

/** Finds all cycles in a sketch and adds occt data to it. */
export const findCyclesInSketchAndConvertToOcct = async (
  sketch: SketchType,
  bitbybit: BitByBitOCCT,
  saveGraphGeom2d: SaveGraphToReduxFunction,
  prevGraphGeom2d: GraphGeom2d | null
) => {
  const cyclesInSketch = findCyclesInSketch(sketch, saveGraphGeom2d, prevGraphGeom2d);

  /*
  cyclesInSketch.sort((a: SketchCycleType, b: SketchCycleType) =>
    a.label === undefined ? -1 : b.label === undefined ? 1 : a.label.localeCompare(b.label)
  );
  */

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

    // 1.1) Inner cycles - may be empty
    const innerCyclesEdges = (await Promise.all(
      cycle.innerCycles.map(async (innerCycle) => {
        return await Promise.all(
          innerCycle.map(async (cycle) => {
            if (cycle.t === GeometryType.LINE) {
              const dto = {
                start: (cycle as Line3DInlinePointType).start,
                end: (cycle as Line3DInlinePointType).end,
              };
              return await bitbybit.occt.shapes.edge.line(dto);
            } else if (cycle.t === GeometryType.ARC) {
              const arc = cycle as ArcInlinePointType;
              const dto = {
                start: arc.start,
                middle: arc.mid_pt,
                end: arc.end,
              };
              return await bitbybit.occt.shapes.edge.arcThroughThreePoints(dto);
            } else if (cycle.t === GeometryType.CIRCLE) {
              const circle = cycle as CircleInlinePointType;
              return await bitbybit.occt.shapes.edge.createCircleEdge({
                radius: circle.radius,
                center: circle.mid_pt,
                direction: getNormalVectorForPlane(sketch.plane),
              });
            }
          })
        );
      })
    )) as Inputs.OCCT.TopoDSEdgePointer[][];

    //console.log('edges', edges);

    // 2) Convert edges to wires

    // fixes all of B025, but
    //  - inner part of Sketch07
    //      - most likely caused due to the complex inner shape of the one cluster
    // --> acceptable as fix for B025, but very hacky ...
    //     especially the "special check" for circles below (edges.length > 1)
    //     - the default orientation of flatten polygon and occt face for Circles seem to differ
    const wire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
    // do not reverse the first wire

    // inner wires - may be empty
    let innerWires: Inputs.OCCT.TopoDSWirePointer[] = [];
    if (innerCyclesEdges.length > 0) {
      innerWires = await Promise.all(
        innerCyclesEdges.map(async (edges, index) => {
          let tmpWire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
          // not sure if this reversing logic is complete ...
          if (cycle.isCounterClockwiseOrientation && cycle.innerCyclesCcwOrientation[index] && edges.length > 1) {
            // edges.length > 1 --> do not reverse a Circle which already has the correct orientation
            //if (sketch.name === 'Sketch13') console.log('Reversing inner wire for Sketch13!');
            //if (sketch.name === 'Sketch2') console.log('(A) Reversing inner wire for Sketch2!');
            tmpWire = await bitbybit.occt.shapes.wire.reversedWire({ shape: tmpWire });
          } else if (!cycle.isCounterClockwiseOrientation && !cycle.innerCyclesCcwOrientation[index]) {
            tmpWire = await bitbybit.occt.shapes.wire.reversedWire({ shape: tmpWire });
            //if (sketch.name === 'Sketch2') console.log('(B) Reversing inner wire for Sketch2!');
          }
          return tmpWire;
        })
      );
    }

    //console.log('wire', wire);

    //const isClosed = await bitbybit.occt.shapes.shape.isClosed({ shape: wire });
    //console.log('wire isClosed', isClosed); // returns true - if this is not the case this is an error!

    // 3) Convert wires to faces
    const createFace = async () => {
      if (innerWires.length > 0) {
        const shapes = [wire, ...innerWires];
        //console.log('....shapes', shapes, sketch, cycle, Array.from(cycle.polygon.faces.values())[0].orientation());
        return await bitbybit.occt.shapes.face.createFaceFromWires({ shapes: shapes, planar: true });
      } else {
        return await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire, planar: true });
      }
    };
    let face = await createFace();

    /* facearea is calculated wrongly anyways (inner faces not considered)
    const faceArea = await bitbybit.occt.shapes.face.getFaceArea({ shape: face });
    if (!floatNumbersEqual(faceArea, cycle.cycleArea)) {
      // if both faces do not match it indicates an issue
      // - it seems for occt to create a face properly, (inner) wires need to be reversed
      //   (but not always - it depends on how the are drawn)
      // - need a way to find out if list of (edge) shapes is clockwise
      //   or counterclockwise  (-> could use 2d geom library for that)
      console.log('faceArea (occt vs cycleArea)', faceArea, cycle.cycleArea);
      // simply reversing the face does not fix the issue
      //const reverseFace = await bitbybit.occt.shapes.face.reversedFace({ shape: face });
      //face = reverseFace;
    }
    */

    result.push({
      cycle: cycle.cycle,
      innerCycles: cycle.innerCycles,
      cycleArea: cycle.cycleArea,
      sketch: cycle.sketch,
      index: cycle.index,
      occtFace: face,
      label: cycle.label,
      centroid: cycle.centroid,
    });
  }

  return result;
};
