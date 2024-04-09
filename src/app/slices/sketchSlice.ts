import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';
import { ConstraintType, SlvsConstraints } from '../types/Constraints';
import axios from 'axios';
import { SolverRequestType, SolverEntityType } from '../types/SolverTypes';
import { GeometryType, geometryTypeToString } from '../types/EntityType';

// Define a type for the slice state
export interface SketchState {
  isSolverRequestPending: boolean;
  solverRequestError: any | null;
  lastSolverResultCode: number;
  lastSolverDof: number;
  lastSolverFailedConstraints: number[];

  entityIdCounter: number;
  points: Point3DType[];
  pointsMap: Point3DMapType;
  lines: Line3DType[];
  // required for drawing of lines (stores the last point), not needed to persist
  lastPoint3D: Point3DType | null;

  constraintIdCounter: number;
  constraints: ConstraintType[];
}

// Define the initial state using that type
const initialState: SketchState = {
  isSolverRequestPending: false,
  solverRequestError: null,
  lastSolverResultCode: -1,
  lastSolverDof: -1,
  lastSolverFailedConstraints: [],

  entityIdCounter: 1,
  points: [],
  pointsMap: {},
  lines: [],
  lastPoint3D: null,

  constraintIdCounter: 0,
  constraints: [],
};

export const buildSolverRequestType = (input: {
  workplane: string;
  points: Point3DType[];
  lines: Line3DType[];
  constraints: ConstraintType[];
}): SolverRequestType => {
  return {
    workplane: input.workplane,
    entities: input.points
      .map<SolverEntityType>((p) => ({
        id: p.id,
        t: 'point',
        v: [p.x, p.y, p.z],
      }))
      .concat(input.lines.map((line) => ({ id: line.id, t: 'line', v: [line.p1_id, line.p2_id] }))),
    constraints: input.constraints,
  };
};

// This requires a .env file where the NEXT_PUBLIC_API_BASE_URI env variable is set properly, e.g.
//   NEXT_PUBLIC_API_BASE_URI=http://127.0.0.1:7777
// (note the port then depends on the (python) backend)
// export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URI || '';
const BASE_URL = 'http://127.0.0.1:7777';

