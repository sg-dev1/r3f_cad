/** This library contains the type and logic for handling sketches.
 *
 *  Main logic for sketches consists of CRUD operations for entities (points, lines, circles)
 *  and constraints.
 */
import { CircleType } from '../types/CircleType';
import { ConstraintType, SlvsConstraints } from '../types/Constraints';
import { GeometryType, geometryTypeToString } from '../types/EntityType';
import { Line3DType } from '../types/Line3DType';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { SolverEntityType } from '../types/SolverTypes';

export interface SketchPlaneType {
  plane: string;
  normalVector: [number, number, number];
  offset: number;
}

export interface SketchType {
  id: number;
  name: string;
  //plane: string;
  plane: SketchPlaneType;
  isVisible: boolean;

  entityIdCounter: number;
  points: Point3DType[];
  pointsMap: Point3DMapType;
  lines: Line3DType[];
  circles: CircleType[];

  // required for drawing of lines (stores the last point), not needed to persist
  lastPoint3D: Point3DType | null;

  constraintIdCounter: number;
  constraints: ConstraintType[];
}

export const emptySketch: SketchType = {
  id: -1,
  name: '',
  //plane: '',
  plane: {
    plane: '',
    normalVector: [0, 0, 0],
    offset: 0,
  },
  isVisible: true,

  entityIdCounter: 1,
  points: [],
  pointsMap: {},
  lines: [],
  circles: [],
  lastPoint3D: null,

  constraintIdCounter: 0,
  constraints: [],
};

export const sketchAddEntity = (sketch: SketchType, p: Point3DType, type: GeometryType, radius?: number) => {
  const newPoint = { ...p, id: sketch.entityIdCounter };
  sketch.entityIdCounter++;

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
  } else if (GeometryType.CIRCLE === type) {
    // midpoint
    sketch.points.push(newPoint);
    sketch.pointsMap[newPoint.id] = newPoint;

    sketch.circles.push({ id: sketch.entityIdCounter, mid_pt_id: newPoint.id, radius: radius || 1 });
    sketch.entityIdCounter++;
  } else if (GeometryType.ARC === type) {
    console.warn('Geometry type arc is not yet supported.');
    // TODO add arc support
  } else {
    console.error('The given Geometry type ' + geometryTypeToString(type) + ' is not yet implemented');
  }
};

export const sketchRemoveEntity = (sketch: SketchType, id: number, type: GeometryType) => {
  if (GeometryType.LINE === type) {
    sketch.lines = sketch.lines.filter((line) => line.id !== id);
    // also have to delete constraints referencing this line
    sketch.constraints = sketch.constraints.filter((constraint) => constraint.v[3] !== id && constraint.v[4] !== id);
  } else if (GeometryType.POINT === type) {
    const circles = sketch.circles.filter((circle) => circle.mid_pt_id === id);
    if (circles.length > 0) {
      _deleteCircleById(sketch, circles[0].id);
    }
    _deletePointById(sketch, id);
  } else if (GeometryType.CIRCLE === type) {
    const idx = sketch.circles.findIndex((circle) => circle.id === id);
    const pt_id = sketch.circles[idx].mid_pt_id;
    _deletePointById(sketch, pt_id);
    _deleteCircleById(sketch, id);
  } else if (GeometryType.ARC === type) {
    console.warn('Geometry type arc is not yet supported.');
    // TODO add arc support
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

export const sketchUpdateCircleRadius = (sketch: SketchType, circleId: number, newRadius: number) => {
  const circle = sketch.circles.filter((circle) => circle.id === circleId);
  if (circle.length > 0) {
    circle[0].radius = newRadius;
  } else {
    console.error('Circle with id ' + circleId + ' could not be found');
  }
};

export const sketchResetLastPoint = (sketch: SketchType) => {
  sketch.lastPoint3D = null;
};

export const sketchAddConstraint = (sketch: SketchType, payload: ConstraintType) => {
  sketch.constraints.push({ ...payload, id: sketch.constraintIdCounter });
  sketch.constraintIdCounter++;
};

export const sketchUpdateConstraint = (sketch: SketchType, payload: ConstraintType) => {
  const index = sketch.constraints.findIndex((constraint) => constraint.id === payload.id);
  if (index !== -1) {
    const constraint = sketch.constraints[index];
    sketch.constraints.splice(index, 1, { ...constraint, ...payload });
  }
};

export const sketchDeleteConstraint = (sketch: SketchType, payload: ConstraintType) => {
  sketchDeleteConstraintById(sketch, payload.id);
};

export const sketchDeleteConstraintById = (sketch: SketchType, id: number) => {
  sketch.constraints = sketch.constraints.filter((constraint) => constraint.id !== id);
};

// Delete the length constraint for a line with given lineId
export const sketchDeleteLengthConstraintForLine = (sketch: SketchType, lineId: number) => {
  const constraint = _getConstraintForLineWithPtToPtDistanceType(sketch, lineId);
  if (constraint) {
    sketchDeleteConstraintById(sketch, constraint.constraint.id);
  }
};

export const sketchUpdateEntities = (sketch: SketchType, workplane: string, entities: SolverEntityType[]) => {
  entities.forEach((element: SolverEntityType) => {
    // Update points and pointsMap of sketch
    if (element.t === 'point') {
      //console.log('element.v', element.v);
      if ('xy' === workplane) {
        _updatePoint(sketch, { ...sketch.pointsMap[element.id], x: element.v[0], y: element.v[1] });
      } else if ('xz' === workplane) {
        _updatePoint(sketch, { ...sketch.pointsMap[element.id], x: element.v[0], z: element.v[1] });
      } else if ('yz' === workplane) {
        // beware of correct y (= v) and z (= u) since y goes up in three.js
        _updatePoint(sketch, { ...sketch.pointsMap[element.id], y: element.v[1], z: element.v[0] });
      } else {
        console.error('Invalid workplane ' + workplane + ' received.');
      }
    } else if (element.t === 'circle') {
      sketchUpdateCircleRadius(sketch, element.id, element.v[1]);
    } else if (element.t === 'arc') {
      // TODO add arc support
      console.warn('[sketchUpdateEntities] Arc is not yet supported');
    }
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
const _getConstraintForLineWithPtToPtDistanceType = (sketch: SketchType, lineId: number) => {
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

const _deleteConstraintsForLines = (sketch: SketchType, lines: Line3DType[]) => {
  const lineIds = lines.map((line) => line.id);
  // delete all constraints that reference the lineid
  sketch.constraints = sketch.constraints.filter(
    (c) => lineIds.indexOf(c.v[3] as number) === -1 && lineIds.indexOf(c.v[4] as number) === -1
  );
};

const _deletePointById = (sketch: SketchType, id: number) => {
  sketch.points = sketch.points.filter((point) => point.id !== id);
  delete sketch.pointsMap[id];
  // also have to delete constraints referencing this point
  sketch.constraints = sketch.constraints.filter((constraint) => constraint.v[1] !== id && constraint.v[2] !== id);
  // also delete a line referencing this point
  const linesToDelete = sketch.lines.filter((line) => line.p1_id === id || line.p2_id === id);
  sketch.lines = sketch.lines.filter((line) => line.p1_id !== id && line.p2_id !== id);
  _deleteConstraintsForLines(sketch, linesToDelete);
};

const _deleteCircleById = (sketch: SketchType, id: number) => {
  sketch.circles = sketch.circles.filter((circle) => circle.id !== id);
  sketch.constraints = sketch.constraints.filter((constraint) => constraint.v[3] !== id && constraint.v[4] !== id);
};
