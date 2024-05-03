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

export const sketchAddEntity = (sketch: SketchType, p: Point3DType, type: GeometryType) => {
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
};

export const sketchRemoveEntity = (sketch: SketchType, id: number, type: GeometryType) => {
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
};

export const sketchUpdatePoint = (sketch: SketchType, id: number, position: number[]) => {
  _updatePoint(sketch, { id: id, x: position[0], y: position[1], z: position[2] });
};

export const sketchUpdateLinePoints = (sketch: SketchType, id: number, newStart: number[], newEnd: number[]) => {
  const line = sketch.lines.find((line) => line.id === id);
  if (line) {
    _updatePoint(sketch, { id: line.p1_id, x: newStart[0], y: newStart[1], z: newStart[2] });
    _updatePoint(sketch, { id: line.p2_id, x: newEnd[0], y: newEnd[1], z: newEnd[2] });
  }
};

export const sketchResetLastPoint = (sketch: SketchType) => {
  sketch.lastPoint3D = null;
};

export const sketchAddConstraint = (sketch: SketchType, payload: ConstraintType) => {
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
};

export const sketchUpdateConstraint = (sketch: SketchType, payload: ConstraintType) => {
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
};

// Update a the length constraint of a line
//   given its lineId and the payload in the format
//   { id: 0, t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE, v: [value, 0, 0, 0, 0] }
// See LineObject.tsx for usage.
export const sketchUpdateLengthConstraintForLine = (sketch: SketchType, lineId: number, payload: ConstraintType) => {
  if (payload.t !== SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
    console.error('This function currently only supports SlvsConstraints.SLVS_C_PT_PT_DISTANCE');
    return;
  }

  const constraint = _getConstraintForLine(sketch, lineId);
  if (constraint) {
    sketchUpdateConstraint(sketch, {
      ...payload,
      id: constraint.constraint.id,
      v: [payload.v[0], constraint.p1_id, constraint.p2_id, 0, 0],
    });
  }
};

export const sketchDeleteConstraint = (sketch: SketchType, payload: ConstraintType) => {
  sketchDeleteConstraintById(sketch, payload.id);
  if (payload.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
    const pt1 = sketch.pointsMap[payload.v[1] as number];
    const pt2 = sketch.pointsMap[payload.v[2] as number];
    const line = sketch.lines.filter((line) => line.p1_id === pt1.id && line.p2_id === pt2.id);
    if (line.length >= 1) {
      line[0].length = undefined; // update the length
    }
  }
};

export const sketchDeleteConstraintById = (sketch: SketchType, id: number) => {
  sketch.constraints = sketch.constraints.filter((constraint) => constraint.id !== id);
};

// Delete the length constraint for a line with given lineId
export const sketchDeleteLengthConstraintForLine = (sketch: SketchType, lineId: number) => {
  const constraint = _getConstraintForLine(sketch, lineId);
  if (constraint) {
    sketchDeleteConstraint(sketch, {
      id: constraint.constraint.id,
      t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
      v: [0, constraint.p1_id, constraint.p2_id, 0, 0],
    });
  }
};

export const sketchUpdateEntities = (sketch: SketchType, entities: SolverEntityType[]) => {
  entities.forEach((element: SolverEntityType) => {
    // Update points and pointsMap of sketch
    if (element.t === 'point') {
      //console.log('element.v', element.v);
      // TODO this needs to be adapted when we support more planes other than xy  (element.v currently only has to elements)
      _updatePoint(sketch, { ...sketch.pointsMap[element.id], x: element.v[0], y: element.v[1] });
    }
    // TODO support other types, e.g. circles and arcs
  });
};

// ---

const _updatePoint = (sketch: SketchType, newPoint: Point3DType) => {
  sketch.pointsMap[newPoint.id] = newPoint;
  const pointIndex = sketch.points.findIndex((p) => p.id === newPoint.id);
  if (pointIndex !== -1) {
    sketch.points.splice(pointIndex, 1, newPoint);
  } else {
    console.error('Point index was -1. Inconsistent state between state.pointsMap and state.points of this sketch');
  }
};

// Get the constraint object for a line with given lineId
const _getConstraintForLine = (sketch: SketchType, lineId: number) => {
  const lineLst = sketch.lines.filter((line) => line.id === lineId);
  if (lineLst.length > 0) {
    const line = lineLst[0];
    const constraintsForLine = sketch.constraints.filter(
      (c) => (c.v[1] === line.p1_id && c.v[2] === line.p2_id) || (c.v[2] === line.p2_id && c.v[1] === line.p1_id)
    );
    const constraintsForLineWithType = constraintsForLine.filter((c) => c.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE);

    //console.log('constraintsForLine', constraintsForLine);
    //console.log('constraintsForLineWithType', constraintsForLineWithType);

    if (constraintsForLineWithType.length > 0) {
      return { constraint: constraintsForLineWithType[0], p1_id: line.p1_id, p2_id: line.p2_id };
    }

    return null;
  }
};
