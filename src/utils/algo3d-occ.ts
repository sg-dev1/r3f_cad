/** This library contains functionality to add occt data to all distinct circles in a sketch. */
import { SketchType } from '@/app/slices/Sketch';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import {
  CadTool3DShapeSubset,
  SaveGraphToReduxFunction,
  SketchCycleMapType,
  SketchCycleType,
  findCyclesInSketch,
} from './algo3d';
import { Arc, Circle, Segment } from '@flatten-js/core';
import { convert2DPointTo3D, getNormalVectorForPlane } from './threejs_planes';
import { GraphGeom2d } from '@/app/slices/graphGeom2dSlice';
import { GeometryType } from '@/app/types/EntityType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { floatNumbersEqual } from './utils';
import { Point3DInlineType } from '@/app/types/Point3DType';

/** Datatype representing a sketch cycle including occt data (the face) */
export interface SketchCycleTypeOcct {
  cycle: CadTool3DShapeSubset[]; // the (outer) cycle
  isCounterClockwiseOrientation: boolean;
  innerCycles: number[]; // ids (SketchCycleTypeOcct.index) of inner cycles
  sketch: SketchType; // the Sketch this cycle belongs to. One Sketch may have multiple cycles.
  index: number; // index of this cycle for the given sketch
  occtFace: Inputs.OCCT.TopoDSFacePointer; // the cycle as occt face

  cycleArea: number;

  // optional fields of algo3d.ts SketchCycleType
  label?: string; // label of the sketch cycle
  centroid?: [number, number];
}
export type SketchCycleOcctMapType = { [cycleIndex: number]: SketchCycleTypeOcct };
// Result type of the findCyclesInSketchAndConvertToOcct function to have a container for cycles and map
export interface SketchCyclesOcctContainer {
  cycles: SketchCycleTypeOcct[];
  map: SketchCycleOcctMapType;
}

