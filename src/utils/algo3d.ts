/** This library contains functionality to find all distinct circles in a sketch. */
import { SketchType } from '@/app/slices/Sketch';
import { Arc, Circle, Point, Segment, Vector } from '@flatten-js/core';
import { convert2DPointTo3D, getNormalVectorForPlane, getPointU, getPointV } from './threejs_planes';
import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { CircleInlinePointType } from '@/app/types/CircleType';
import { Line3DInlinePointType } from '@/app/types/Line3DType';
import { ArcInlinePointType } from '@/app/types/ArcType';
import { GeometryType } from '@/app/types/EntityType';

type FlattenPointsMapType = { [key: number]: Point };
type FlattenShapeSubset = Segment | Circle | Arc;
type FlattenShapeSubsetNoCircle = Segment | Arc;
type FlattenShapeStruct = { id: number; shape: FlattenShapeSubset };
type CadTool3DShapeSubset = Line3DInlinePointType | CircleInlinePointType | ArcInlinePointType;

/** Datatype returned by this library */
export interface SketchCycleType {
  cycle: CadTool3DShapeSubset[]; // the cycle
  face: Inputs.OCCT.TopoDSFacePointer; // the cycle as occt face
  faceArea: number; // area of the face (cycle)
  sketch: SketchType; // the Sketch this cycle belongs to. One Sketch may have multiple cycles.
  index: number; // index of this cycle for the given sketch
  flattenShapes: FlattenShapeSubset[]; // mainly used internal by this library
}

const findConnectedLinesInSketch = (sketch: SketchType) => {
  //
  // <Step 1> - find all intersection points of shapes in the Sketch
  //
  // Convert points and sketch shapes (Lines, Circles) into flatten shapes
  const flattenPointsMap: FlattenPointsMapType = {};
  sketch.points.forEach((point) => {
    //console.log('point', point);
    flattenPointsMap[point.id] = new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point));
  });

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
        let intersectionPoints = shape.shape.intersect(otherShape.shape);

        if (shape.shape instanceof Segment) {
          const segment = shape.shape as Segment;
          // filter out the trivial start and end points found as intersection
          intersectionPoints = intersectionPoints.filter(
            (point) => !point.equalTo(segment.start) && !point.equalTo(segment.end)
          );
        }

        if (intersectionPoints.length > 0) {
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
          // the idea here is to do the cuts like when cutting pieces from a rope
          // with sciccors, one piece after another, keeping the left piece
          // and using the right piece for the next cut
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

      // convention: all arcs are drawn counter clockwise
      if (shape.shape instanceof Circle) {
        const circle = shape.shape as Circle;
        if (intersectionPoints.length > 0) {
          const circleAsArcTmp = circle.toArc(true);
          const sortedPoints = circleAsArcTmp.sortPoints(intersectionPoints);

          const [arc1, _] = circleAsArcTmp.split(sortedPoints[0]);
          //console.log('<circle>circleAsArcTmp', circleAsArcTmp, 'arc1', arc1, 'arc2', arc2);
          //console.log(arc1?.start, arc1?.end);
          if (arc1) {
            // Arcs go counter clockwise per default
            const circleAsArc = new Arc(circle.pc, circle.r, arc1.endAngle, arc1.endAngle, true);
            //console.log('<circle>shape', shape.id, circleAsArc.start, circleAsArc.end, 'sortedPoints', sortedPoints);

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
                //console.log('save arc1', arc1.start, arc1.end);
                //console.log('arc2', arc2.start, arc2.end);
                insertIntoFinalShapes(arc1);
                currentArc = arc2;
              }
            }
            insertIntoFinalShapes(currentArc);
          } else {
            console.warn('Splitting circle - arc1 was null.');
          }
        } else {
          // no split needed, use the complete circle
          insertIntoFinalShapes(circle);
        }

        // TODO later on when sketcher supports arcs this needs to be implemented here
      }
    }
  });

  //console.log('finalShapes', finalShapes);

  //
  // <Step 2> - get all cycles in the Sketch
  //
  // 1) Generate pointsMap
  currentId = 1; // node 0 is used as "dummy start node", therefore use 1
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
      // nothing to do for a circle (it is already a cycle alone with no other shapes)
    } else if (shapeStruct.shape instanceof Arc) {
      const arc = shapeStruct.shape as Arc;
      //console.log('arc', arc, arc.start, arc.end, arc.middle());
      tryInsertPoint(arc.start);
      tryInsertPoint(arc.end);
      //tryInsertPoint(arc.center); // center point not needed
      tryInsertPoint(arc.middle()); // insert middle to be able to get circle between a line and an arc
      // e.g. a two cycles for a line splitting a circle in two halfs
    }
  });

  //console.log('pointsMap', pointsMap);
  //console.log('pointStringMap', pointStringMap);

  return extract_regions(flattenPointToString, pointStringMap, pointsMap, finalShapes);

  // keep the old implementation for now ...
  //const N = currentId; // number of points + 1 (first one is not used by algorithm)
  //console.log('Number of points:' + N);
  //return find_cycles_simple(flattenPointToString, pointStringMap, finalShapes, N);
};

