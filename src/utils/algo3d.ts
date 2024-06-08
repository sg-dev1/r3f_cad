import { SketchType } from '@/app/slices/Sketch';
import Flatten, { Arc, Circle, Point, Segment, Shape } from '@flatten-js/core';
import { getPointU, getPointV } from './threejs_planes';
import { instance } from 'three/examples/jsm/nodes/Nodes.js';

export const findConnectedLinesInSketch = (sketch: SketchType) => {
  //const flattenPoints = sketch.points.map((point) => new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point)));
  const flattenPointsMap: { [key: number]: Point } = {};
  sketch.points.forEach((point) => {
    flattenPointsMap[point.id] = new Point(getPointU(sketch.plane, point), getPointV(sketch.plane, point));
  });
  type FlattenShapeSubset = Segment | Circle | Arc;
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

  //
  // Perform the splits for the intersection points found and save the result in a list
  //
  const segments: Segment[] = [];
  const circles: Circle[] = [];
  const arcs: Arc[] = [];
  flattenShapes.forEach((shape) => {
    if (!affectedShapes.has(shape.id)) {
      finalShapes.push(shape.entity);
    } else {
      // shapes need to be replaced
      const intersections = intersectMap[shape.id];

      const intersectionPoints: Point[] = [];
      intersections?.forEach((intersection) => {
        intersectionPoints.push(...intersection.intersectionPoints);
      });

      console.log('shape', shape.id, shape.entity, 'intersect points', intersectionPoints);

      if (shape.entity instanceof Segment) {
        const segment = shape.entity as Segment;

        if (intersectionPoints.length > 0) {
          const sortedPoints = segment.sortPoints(intersectionPoints);
          console.log('<line>shape', shape.id, 'sortedPoints', sortedPoints);

          // do the splits
          let currentSegment = segment;
          sortedPoints.forEach((point) => {
            const [seg1, seg2] = currentSegment.split(point);
            if (seg1 === null || seg2 === null) {
              console.warn('Seg1 or seg2 was null. This should not happen');
            }
            if (seg1 && seg2) {
              console.log('save seg1', seg1);
              segments.push(seg1);
              currentSegment = seg2;
            }
          });
          segments.push(currentSegment);
        } else {
          // no split needed, save the segment
          segments.push(segment);
        }
      }

      if (shape.entity instanceof Circle) {
        const circle = shape.entity as Circle;
        if (intersectionPoints.length > 0) {
          const circleAsArcTmp = circle.toArc();
          const sortedPoints = circleAsArcTmp.sortPoints(intersectionPoints);

          const [arc1, _] = circleAsArcTmp.split(sortedPoints[0]);
          if (arc1) {
            // Arcs go counter clockwise per default
            const circleAsArc = new Arc(circle.pc, circle.r, arc1.endAngle, -arc1.endAngle);
            console.log('<circle>shape', shape.id, circleAsArc, 'sortedPoints', sortedPoints);

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
                console.log('save arc1', arc1);
                arcs.push(arc1);
                currentArc = arc2;
              }
            }
            arcs.push(currentArc);
          }
        } else {
          circles.push(circle);
        }
      }
    }
  });

  console.log('segments', segments);
  //
  // Obtain the list of final shapes
  //
  finalShapes.push(...segments);
  finalShapes.push(...circles);
  finalShapes.push(...arcs);

  console.log('finalShapes', finalShapes);
};
