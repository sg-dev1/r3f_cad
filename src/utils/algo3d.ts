import { SketchType } from '@/app/slices/Sketch';
import { Arc, Circle, Point, Segment } from '@flatten-js/core';
import { convert2DPointTo3D, getNormalVectorForPlane, getPointU, getPointV } from './threejs_planes';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { SHAPE3D_TYPE } from '@/app/types/ShapeType';

type FlattenShapeSubset = Segment | Circle | Arc;
type CadTool3DShapeSubset = Line3DInlinePointType | CircleInlinePointType | ArcInlinePointType;

const findConnectedLinesInSketch = (sketch: SketchType) => {
  //
  // Step 1 - find all intersection points of shapes in the Sketch
  //
  // Convert points and sketch shapes (Lines, Circles) into flatten shapes
  type FlattenPointsMapType = { [key: number]: Point };
  const flattenPointsMap: FlattenPointsMapType = {};
  sketch.points.forEach((point) => {
    //console.log('point', point);
    flattenPointsMap[point.id] = new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point));
  });

  type FlattenShapeStruct = { id: number; shape: FlattenShapeSubset };
  const flattenShapes: FlattenShapeStruct[] = sketch.lines.map((line) => ({
    id: line.id,
    shape: new Segment(flattenPointsMap[line.p1_id], flattenPointsMap[line.p2_id]),
  }));
  const circleShapes = sketch.circles.map((circle) => ({
    id: circle.id,
    shape: new Circle(flattenPointsMap[circle.mid_pt_id], circle.radius),
  }));
  flattenShapes.push(...circleShapes);

  // Calculate intersection points between two shapes
  type IntersectionType = { affectedShapes: number[]; intersectionPoints: Point[] };
  const intersectMap: { [key: number]: IntersectionType[] } = [];
  const affectedShapes = new Set<number>();
  const insertIntoIntersectionMap = (
    shape: FlattenShapeStruct,
    otherShape: FlattenShapeStruct,
    intersectionPoints: Point[]
  ) => {
    if (shape.id in intersectMap) {
      intersectMap[shape.id].push({
        affectedShapes: [shape.id, otherShape.id],
        intersectionPoints: intersectionPoints,
      });
    } else {
      intersectMap[shape.id] = [{ affectedShapes: [shape.id, otherShape.id], intersectionPoints: intersectionPoints }];
    }
  };
  flattenShapes.forEach((shape) => {
    flattenShapes.forEach((otherShape) => {
      // Do not intersect with ids >=
      // = ... because we don't want to intersect a shape with itself
      // > ... because we don't want to intersect twice (we would get the same points)
      if (shape.id < otherShape.id) {
        const intersectionPoints = shape.shape.intersect(otherShape.shape);

        let discardIntersectionPoints = false;
        if (shape.shape instanceof Segment) {
          const segment = shape.shape as Segment;
          const idx1 = intersectionPoints.findIndex((point) => point.equalTo(segment.start));
          const idx2 = intersectionPoints.findIndex((point) => point.equalTo(segment.end));
          discardIntersectionPoints = idx1 !== -1 || idx2 != -1;
        }

        if (!discardIntersectionPoints && intersectionPoints.length > 0) {
          insertIntoIntersectionMap(shape, otherShape, intersectionPoints);
          insertIntoIntersectionMap(otherShape, shape, intersectionPoints);
          affectedShapes.add(shape.id).add(otherShape.id);
        }
      }
    });
  });

  //console.log('flattenShapes', flattenShapes);
  //console.log('intersectMap', intersectMap);
  //console.log('affectedShapes', affectedShapes);

  const finalShapes: FlattenShapeStruct[] = [];

  //
  // Perform the splits for the intersection points found and save the result in a list
  //   e.g. a line may be split multiple times by different shapes
  //
  let currentId = sketch.entityIdCounter;
  const insertIntoFinalShapes = (aShape: FlattenShapeSubset) => {
    finalShapes.push({ id: currentId, shape: aShape });
    currentId++;
  };
  flattenShapes.forEach((shape) => {
    if (!affectedShapes.has(shape.id)) {
      finalShapes.push(shape);
    } else {
      // shape need to be replaced
      const intersections = intersectMap[shape.id];

      const intersectionPoints: Point[] = [];
      intersections?.forEach((intersection) => {
        intersectionPoints.push(...intersection.intersectionPoints);
      });

      //console.log('shape', shape.id, shape.shape, 'intersect points', intersectionPoints);

      if (shape.shape instanceof Segment) {
        const segment = shape.shape as Segment;

        if (intersectionPoints.length > 0) {
          const sortedPoints = segment.sortPoints(intersectionPoints);
          //console.log('<line>shape', shape.id, 'sortedPoints', sortedPoints);

          // do the splits
          let currentSegment = segment;
          sortedPoints.forEach((point) => {
            const [seg1, seg2] = currentSegment.split(point);
            if (seg1 === null || seg2 === null) {
              console.warn('Seg1 or seg2 was null. This should not happen');
            }
            if (seg1 && seg2) {
              //console.log('save seg1', seg1);
              insertIntoFinalShapes(seg1);
              currentSegment = seg2;
            }
          });
          insertIntoFinalShapes(currentSegment);
        } else {
          // no split needed, save the segment
          insertIntoFinalShapes(segment);
        }
      }

      if (shape.shape instanceof Circle) {
        const circle = shape.shape as Circle;
        if (intersectionPoints.length > 0) {
          const circleAsArcTmp = circle.toArc(true);
          const sortedPoints = circleAsArcTmp.sortPoints(intersectionPoints);

          const [arc1, _] = circleAsArcTmp.split(sortedPoints[0]);
          //console.log('<circle>circleAsArcTmp', circleAsArcTmp, 'arc1', arc1, 'arc2', arc2);
          if (arc1) {
            // Arcs go counter clockwise per default
            const circleAsArc = new Arc(circle.pc, circle.r, arc1.endAngle, arc1.endAngle, true);
            //console.log('<circle>shape', shape.id, circleAsArc, 'sortedPoints', sortedPoints);

            // do the splits
            let currentArc = circleAsArc;
            // skip the first point
            for (let i = 1; i < sortedPoints.length; i++) {
              const point = sortedPoints[i];
              const [arc1, arc2] = currentArc.split(point);
              if (arc1 === null || arc2 === null) {
                console.warn('Arc1 or arc2 was null. This should not happen');
              }
              if (arc1 && arc2) {
                //console.log('save arc1', arc1);
                insertIntoFinalShapes(arc1);
                currentArc = arc2;
              }
            }
            insertIntoFinalShapes(currentArc);
          }
        } else {
          insertIntoFinalShapes(circle);
        }
      }
    }
  });

  //console.log('finalShapes', finalShapes);

  //
  // Step 2 - get all circles in the Sketch
  //
  const flattenShapeCycle: FlattenShapeSubset[][] = [];
  // 1) Generate pointsMap
  currentId = 1;
  const pointsMap: FlattenPointsMapType = {};
  const flattenPointToString = (point: Point) => {
    return point.x.toFixed(3) + ',' + point.y.toFixed(3);
  };
  const pointStringMap: Map<string, number> = new Map<string, number>();
  const tryInsertPoint = (point: Point) => {
    const strRep = flattenPointToString(point);
    if (!pointStringMap.has(strRep)) {
      pointsMap[currentId] = point;
      pointStringMap.set(strRep, currentId);
      //console.log('[insertPoint]', currentId, strRep, point);
      currentId++;
    }
  };
  finalShapes.forEach((shapeStruct) => {
    if (shapeStruct.shape instanceof Segment) {
      const segment = shapeStruct.shape as Segment;
      tryInsertPoint(segment.ps);
      tryInsertPoint(segment.pe);
    } else if (shapeStruct.shape instanceof Circle) {
      // what to insert for a circle - nothing needed since it is a "circle" itself
      //tryInsertPoint((shapeStruct.shape as Circle).center);
    } else if (shapeStruct.shape instanceof Arc) {
      const arc = shapeStruct.shape as Arc;
      //console.log('arc', arc, arc.start, arc.end, arc.middle());
      tryInsertPoint(arc.start);
      tryInsertPoint(arc.end);
      //tryInsertPoint(arc.center); // center point not needed
      tryInsertPoint(arc.middle()); // insert middle to be able to get circle between a line and an arc
      // e.g. a two circles for a line splitting a circle in two halfs
    }
  });

  //console.log('pointsMap', pointsMap);
  //console.log('pointStringMap', pointStringMap);

  const N = currentId; // number of points + 1 (first one is not used by algorithm)
  //console.log('Number of points:' + N);

  // 2) Build the graph
  const graph = Array.from(Array(N), () => Array());
  const graphShapes = Array.from(Array(N), () => Array());
  const getIdOfPoint = (point: Point) => {
    const strRep = flattenPointToString(point);
    const id = pointStringMap.get(strRep);
    if (id !== undefined) {
      return id;
    } else {
      return -1;
    }
  };
  let shapesInGraph = 0;
  finalShapes.forEach((shapeStruct) => {
    if (shapeStruct.shape instanceof Segment) {
      const segment = shapeStruct.shape as Segment;
      const startPointId = getIdOfPoint(segment.ps);
      const endPointId = getIdOfPoint(segment.pe);
      graph[startPointId].push(endPointId);
      graph[endPointId].push(startPointId);
      graphShapes[startPointId].push(shapeStruct);
      graphShapes[endPointId].push(shapeStruct);
      shapesInGraph++;
    } else if (shapeStruct.shape instanceof Circle) {
      // for cycle just store it into the result variable
      flattenShapeCycle.push([shapeStruct.shape]);
    } else if (shapeStruct.shape instanceof Arc) {
      const arc = shapeStruct.shape as Arc;
      const startPointId = getIdOfPoint(arc.start);
      const endPointId = getIdOfPoint(arc.end);
      const middle = arc.middle();
      const middlePointId = getIdOfPoint(middle);
      graph[startPointId].push(middlePointId);
      graph[endPointId].push(middlePointId);
      graph[middlePointId].push(startPointId);
      graph[middlePointId].push(endPointId);
      graphShapes[startPointId].push(shapeStruct);
      graphShapes[endPointId].push(shapeStruct);
      // also insert the arc shape two times for the middle point
      // so warning in (4) --> "Neighbor shape was undefined"
      // will not be generated
      graphShapes[middlePointId].push(shapeStruct);
      graphShapes[middlePointId].push(shapeStruct);
      shapesInGraph++;
    }
  });

  // 3) Run the DFS algorithm on the graph
  const cycles: number[][] = [];
  if (shapesInGraph > 0) {
    const color = Array(N).fill(0);
    const par = Array(N).fill(0);
    dfs_cycle(graph, 1, 0, color, par, cycles);

    /*
    console.log('graph', graph);
    console.log('graphShapes', graphShapes);
    console.log('color', color);
    console.log('par', par);
    console.log('cycles', cycles);
    */
  } else {
    console.info('No shapes in graph. dfs_cycle need not be run.');
  }

  // 4) Convert the result of the DFS algorithm
  cycles.forEach((cycle) => {
    const shapeSet: Set<FlattenShapeSubset> = new Set<FlattenShapeSubset>();
    cycle.forEach((pointIdx) => {
      const neighbors = graph[pointIdx].filter((id) => cycle.includes(id));
      if (neighbors.length === 0) {
        console.warn('Neighbors length was 0. This must not happend');
      }
      neighbors.forEach((neighbor) => {
        const idx = graph[pointIdx].findIndex((id) => id === neighbor);
        if (idx !== -1) {
          const shape = graphShapes[pointIdx][idx].shape;
          if (shape !== undefined) {
            shapeSet.add(shape);
          } else {
            console.warn('Neighbor shape was undefined for point ' + pointIdx + ' and idx ' + idx);
          }
        } else {
          console.warn('Index for neighbor with id ' + neighbor + ' not found.');
        }
      });
    });
    flattenShapeCycle.push(Array.from(shapeSet));
  });

  //console.log('flattenShapeCycle', flattenShapeCycle);

  return flattenShapeCycle;
};