export const callSketchSolverBackend = createAsyncThunk<any, SolverRequestType>(
  'solver/solve',
  async (data, { rejectWithValue }) => {
    const requestUrl = BASE_URL + '/solve';
    try {
      const response = await axios.post(requestUrl, data);
      //console.log('axios response', response);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const sketchSlice = createSlice({
  name: 'sketch',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<{ p: Point3DType; type: GeometryType }, string>) => {
      const newPoint = { ...action.payload.p, id: state.entityIdCounter };
      state.entityIdCounter++;

      // TODO properly handle other types when they are supported
      if (GeometryType.LINE === action.payload.type) {
        if (state.lastPoint3D) {
          if (!(state.lastPoint3D.id in state.pointsMap)) {
            state.points.push(state.lastPoint3D);
            state.pointsMap[state.lastPoint3D.id] = state.lastPoint3D;
          }
          state.points.push(newPoint);
          state.pointsMap[newPoint.id] = newPoint;
          // add the line
          state.lines.push({ p1_id: state.lastPoint3D.id, p2_id: newPoint.id, id: state.entityIdCounter });
          state.entityIdCounter++;
        }
        state.lastPoint3D = newPoint;
      } else if (GeometryType.POINT === action.payload.type) {
        state.points.push(newPoint);
        state.pointsMap[newPoint.id] = newPoint;
      } else {
        console.error(
          'The given Geometry type ' + geometryTypeToString(action.payload.type) + ' is not yet implemented'
        );
      }
    },
    removeEntity: (state, { payload }) => {
      // TODO properly handle other types when they are supported
      if (GeometryType.LINE === payload.type) {
        state.lines = state.lines.filter((line) => line.id !== payload.id);
        // also have to delete constraints referencing this line
        state.constraints = state.constraints.filter(
          (constraint) => constraint.v[3] !== payload.id && constraint.v[4] !== payload.id
        );
      } else if (GeometryType.POINT === payload.type) {
        state.points = state.points.filter((point) => point.id !== payload.id);
        delete state.pointsMap[payload.id];
        // also have to delete constraints referencing this point
        state.constraints = state.constraints.filter(
          (constraint) => constraint.v[1] !== payload.id && constraint.v[2] !== payload.id
        );
      } else {
        console.error('The given Geometry type ' + geometryTypeToString(payload.type) + ' is not yet implemented');
      }
    },
    resetLastPoint: (state) => {
      state.lastPoint3D = null;
    },
    addConstraint: (state, { payload }) => {
      if (payload.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
        // We get the line, but for the backend we need the points
        const line = state.lines.filter((line) => line.id === payload.v[3]);
        if (line.length >= 1) {
          const pt1 = state.pointsMap[line[0].p1_id];
          const pt2 = state.pointsMap[line[0].p2_id];
          line[0].length = payload.v[0]; // update the length
          state.constraints.push({
            id: state.constraintIdCounter,
            t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
            v: [payload.v[0], pt1.id, pt2.id, 0, 0],
          });
          state.constraintIdCounter++;
        } else {
          console.warn('Line with id ', payload.v[3], ' could not be found. Cannot add constraint ', payload);
        }
      } else {
        state.constraints.push({ ...payload, id: state.constraintIdCounter });
        state.constraintIdCounter++;
      }
    },
    updateConstraint: (state, { payload }) => {
      const index = state.constraints.findIndex((constraint) => constraint.id === payload.id);
      if (index !== -1) {
        const constraint = state.constraints[index];
        if (constraint.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
          const pt1 = state.pointsMap[payload.v[1]];
          const pt2 = state.pointsMap[payload.v[2]];
          const line = state.lines.filter((line) => line.p1_id === pt1.id && line.p2_id === pt2.id);
          if (line.length >= 1) {
            line[0].length = payload.v[0]; // update the length
          }
        }
        state.constraints.splice(index, 1, { ...constraint, ...payload });
      }
    },
    deleteConstraint: (state, { payload }) => {
      state.constraints = state.constraints.filter((constraint) => constraint.id !== payload.id);
      if (payload.t === SlvsConstraints.SLVS_C_PT_PT_DISTANCE) {
        const pt1 = state.pointsMap[payload.v[1]];
        const pt2 = state.pointsMap[payload.v[2]];
        const line = state.lines.filter((line) => line.p1_id === pt1.id && line.p2_id === pt2.id);
        if (line.length >= 1) {
          line[0].length = undefined; // update the length
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(callSketchSolverBackend.pending, (state) => {
        state.isSolverRequestPending = true;
        state.solverRequestError = null;

        state.lastSolverFailedConstraints = [];
      })
      .addCase(callSketchSolverBackend.fulfilled, (state, action) => {
        state.isSolverRequestPending = false;

        state.lastSolverResultCode = action.payload.code;
        state.lastSolverDof = action.payload.dof;
        if (0 === action.payload.code) {
          //console.log('received entities ', action.payload.entities);
          // Update points and pointsMap of state
          action.payload.entities.forEach((element: SolverEntityType) => {
            if (element.t === 'point') {
              // TODO this needs to be adapted when we support more planes other than xy
              state.pointsMap[element.id].x = element.v[0];
              state.pointsMap[element.id].y = element.v[1];
              const pointIndex = state.points.findIndex((p) => p.id === element.id);
              if (pointIndex !== -1) {
                state.points[pointIndex].x = element.v[0];
                state.points[pointIndex].y = element.v[1];
              } else {
                console.error(
                  'Point index was -1. Inconsistent state between state.pointsMap and state.points of this sketch'
                );
              }
            }
            // TODO support other types, e.g. circles and arcs
          });
        } else {
          // Save the action.payload.failed
          state.lastSolverFailedConstraints = action.payload.failed;
        }
      })
      .addCase(callSketchSolverBackend.rejected, (state, action) => {
        state.isSolverRequestPending = false;
        state.solverRequestError = action.payload;
      });
  },
});

export const { addEntity, removeEntity, resetLastPoint, addConstraint, updateConstraint, deleteConstraint } =
  sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;
export const selectPointsMap = (state: RootState) => state.sketchs.pointsMap;
export const selectLines = (state: RootState) => state.sketchs.lines;
export const selectLastPoint = (state: RootState) => state.sketchs.lastPoint3D;

export const selectConstraints = (state: RootState) => state.sketchs.constraints;
export const selectLastSolverResultCode = (state: RootState) => state.sketchs.lastSolverResultCode;
export const selectLastDof = (state: RootState) => state.sketchs.lastSolverDof;
export const selectLastSolverFailedConstraints = (state: RootState) => state.sketchs.lastSolverFailedConstraints;

export default sketchSlice.reducer;