// https://sci.bban.top/pdf/10.1016/0167-8655%252893%252990104-l.pdf
const extract_regions = (
  flattenPointToString: (point: Point) => string,
  pointStringMap: Map<string, number>,
  pointsMap: FlattenPointsMapType,
  finalShapes: FlattenShapeStruct[]
) => {
  const flattenShapeCycle: FlattenShapeSubset[][] = [];

  //
  // Phase zero: Build graph with list of undirected edges of arbitrary order
  //
  const getIdOfPoint = (point: Point) => {
    const strRep = flattenPointToString(point);
    const id = pointStringMap.get(strRep);
    if (id !== undefined) {
      return id;
    } else {
      return -1;
    }
  };
  const getPointForId = (id: number) => {
    if (id in pointsMap) {
      return pointsMap[id];
    } else {
      return null;
    }
  };
  const edgeCoordsToString = (c1: number, c2: number) => {
    return c1 + ',' + c2;
  };
  const graph: [number, number][] = [];
  const shapeMap: { [key: string]: FlattenShapeSubsetNoCircle } = {};
  let shapesInGraph = 0;
  finalShapes.forEach((shapeStruct) => {
    if (shapeStruct.shape instanceof Segment) {
      const segment = shapeStruct.shape as Segment;
      const startPointId = getIdOfPoint(segment.ps);
      const endPointId = getIdOfPoint(segment.pe);
      graph.push([startPointId, endPointId]);
      shapeMap[edgeCoordsToString(startPointId, endPointId)] = segment;
      shapesInGraph++;
    } else if (shapeStruct.shape instanceof Circle) {
      // for circle just store it into the result variable (it is already a cycle with single element)
      flattenShapeCycle.push([shapeStruct.shape]);
    } else if (shapeStruct.shape instanceof Arc) {
      const arc = shapeStruct.shape as Arc;
      const startPointId = getIdOfPoint(arc.start);
      const endPointId = getIdOfPoint(arc.end);
      const middle = arc.middle();
      const middlePointId = getIdOfPoint(middle);
      graph.push([startPointId, middlePointId]);
      shapeMap[edgeCoordsToString(startPointId, middlePointId)] = arc;
      graph.push([middlePointId, endPointId]);
      shapeMap[edgeCoordsToString(middlePointId, endPointId)] = arc;
      shapesInGraph++;
    }
  });

  // early exit
  if (shapesInGraph === 0) {
    console.info('No segment/ arc shapes in the graph. Extract regions algorithm need not be run.');
    return flattenShapeCycle;
  }

  //console.log('ZERO: graph', graph);

  //
  // Phase one: finding all the wedges
  //
  // Step 1 (duplicate each undirected edge)
  const graph2: [number, number][] = [];
  const edgeMap: { [key: string]: Segment } = {};
  graph.forEach(([v1, v2]) => {
    const shapeCoordStr = edgeCoordsToString(v1, v2);
    const shape = shapeMap[shapeCoordStr];
    graph2.push([v1, v2]);
    graph2.push([v2, v1]);
    const reverseShapeCoordStr = edgeCoordsToString(v2, v1);
    if (shape instanceof Segment) {
      edgeMap[shapeCoordStr] = shape;
      edgeMap[reverseShapeCoordStr] = shape.reverse();
    } else {
      // Arc
      const p1 = getPointForId(v1);
      const p2 = getPointForId(v2);
      if (p1 !== null && p2 !== null) {
        edgeMap[shapeCoordStr] = new Segment(p1, p2);
        edgeMap[reverseShapeCoordStr] = new Segment(p2, p1);
      } else {
        console.warn('P1 or p2 for ids ', v1, ' or ', v2, ' was null.', p1, p2);
      }
    }
  });

  //console.log('---PHASE 1---');
  //console.log('graph2', graph2);

  // Step 2 (add angle theta)
  const graphWithAngle: [number, number, number][] = [];
  graph2.forEach(([v1, v2]) => {
    const edge = edgeMap[edgeCoordsToString(v1, v2)];
    const start = edge.start;
    const endBase = new Point(start.x + 10, start.y); // horizontal on the right of v1
    //     v2
    //    /
    //  v1 ---- base
    const baseVector = new Vector(start, endBase);
    const edgeVector = new Vector(start, edge.end);
    const theta = baseVector.angleTo(edgeVector);
    //console.log('--step2--', v1, v2, theta);
    graphWithAngle.push([v1, v2, theta]);
  });

  // sorting is done in place, therefore this print shows the same as below
  //console.log('--step2--', graphWithAngle);

  // Step 3 (sort list graphWithAngle ascending with v1 as primary and theta as seconardy key)
  const cmpFn = (a: [number, number, number], b: [number, number, number]) => {
    if (a[0] > b[0]) {
      return 1;
    } else if (b[0] > a[0]) {
      return -1;
    } else {
      // check 2ndary key
      if (a[2] > b[2]) {
        return 1;
      } else if (b[2] > a[2]) {
        return -1;
      } else {
        return 0;
      }
    }
  };
  graphWithAngle.sort(cmpFn);
  //console.log('--step3-- (after sort)', graphWithAngle);

  // Step 4 (scan groups in sorted list to build wedges)
  const wedges: [number, number, number][] = [];
  const [entry0, ...graphWithAngleRest] = graphWithAngle;
  let group = entry0[0];
  let prevElem = entry0;
  let firstElem = entry0;
  graphWithAngleRest.forEach(([v1, v2, theta]) => {
    //console.log('v1', v1, 'v2', v2, 'theta', theta);
    if (v1 === group) {
      const wedge: [number, number, number] = [v2, v1, prevElem[1]];
      //console.log('group is v1', group, wedge);
      wedges.push(wedge);
    } else {
      // new group
      const wedge: [number, number, number] = [firstElem[1], firstElem[0], prevElem[1]];
      wedges.push(wedge);
      group = v1;
      firstElem = [v1, v2, theta];
      //console.log('next group, last wedge', wedge);
    }
    prevElem = [v1, v2, theta];
  });

  // add the very last element
  const wedge: [number, number, number] = [firstElem[1], firstElem[0], prevElem[1]];
  wedges.push(wedge);

  // sorting is done in place, therefore this print shows the same as below
  //console.log('--step4--- (wedges)', wedges);

  //
  // Phase two: grouping the wedges into regions
  //
  // Step 1: sort the wedge list
  const cmpFn2 = (a: [number, number, number], b: [number, number, number]) => {
    if (a[0] > b[0]) {
      return 1;
    } else if (b[0] > a[0]) {
      return -1;
    } else {
      // check 2ndary key
      if (a[1] > b[1]) {
        return 1;
      } else if (b[1] > a[1]) {
        return -1;
      } else {
        return 0;
      }
    }
  };
  wedges.sort(cmpFn2);
  //console.log('---PHASE 2---');
  //console.log('--step1--- (sorted wedges)', wedges);

  // Step 2: mark all wedges as unused
  const used = Array(wedges.length).fill(0);

  // Step 3: Find next unused wedge
  //const [firstWedge, ...otherWedges] = wedges;
  const allRegions: [number, number, number][][] = [];
  let nextUnusedWedge = 0;

  while (nextUnusedWedge !== -1) {
    let prev = wedges[nextUnusedWedge];
    let first = wedges[nextUnusedWedge];
    const regionList = [prev];
    used[nextUnusedWedge] = 1;

    do {
      // Step 4: binary search
      const idx = binary_search(wedges, prev[1], prev[2]);
      if (idx === -1) {
        // this should never happen
        console.error('binary_search returned -1 for', prev[1], prev[2], ' This should not happend.');
        break;
      }
      regionList.push(wedges[idx]);
      prev = wedges[idx];
      used[idx] = 1;
      //console.log('--idx', idx);
      // Step 5: contiguous check
    } while (!(prev[1] === first[0] && prev[2] === first[1]));

    allRegions.push(regionList);
    // find next unused wedge
    nextUnusedWedge = used.findIndex((value) => value === 0);
    //console.log('--nextUnusedWedge', nextUnusedWedge);
  }

  //console.log('allRegions', allRegions);

  //
  // Finally: convert result to FlattenShapeSubset[][]
  //
  allRegions.forEach((region) => {
    const shapeSet = new Set<FlattenShapeSubsetNoCircle>();
    const [firstRegionEntry, ...restOfRegion] = region;
    let prevPointId = firstRegionEntry[1];
    const edges: [number, number][] = [];
    restOfRegion.forEach(([v1, v2, v3]) => {
      edges.push([prevPointId, v2]);
      prevPointId = v2;
    });
    edges.push([prevPointId, firstRegionEntry[1]]);

    edges.forEach(([v1, v2]) => {
      let shape = shapeMap[edgeCoordsToString(v1, v2)];
      if (shape === undefined) {
        shape = shapeMap[edgeCoordsToString(v2, v1)];
      }
      //console.log(v1, v2, shape);
      shapeSet.add(shape);
    });

    flattenShapeCycle.push(Array.from(shapeSet));
  });

  //console.log('--- flattenShapeCycle', flattenShapeCycle);
  /*
  flattenShapeCycle.forEach((cycle) => {
    console.log('New cycle:');
    cycle.forEach((shape) => {
      if (shape instanceof Segment) {
        const seg = shape as Segment;
        console.log('\tSegment(', seg.start, ',' + seg.end, ')');
      } else if (shape instanceof Arc) {
        const arc = shape as Arc;
        console.log('\tArc(', arc.start, ',', arc.end, ')');
      } else {
        const circle = shape as Circle;
        console.log('\tCircle: ', circle);
      }
    });
  });
  */

  // Need to reverse (?sort some of the Arcs/ Segments)
  const flattenShapeCycle2: FlattenShapeSubset[][] = [];
  flattenShapeCycle.forEach((cycle) => {
    //console.log('-new cycle');
    const [firstShape, ...cycleRest] = cycle;
    if (firstShape instanceof Circle) {
      flattenShapeCycle2.push([firstShape]);
    } else {
      const newCycle: FlattenShapeSubset[] = [firstShape];
      //const firstStartPt = (firstShape as FlattenShapeSubsetNoCircle).start;
      let prevPt = (firstShape as FlattenShapeSubsetNoCircle).end;
      let prevIdx = 0;
      cycleRest.forEach((shape) => {
        const startPt = (shape as FlattenShapeSubsetNoCircle).start;
        const endPt = (shape as FlattenShapeSubsetNoCircle).end;
        if (!prevPt.equalTo(startPt)) {
          if (!prevPt.equalTo(endPt)) {
            //console.warn('Endpoints do not match. This leads to trouble.', prevPt, endPt, startPt);
            //console.log('\tprev rev', prevIdx);
            newCycle[prevIdx] = (newCycle[prevIdx] as FlattenShapeSubsetNoCircle).reverse();
          }

          // reverse needed
          const newShape = (shape as FlattenShapeSubsetNoCircle).reverse();
          newCycle.push(newShape);
          prevPt = newShape.end;
          //console.log('\t---- rev', newShape.start, newShape.end);
        } else {
          // use shape as is
          newCycle.push(shape);
          prevPt = endPt;
          //console.log('\t--no rev', startPt, endPt);
        }
        prevIdx++;
      });
      flattenShapeCycle2.push(newCycle);
    }
  });

  //console.log('--- flattenShapeCycle2', flattenShapeCycle2);
  /*
  flattenShapeCycle2.forEach((cycle) => {
    console.log('New cycle:');
    cycle.forEach((shape) => {
      if (shape instanceof Segment) {
        const seg = shape as Segment;
        console.log('\tSegment(', seg.start, ',' + seg.end, ')');
      } else if (shape instanceof Arc) {
        const arc = shape as Arc;
        console.log('\tArc(', arc.start, ',', arc.end, ')');
      } else {
        const circle = shape as Circle;
        console.log('\tCircle: ', circle);
      }
    });
  });
  */

  return flattenShapeCycle2;
};