const dfs_cycle = (graph: number[][], u: number, p: number, color: number[], par: number[], cycles: number[][]) => {
  // already (completely)
  // visited vertex.
  if (color[u] == 2) {
    return;
  }

  // seen vertex, but was not
  // completely visited -> cycle
  // detected. backtrack based on
  // parents to find the complete
  // cycle.
  if (color[u] == 1) {
    var v = [];
    var cur = p;
    v.push(cur);

    // backtrack the vertex which
    // are in the current cycle
    // thats found
    while (cur != u) {
      cur = par[cur];
      v.push(cur);
    }
    //cycles[cyclenumber] = v;
    //cyclenumber++;
    cycles.push(v);
    return;
  }
  par[u] = p;

  // partially visited.
  color[u] = 1;

  // simple dfs on graph
  for (let v of graph[u]) {
    // if it has not been
    // visited previously
    if (v == par[u]) {
      continue;
    }
    dfs_cycle(graph, v, u, color, par, cycles);
  }

  // completely visited.
  color[u] = 2;
};

export interface SketchCycleType {
  cycle: CadTool3DShapeSubset[];
  face: Inputs.OCCT.TopoDSFacePointer;
}

export const findCyclesInSketchAndConvertToOcct = async (sketch: SketchType, bitbybit: BitByBitOCCT) => {
  const cyclesInSketch = findConnectedLinesInSketch(sketch);

  //console.log('cyclesInSketch', cyclesInSketch);

  const result: SketchCycleType[] = [];
  for (const cycle of cyclesInSketch) {
    // 1) Convert shapes to edges
    const edges = (await Promise.all(
      cycle.map(async (shape) => {
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

    const cycleIn3D: CadTool3DShapeSubset[] = cycle.map((shape) => {
      if (shape instanceof Segment) {
        const segment = shape as Segment;
        return {
          t: SHAPE3D_TYPE.LINE,
          start: convert2DPointTo3D(sketch.plane, segment.start.x, segment.start.y),
          end: convert2DPointTo3D(sketch.plane, segment.end.x, segment.end.y),
        } as Line3DInlinePointType;
      } else if (shape instanceof Arc) {
        const arc = shape as Arc;
        const startPoint = arc.start;
        const endPoint = arc.end;
        const middlePoint = arc.center;
        return {
          t: SHAPE3D_TYPE.ARC,
          start: convert2DPointTo3D(sketch.plane, startPoint.x, startPoint.y),
          mid_pt: convert2DPointTo3D(sketch.plane, middlePoint.x, middlePoint.y),
          end: convert2DPointTo3D(sketch.plane, endPoint.x, endPoint.y),
          radius: arc.r,
          start_angle: arc.startAngle,
          end_angle: arc.endAngle,
          clockwise: !arc.counterClockwise,
          midPt2d: [middlePoint.x, middlePoint.y],
        } as ArcInlinePointType;
      } else if (shape instanceof Circle) {
        const circle = shape as Circle;
        return {
          t: SHAPE3D_TYPE.CIRCLE,
          mid_pt: convert2DPointTo3D(sketch.plane, circle.center.x, circle.center.y),
          radius: circle.r,
          midPt2d: [circle.center.x, circle.center.y],
        } as CircleInlinePointType;
      }
      console.error('Should never get here.');
    }) as CadTool3DShapeSubset[];

    //console.log('edges', edges);

    // 2) Convert edges to wires
    const wire = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: edges });
    //console.log('wire', wire);

    //const isClosed = await bitbybit.occt.shapes.shape.isClosed({ shape: wire });
    //console.log('wire isClosed', isClosed); // returns true - if this is not the case this is an error!

    // 3) Convert wires to faces
    const face = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire, planar: true });

    //const isClosedFace = await bitbybit.occt.shapes.shape.isClosed({ shape: face });
    //console.log('face isClosed', isClosedFace); // returns false

    result.push({ cycle: cycleIn3D, face: face });

    // cleanup - don't do this else we get an "Encountered Null Face!" error
    //await bitbybit.occt.deleteShapes({ shapes: [...edges, wire] });
    //await bitbybit.occt.deleteShapes({ shapes: [...edges] });
  }

  return result;
};
