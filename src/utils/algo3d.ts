import { SketchType } from '@/app/slices/Sketch';
import Flatten, { Circle, Point, Segment, Shape } from '@flatten-js/core';
import { getPointU, getPointV } from './threejs_planes';

export const findConnectedLinesInSketch = (sketch: SketchType) => {
  //const flattenPoints = sketch.points.map((point) => new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point)));
  const flattenPointsMap: { [key: number]: Point } = {};
  sketch.points.forEach((point) => {
    flattenPointsMap[point.id] = new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point));
  });
  type FlattenShapeSubset = Segment | Circle;
  type FlattenShapeStruct = { id: number; entity: FlattenShapeSubset };
  const flattenShapes: FlattenShapeStruct[] = sketch.lines.map((line) => ({
    id: line.id,
    entity: new Segment(flattenPointsMap[line.p1_id], flattenPointsMap[line.p2_id]),
  }));
  const circleShapes = sketch.circles.map((circle) => ({
    id: circle.id,
    entity: new Circle(flattenPointsMap[circle.mid_pt_id], circle.radius),
  }));
  flattenShapes.push(...circleShapes);

  // Not sure if this is needed, but keep it for now ...
  const flattenShapeMap: { [key: number]: FlattenShapeStruct } = {};
  flattenShapes.forEach((shape) => {
    flattenShapeMap[shape.id] = shape;
  });

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
        const intersectionPoints = shape.entity.intersect(otherShape.entity);

        let discardIntersectionPoints = false;
        if (shape.entity instanceof Segment) {
          const segment = shape.entity as Segment;
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

  console.log('flattenShapes', flattenShapes);
  console.log('intersectMap', intersectMap);
  console.log('affectedShapes', affectedShapes);

  const finalShapes: FlattenShapeSubset[] = [];
  // TODO For the output this needs to be calc as well:
  //const connectedShapes: CadToolShape2D[][] = [];  // CadToolShape2D = Line3DType | CircleType
  // TODO also return newly created points

  const fPointContainedInSegment = (seg: Segment, pt: Point) => {
    // check if point is part of the segment, but it is neither its start or end point
    return seg.contains(pt) && !(pt.equalTo(seg.start) || pt.equalTo(seg.end));
  };
  const segments: Segment[] = [];
  const fProcessSegment = (seg: Segment, otherSeg1: Segment | null, otherSeg2: Segment | null) => {
    let otherSeg1StartInSeg1 = false;
    let otherSeg1EndInSeg1 = false;
    let otherSeg2StartInSeg1 = false;
    let otherSeg2EndInSeg1 = false;
    if (otherSeg1 && !seg.equalTo(otherSeg1)) {
      otherSeg1StartInSeg1 = fPointContainedInSegment(seg, otherSeg1.start);
      otherSeg1EndInSeg1 = fPointContainedInSegment(seg, otherSeg1.end);
    }
    if (otherSeg2 && !seg.equalTo(otherSeg2)) {
      otherSeg2StartInSeg1 = fPointContainedInSegment(seg, otherSeg2.start);
      otherSeg2EndInSeg1 = fPointContainedInSegment(seg, otherSeg2.end);
    }
    const addSegment = !otherSeg1StartInSeg1 && !otherSeg1EndInSeg1 && !otherSeg2StartInSeg1 && !otherSeg2EndInSeg1;
    if (addSegment) {
      segments.push(seg);
    } else {
      // an additional split is necessary
      console.log(
        'otherSeg1StartInSeg1',
        otherSeg1StartInSeg1,
        'otherSeg1EndInSeg1',
        otherSeg1EndInSeg1,
        'otherSeg2StartInSeg1',
        otherSeg2StartInSeg1,
        'otherSeg2EndInSeg1',
        otherSeg2EndInSeg1
      );
      let splitPoint: Point | null = null;
      if (otherSeg1 && otherSeg1StartInSeg1) {
        splitPoint = otherSeg1.start;
      } else if (otherSeg1 && otherSeg1EndInSeg1) {
        splitPoint = otherSeg1.end;
      } else if (otherSeg2 && otherSeg2StartInSeg1) {
        splitPoint = otherSeg2.start;
      } else if (otherSeg2 && otherSeg2EndInSeg1) {
        splitPoint = otherSeg2.end;
      }
      if (splitPoint) {
        const [newSeg1, newSeg2] = seg.split(splitPoint);
        // for now don't worry about duplicate segments, they are filtered in the next step
        if (newSeg1 !== null) {
          segments.push(newSeg1);
        }
        if (newSeg2 !== null) {
          segments.push(newSeg2);
        }
      }
    }
  };

  const allSegmentsFromSplit: [Segment | null, Segment | null][] = [];
  flattenShapes.forEach((shape) => {
    if (!affectedShapes.has(shape.id)) {
      finalShapes.push(shape.entity);
    } else {
      // shapes need to be replaced
      const intersections = intersectMap[shape.id];
      intersections?.forEach((intersection) => {
        //        const otherShapeId = intersection.affectedShapes.filter((id) => id !== shape.id)[0];
        //        const otherShape = flattenShapeMap[otherShapeId];
        if (shape.entity instanceof Segment) {
          const segment = shape.entity as Segment;

          const segmentsFromSplit = intersection.intersectionPoints.map((point) => segment.split(point));
          //console.log('segmentsFromSplit', segmentsFromSplit);
          //console.log(shape.id, segment, intersection);
          allSegmentsFromSplit.push(...segmentsFromSplit);
        }

        if (shape instanceof Circle) {
          // TODO
        }
      });
    }
  });

  console.log('allSegmentsFromSplit', allSegmentsFromSplit);
  allSegmentsFromSplit.forEach(([seg1, seg2]) => {
    allSegmentsFromSplit.forEach(([seg3, seg4]) => {
      if (seg1) {
        fProcessSegment(seg1, seg3, seg4);
      }
      if (seg2) {
        fProcessSegment(seg2, seg3, seg4);
      }
    });
  });

  console.log('segments', segments);
  segments.forEach((seg) => {
    // insert Segment into finalShapes removing duplicates
    const idx = finalShapes.findIndex((shape) => shape instanceof Segment && seg.equalTo(shape as Segment));
    if (idx === -1) {
      finalShapes.push(seg);
    }
  });

  console.log('finalShapes', finalShapes);
};
