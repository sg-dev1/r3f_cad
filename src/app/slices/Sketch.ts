import { ConstraintType, SlvsConstraints } from '../types/Constraints';
import { GeometryType, geometryTypeToString } from '../types/EntityType';
import { Line3DType } from '../types/Line3DType';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { SolverEntityType } from '../types/SolverTypes';

export interface SketchType {
  id: number;

  entityIdCounter: number;
  points: Point3DType[];
  pointsMap: Point3DMapType;
  lines: Line3DType[];

  // required for drawing of lines (stores the last point), not needed to persist
  lastPoint3D: Point3DType | null;

  constraintIdCounter: number;
  constraints: ConstraintType[];
}

export const emptySketch: SketchType = {
  id: -1,

  entityIdCounter: 1,
  points: [],
  pointsMap: {},
  lines: [],
  lastPoint3D: null,

  constraintIdCounter: 0,
  constraints: [],
};

export const sketchAddEntity = (sketch: SketchType, p: Point3DType, type: GeometryType): SketchType => {
  const newPoint = { ...p, id: sketch.entityIdCounter };
  sketch.entityIdCounter++;

  // TODO properly handle other types when they are supported
  if (GeometryType.LINE === type) {
    if (sketch.lastPoint3D) {
      if (!(sketch.lastPoint3D.id in sketch.pointsMap)) {
        sketch.points.push(sketch.lastPoint3D);
        sketch.pointsMap[sketch.lastPoint3D.id] = sketch.lastPoint3D;
      }
      sketch.points.push(newPoint);
      sketch.pointsMap[newPoint.id] = newPoint;
      // add the line
      sketch.lines.push({ p1_id: sketch.lastPoint3D.id, p2_id: newPoint.id, id: sketch.entityIdCounter });
      sketch.entityIdCounter++;
    }
    sketch.lastPoint3D = newPoint;
  } else if (GeometryType.POINT === type) {
    sketch.points.push(newPoint);
    sketch.pointsMap[newPoint.id] = newPoint;
  } else {
    console.error('The given Geometry type ' + geometryTypeToString(type) + ' is not yet implemented');
  }

  return sketch;
};

export const sketchRemoveEntity = (sketch: SketchType, id: number, type: GeometryType): SketchType => {
  // TODO properly handle other types when they are supported
  if (GeometryType.LINE === type) {
    sketch.lines = sketch.lines.filter((line) => line.id !== id);
    // also have to delete constraints referencing this line
    sketch.constraints = sketch.constraints.filter((constraint) => constraint.v[3] !== id && constraint.v[4] !== id);
  } else if (GeometryType.POINT === type) {
    sketch.points = sketch.points.filter((point) => point.id !== id);
    delete sketch.pointsMap[id];
    // also have to delete constraints referencing this point
    sketch.constraints = sketch.constraints.filter((constraint) => constraint.v[1] !== id && constraint.v[2] !== id);
  } else {
    console.error('The given Geometry type ' + geometryTypeToString(type) + ' is not yet implemented');
  }

  return sketch;
};

export const sketchResetLastPoint = (sketch: SketchType): SketchType => {
  sketch.lastPoint3D = null;
  return sketch;
};

export const sketchAddConstraint = (sketch: SketchType, payload: ConstraintType): SketchType => {
  if (payload.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
    // We get the line, but for the backend we need the points
    const line = sketch.lines.filter((line) => line.id === payload.v[3]);
    if (line.length >= 1) {
      const pt1 = sketch.pointsMap[line[0].p1_id];
      const pt2 = sketch.pointsMap[line[0].p2_id];
      line[0].length = payload.v[0] as number; // update the length
      sketch.constraints.push({
        id: sketch.constraintIdCounter,
        t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
        v: [payload.v[0], pt1.id, pt2.id, 0, 0],
      });
      sketch.constraintIdCounter++;
    } else {
      console.warn('Line with id ', payload.v[3], ' could not be found. Cannot add constraint ', payload);
    }
  } else {
    sketch.constraints.push({ ...payload, id: sketch.constraintIdCounter });
    sketch.constraintIdCounter++;
  }

  return sketch;
};

export const sketchUpdateConstraint = (sketch: SketchType, payload: ConstraintType): SketchType => {
  const index = sketch.constraints.findIndex((constraint) => constraint.id === payload.id);
  if (index !== -1) {
    const constraint = sketch.constraints[index];
    if (constraint.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
      const pt1 = sketch.pointsMap[payload.v[1] as number];
      const pt2 = sketch.pointsMap[payload.v[2] as number];
      const line = sketch.lines.filter((line) => line.p1_id === pt1.id && line.p2_id === pt2.id);
      if (line.length >= 1) {
        line[0].length = payload.v[0] as number; // update the length
      }
    }
    sketch.constraints.splice(index, 1, { ...constraint, ...payload });
  }

  return sketch;
};

export const sketchDeleteConstraint = (sketch: SketchType, payload: ConstraintType): SketchType => {
  sketch.constraints = sketch.constraints.filter((constraint) => constraint.id !== payload.id);
  if (payload.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
    const pt1 = sketch.pointsMap[payload.v[1] as number];
    const pt2 = sketch.pointsMap[payload.v[2] as number];
    const line = sketch.lines.filter((line) => line.p1_id === pt1.id && line.p2_id === pt2.id);
    if (line.length >= 1) {
      line[0].length = undefined; // update the length
    }
  }

  return sketch;
};

export const sketchUpdateEntities = (sketch: SketchType, entities: SolverEntityType[]): SketchType => {
  entities.forEach((element: SolverEntityType) => {
    // Update points and pointsMap of sketch
    if (element.t === 'point') {
      // TODO this needs to be adapted when we support more planes other than xy
      sketch.pointsMap[element.id] = { ...sketch.pointsMap[element.id], x: element.v[0], y: element.v[1] };
      const pointIndex = sketch.points.findIndex((p) => p.id === element.id);
      if (pointIndex !== -1) {
        sketch.points[pointIndex] = { ...sketch.points[pointIndex], x: element.v[0], y: element.v[1] };
      } else {
        console.error('Point index was -1. Inconsistent state between state.pointsMap and state.points of this sketch');
      }
    }
    // TODO support other types, e.g. circles and arcs
  });

  return sketch;
};