/** Finds all cycles in a sketch and adds occt data to it. */
export const findCyclesInSketchAndConvertToOcct = async (
  sketch: SketchType,
  bitbybit: BitByBitOCCT,
  saveGraphGeom2d: SaveGraphToReduxFunction,
  prevGraphGeom2d: GraphGeom2d | null
): Promise<SketchCyclesOcctContainer> => {
  const [cyclesInSketch, cyclesInSketchMap] = findCyclesInSketch(sketch, saveGraphGeom2d, prevGraphGeom2d);

  /*
  cyclesInSketch.sort((a: SketchCycleType, b: SketchCycleType) =>
    a.label === undefined ? -1 : b.label === undefined ? 1 : a.label.localeCompare(b.label)
  );
  */

  const buildEdges = async (cycle: SketchCycleType): Promise<Inputs.OCCT.TopoDSEdgePointer[]> => {
    return (await Promise.all(
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
  };

  const result: SketchCycleTypeOcct[] = [];
  for (const cycle of cyclesInSketch) {
    // 1) Convert shapes to edges
    const edges = await buildEdges(cycle);

    // 1.1) Inner cycles - may be empty
    const innerCyclesEdges = (await Promise.all(
      cycle.innerCycles.map(async (innerCycle) => {
        const cycleForInnerCycle = cyclesInSketchMap[innerCycle];
        return buildEdges(cycleForInnerCycle);
      })
    )) as Inputs.OCCT.TopoDSEdgePointer[][];

    //console.log('edges', edges);

    // 2) Convert edges to wires

    const wire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
    // do not reverse the first wire

    // inner wires - may be empty
    let innerWires: Inputs.OCCT.TopoDSWirePointer[] = [];
    if (innerCyclesEdges.length > 0) {
      innerWires = await Promise.all(
        innerCyclesEdges.map(async (edges, index) => {
          const cycleForInnerCycle = cyclesInSketchMap[cycle.innerCycles[index]];

          let tmpWire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
          // not sure if this reversing logic is complete ...
          if (
            cycle.isCounterClockwiseOrientation &&
            cycleForInnerCycle.isCounterClockwiseOrientation &&
            edges.length > 1
          ) {
            // edges.length > 1 --> do not reverse a Circle which already has the correct orientation
            //if (sketch.name === 'Sketch13') console.log('Reversing inner wire for Sketch13!');
            //if (sketch.name === 'Sketch2') console.log('(A) Reversing inner wire for Sketch2!');
            tmpWire = await bitbybit.occt.shapes.wire.reversedWire({ shape: tmpWire });
          } else if (!cycle.isCounterClockwiseOrientation && !cycleForInnerCycle.isCounterClockwiseOrientation) {
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

    const faceArea = await bitbybit.occt.shapes.face.getFaceArea({ shape: face });
    if (!floatNumbersEqual(faceArea, cycle.cycleArea)) {
      // If the area does not match it means we have to reverse at least one wire before creating
      // the face.
      console.log('faceArea (occt vs cycleArea)', faceArea, cycle.cycleArea, cycle);
      const innerWiresMod = await Promise.all(
        innerWires.map(async (innerWire, index) => {
          const cycleForInnerCycle = cyclesInSketchMap[cycle.innerCycles[index]];
          // idea here is to reverse only inner Circles (since these are causing problems)
          if (cycleForInnerCycle.cycle.length === 1) {
            return await bitbybit.occt.shapes.wire.reversedWire({ shape: innerWire });
          } else {
            return innerWire;
          }
        })
      );
      face = await bitbybit.occt.shapes.face.createFaceFromWires({ shapes: [wire, ...innerWiresMod], planar: true });
    }

    result.push({
      cycle: cycle.cycle,
      isCounterClockwiseOrientation: cycle.isCounterClockwiseOrientation,
      innerCycles: cycle.innerCycles,
      sketch: cycle.sketch,
      index: cycle.index,
      occtFace: face,
      cycleArea: cycle.cycleArea,
      label: cycle.label,
      centroid: cycle.centroid,
    });
  }

  const resultMap: SketchCycleOcctMapType = {};
  for (const [key, sketchCycle] of Object.entries(cyclesInSketchMap)) {
    const sketchCycleOcctResultList = result.filter((sketchCycle) => sketchCycle.index === Number(key));
    if (sketchCycleOcctResultList.length > 0) {
      const sketchCycleOcct = sketchCycleOcctResultList[0];
      resultMap[sketchCycleOcct.index] = sketchCycleOcct;
    } else {
      // create a new element
      resultMap[sketchCycle.index] = {
        cycle: sketchCycle.cycle,
        isCounterClockwiseOrientation: sketchCycle.isCounterClockwiseOrientation,
        innerCycles: sketchCycle.innerCycles,
        sketch: sketchCycle.sketch,
        index: sketchCycle.index,
        occtFace: { hash: 0, type: '' }, // just a dummy entry - must not be used
        cycleArea: sketchCycle.cycleArea,
        label: sketchCycle.label,
        centroid: sketchCycle.centroid,
      };
    }
  }

  return { cycles: result, map: resultMap };
};

/** Generate an Occt Face from the given input parameters. */
const generateOcctFace = async (
  bitbybit: BitByBitOCCT,
  sketch: SketchType,
  sketchCycle: SketchCycleTypeOcct,
  sketchCycleMap: SketchCycleOcctMapType
): Promise<Inputs.OCCT.TopoDSFacePointer> => {
  const buildEdges = async (cycle: CadTool3DShapeSubset[]): Promise<Inputs.OCCT.TopoDSEdgePointer[]> => {
    return (await Promise.all(
      cycle.map(async (shape) => {
        if (shape.t === GeometryType.LINE) {
          const lineObj = shape as Line3DInlinePointType;
          return await bitbybit.occt.shapes.edge.line({ start: lineObj.start, end: lineObj.end });
        } else if (shape.t === GeometryType.ARC) {
          const arcObj = shape as ArcInlinePointType;
          return await bitbybit.occt.shapes.edge.arcThroughThreePoints({
            start: arcObj.start,
            end: arcObj.end,
            middle: arcObj.middle,
          });
        } else if (shape.t === GeometryType.CIRCLE) {
          const circleObj = shape as CircleInlinePointType;
          return await bitbybit.occt.shapes.edge.createCircleEdge({
            radius: circleObj.radius,
            center: circleObj.mid_pt,
            direction: getNormalVectorForPlane(sketch.plane),
          });
        }
        console.error('Must not get here ...', shape);
      })
    )) as Inputs.OCCT.TopoDSEdgePointer[];
  };

  const edges = await buildEdges(sketchCycle.cycle);

  const innerCyclesEdges = (await Promise.all(
    sketchCycle.innerCycles.map(async (innerCycle) => {
      const cycleForInnerCycle = sketchCycleMap[innerCycle];
      return buildEdges(cycleForInnerCycle.cycle);
    })
  )) as Inputs.OCCT.TopoDSEdgePointer[][];

  // TODO begin logic which should be moved into own function,
  //   to be used by findCyclesInSketchAndConvertToOcct() as well

  const wire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
  // do not reverse the first wire

  // inner wires - may be empty
  let innerWires: Inputs.OCCT.TopoDSWirePointer[] = [];
  if (innerCyclesEdges.length > 0) {
    innerWires = await Promise.all(
      innerCyclesEdges.map(async (edges, index) => {
        const cycleForInnerCycle = sketchCycleMap[sketchCycle.innerCycles[index]];

        let tmpWire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
        // not sure if this reversing logic is complete ...
        if (
          sketchCycle.isCounterClockwiseOrientation &&
          cycleForInnerCycle.isCounterClockwiseOrientation &&
          edges.length > 1
        ) {
          // edges.length > 1 --> do not reverse a Circle which already has the correct orientation
          //if (sketch.name === 'Sketch13') console.log('Reversing inner wire for Sketch13!');
          //if (sketch.name === 'Sketch2') console.log('(A) Reversing inner wire for Sketch2!');
          tmpWire = await bitbybit.occt.shapes.wire.reversedWire({ shape: tmpWire });
        } else if (!sketchCycle.isCounterClockwiseOrientation && !cycleForInnerCycle.isCounterClockwiseOrientation) {
          tmpWire = await bitbybit.occt.shapes.wire.reversedWire({ shape: tmpWire });
          //if (sketch.name === 'Sketch2') console.log('(B) Reversing inner wire for Sketch2!');
        }
        return tmpWire;
      })
    );
  }

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

  const faceArea = await bitbybit.occt.shapes.face.getFaceArea({ shape: face });
  if (!floatNumbersEqual(faceArea, sketchCycle.cycleArea)) {
    // If the area does not match it means we have to reverse at least one wire before creating
    // the face.
    console.log('faceArea (occt vs cycleArea)', faceArea, sketchCycle.cycleArea, sketchCycle);
    const innerWiresMod = await Promise.all(
      innerWires.map(async (innerWire, index) => {
        const cycleForInnerCycle = sketchCycleMap[sketchCycle.innerCycles[index]];
        // idea here is to reverse only inner Circles (since these are causing problems)
        if (cycleForInnerCycle.cycle.length === 1) {
          return await bitbybit.occt.shapes.wire.reversedWire({ shape: innerWire });
        } else {
          return innerWire;
        }
      })
    );
    face = await bitbybit.occt.shapes.face.createFaceFromWires({ shapes: [wire, ...innerWiresMod], planar: true });
  }

  // TODO End logic that should be moved into own function

  return face;
};

export const patchSketchCycleContainer = async (
  sketch: SketchType,
  bitbybit: BitByBitOCCT,
  containerToPatch: SketchCyclesOcctContainer
): Promise<SketchCyclesOcctContainer> => {
  const updatePoint3dInline = (p: Point3DInlineType): Point3DInlineType => {
    if (sketch.plane.plane === 'xy') {
      return [p[0], p[1], sketch.plane.offset];
    } else if (sketch.plane.plane === 'xz') {
      return [p[0], sketch.plane.offset, p[2]];
    } else if (sketch.plane.plane === 'yz') {
      return [sketch.plane.offset, p[1], p[2]];
    }
    return [0, 0, 0];
  };

  const occtFacesToDelete: Inputs.OCCT.TopoDSFacePointer[] = [];
  const newCycles = containerToPatch.cycles.map((cycle) => {
    occtFacesToDelete.push(cycle.occtFace);

    const newShapeSubsetCycle = cycle.cycle.map((shape) => {
      if (shape.t === GeometryType.LINE) {
        const lineObj = shape as Line3DInlinePointType;
        return { ...shape, start: updatePoint3dInline(lineObj.start), end: updatePoint3dInline(lineObj.end) };
      } else if (shape.t === GeometryType.ARC) {
        const arcObj = shape as ArcInlinePointType;
        return {
          ...shape,
          start: updatePoint3dInline(arcObj.start),
          end: updatePoint3dInline(arcObj.end),
          mid_pt: updatePoint3dInline(arcObj.mid_pt),
          middle: updatePoint3dInline(arcObj.middle),
        };
      } else if (shape.t === GeometryType.CIRCLE) {
        const circleObj = shape as CircleInlinePointType;
        return { ...shape, mid_pt: updatePoint3dInline(circleObj.mid_pt) };
      }
    }) as CadTool3DShapeSubset[];

    return {
      cycle: newShapeSubsetCycle,
      innerCycles: cycle.innerCycles,
      sketch: sketch,
      index: cycle.index,
      occtFace: cycle.occtFace, // use the old face, to be overwritten later
      label: cycle.label,
      centroid: cycle.centroid,
    };
  }) as SketchCycleTypeOcct[];

  const cycleMap: SketchCycleOcctMapType = {};
  for (const cycle of newCycles) {
    cycleMap[cycle.index] = cycle;
  }

  // TODO generate new occt faces and add them to faces
  //  --> newCycles is again a SketchCycleTypeOcct[]
  const newCyclesWithFace: SketchCycleTypeOcct[] = await Promise.all(
    newCycles.map(async (cycle) => {
      const face = await generateOcctFace(bitbybit, sketch, cycle, cycleMap);

      return {
        ...cycle,
        occtFace: face,
      };
    })
  );

  // delete old occt faces
  //await bitbybit.occt.deleteShapes({ shapes: occtFacesToDelete });

  const cycleMapResult: SketchCycleOcctMapType = {};
  for (const cycle of newCyclesWithFace) {
    cycleMapResult[cycle.index] = cycle;
  }

  return { cycles: newCyclesWithFace, map: cycleMapResult };
};