const binary_search = (arr: [number, number, number][], v1: number, v2: number) => {
  let low = 0;
  let high = arr.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (arr[mid][0] === v1 && arr[mid][1] === v2) {
      // return the index
      return mid;
    } else if (arr[mid][0] < v1) {
      low = mid + 1; // discard left half
    } else if (arr[mid][0] > v1) {
      high = mid - 1; // discard right half
    } else {
      // 2ndary key
      if (arr[mid][1] < v2) {
        low = mid + 1; // discard left half
      } else {
        high = mid - 1; // discard right half
      }
    }
  }

  return -1; // not found
};

// Simple algorithm using dfs_cycle to find cycles in graph
// Has the downside that it does not find all cycles...
// Therefore it needs to be improved.
const find_cycles_simple = (
  flattenPointToString: (point: Point) => string,
  pointStringMap: Map<string, number>,
  finalShapes: FlattenShapeStruct[],
  N: number
) => {
  const flattenShapeCycle: FlattenShapeSubset[][] = [];
  //console.log('Number of points:' + N);

  // 2) Build the graph (stored as array of adjacency lists)
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
      // for circle just store it into the result variable (it is already a cycle with single element)
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

    // rerun the dfs algorithm as long as there are uncolored nodes in the graph
    while (true) {
      const numCycles = cycles.length;
      let idx = -1;
      for (let i = 1; i < color.length; i++) {
        // search for "uncolored" nodes where the dfs algorithm still needs to be run
        if (color[i] !== 2) {
          idx = i;
          break;
        }
      }
      if (idx === -1) {
        // found all cycles
        break;
      }
      dfs_cycle(graph, idx, 0, color, par, cycles);
      if (cycles.length === numCycles) {
        console.info('Nothing found in this dfs_cycle call. Giving up.');
        break;
      }
    }

    // console.log('graph', graph);
    // console.log('graphShapes', graphShapes);
    // console.log('color', color);
    // console.log('par', par);
    // console.log('cycles', cycles);
  } else {
    console.info('No segment/ arc shapes in the graph. dfs_cycle need not be run.');
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

  // 5) Sort the segments s.t. they are in the correct order
  // The shape drawing needs the points to be sorted so one line segment / arc follows the other
  const flattenShapeCycle2: FlattenShapeSubset[][] = [];
  flattenShapeCycle.forEach((cycle) => {
    if (cycle.length === 1) {
      // trivial case, do not have to run the algorithm
      flattenShapeCycle2.push(cycle);
      return;
    }

    const idxSet = new Set<number>();
    const newCycle: FlattenShapeSubset[] = [cycle[0]];
    idxSet.add(0);
    let endPoint: Point | null = null;
    if (newCycle[0] instanceof Segment) {
      endPoint = (newCycle[0] as Segment).end;
    } else if (newCycle[0] instanceof Arc) {
      endPoint = (newCycle[0] as Arc).end;
    } else {
      if (cycle.length > 1) {
        console.error('A cycle contain a circle is only allowed to have a single element.');
      }
    }

    //console.log('cycle', cycle, 'endPoint', endPoint);
    while (idxSet.size !== cycle.length) {
      let shapeFound: boolean = false;
      for (let i = 1; i < cycle.length; i++) {
        if (idxSet.has(i)) {
          // element already taken, skip it
          continue;
        }

        const shape = cycle[i];
        if (shape instanceof Segment) {
          const segment = shape as Segment;
          //console.log('segment', segment);
          if (endPoint && (segment.start.equalTo(endPoint) || segment.end.equalTo(endPoint))) {
            idxSet.add(i);
            if (segment.start.equalTo(endPoint)) {
              newCycle.push(segment);
              endPoint = segment.end;
            } else {
              // we need to reverse the segment
              newCycle.push(segment.reverse());
              endPoint = segment.start;
            }
            shapeFound = true;
            break;
          }
        } else if (shape instanceof Arc) {
          const arc = shape as Arc;
          //console.log('arc', arc, 'start', arc.start, 'end', arc.end);
          if (endPoint && (arc.start.equalTo(endPoint) || arc.end.equalTo(endPoint))) {
            idxSet.add(i);
            if (arc.start.equalTo(endPoint)) {
              newCycle.push(arc);
              endPoint = arc.end;
            } else {
              //console.log('need to reverse arc', arc);
              // we need to reverse the arc
              newCycle.push(arc.reverse());
              endPoint = arc.start;
            }
            shapeFound = true;
            break;
          }
        } else if (shape instanceof Circle) {
          console.error('A circle was found in a cycle with more than 1 element. This should not happend.');
        }
      }
      if (!shapeFound) {
        console.error('In this iteration no shape was found.');
        break;
      }
    }

    flattenShapeCycle2.push(newCycle);
  });

  console.log('flattenShapeCycle', flattenShapeCycle, 'flattenShapeCycle2', flattenShapeCycle2);

  return flattenShapeCycle2;
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

// -------------------------------------

/** Finds all cycles in the given sketch and returns a list of SketchCycleType. */
export const findCyclesInSketchAndConvertToOcct = async (sketch: SketchType, bitbybit: BitByBitOCCT) => {
  const cyclesInSketch = findConnectedLinesInSketch(sketch);

  //console.log('--- cyclesInSketch', cyclesInSketch);

  const result: SketchCycleType[] = [];
  const clusters: { [clusterIndex: number]: number[] } = {};
  let nextClusterIndex = 0;
  let cycleIndex = 0;
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
          t: GeometryType.LINE,
          start: convert2DPointTo3D(sketch.plane, segment.start.x, segment.start.y),
          end: convert2DPointTo3D(sketch.plane, segment.end.x, segment.end.y),
        } as Line3DInlinePointType;
      } else if (shape instanceof Arc) {
        const arc = shape as Arc;
        const startPoint = arc.start;
        const endPoint = arc.end;
        const middlePoint = arc.center;
        return {
          t: GeometryType.ARC,
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
          t: GeometryType.CIRCLE,
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

    const faceArea = await bitbybit.occt.shapes.face.getFaceArea({ shape: face });

    //const isClosedFace = await bitbybit.occt.shapes.shape.isClosed({ shape: face });
    //console.log('face isClosed', isClosedFace); // returns false

    result.push({
      cycle: cycleIn3D,
      face: face,
      faceArea: faceArea,
      sketch: sketch,
      index: cycleIndex,
      flattenShapes: cycle,
    });

    // cleanup - don't do this else we get an "Encountered Null Face!" error
    //await bitbybit.occt.deleteShapes({ shapes: [...edges, wire] });
    //await bitbybit.occt.deleteShapes({ shapes: [...edges] });

    cycleIndex++;

    if (cycle[0] instanceof Circle) {
      // skip all cluster checks for Circles
      continue;
    }

    let clusterIndex = -1;
    for (const [key, cycleIds] of Object.entries(clusters)) {
      // key is just the clusterid, value contains ids of all cycles
      for (let i = 0; i < cycleIds.length; i++) {
        const cycleToCompareShapes = result[cycleIds[i]].flattenShapes;
        for (let j = 0; j < cycleToCompareShapes.length; j++) {
          if (!(cycleToCompareShapes[j] instanceof Circle)) {
            const toCompareShape = cycleToCompareShapes[j] as FlattenShapeSubsetNoCircle;
            for (let k = 0; k < cycle.length; k++) {
              // here it is clear that thisShape cannot be a cycle
              const thisShape = cycle[k] as FlattenShapeSubsetNoCircle;
              const intersect = toCompareShape.intersect(thisShape);
              if (intersect.length > 0) {
                clusterIndex = Number(key);
                break;
              }
            }
          }
          if (clusterIndex !== -1) {
            break;
          }
        }
        if (clusterIndex !== -1) {
          break;
        }
      }
      if (clusterIndex !== -1) {
        break;
      }
    }

    // Note that cycleIndex was already incremented
    if (clusterIndex !== -1) {
      clusters[clusterIndex].push(cycleIndex - 1);
    } else {
      // create new cluster and add the element
      clusters[nextClusterIndex] = [cycleIndex - 1];
      nextClusterIndex++;
    }
  }

  //console.log('---clusters', clusters);

  // --- Remove from each cluster the element with the maximum area

  const newResult: SketchCycleType[] = result.filter((cycle) => cycle.cycle[0].t === GeometryType.CIRCLE);
  const facesToDelete: Inputs.OCCT.TopoDSFacePointer[] = [];
  for (const [key, cycleIds] of Object.entries(clusters)) {
    const sketchCycleInCluster = result.filter((cycle) => cycleIds.includes(cycle.index));
    const maxIdx = sketchCycleInCluster.reduce(
      (maxIndex, elem, i, result) => (elem.faceArea > sketchCycleInCluster[maxIndex].faceArea ? i : maxIndex),
      0
    );
    const reducedSketchCycle = sketchCycleInCluster.filter((item, index) => index !== maxIdx);
    newResult.push(...reducedSketchCycle);
    facesToDelete.push(sketchCycleInCluster[maxIdx].face);
  }
  // cleanup in occt
  await bitbybit.occt.deleteShapes({ shapes: facesToDelete });

  //console.log('newResult', newResult, 'result', result);

  // ---

  return newResult;
};
