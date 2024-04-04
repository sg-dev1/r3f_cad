import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';
import { ConstraintType, SlvsConstraints } from '../types/Constraints';
import axios from 'axios';
import { SolverRequestType, SolverEntityType } from '../types/SolverTypes';

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
  lastPoint3D: Point3DType | null;

  constraintIdCounter: number;
  constraints: ConstraintType[];

  // Tool states
  lengthConstraintLineId: number;
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

  lengthConstraintLineId: -1,
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
    // TODO decide about Request method and url
    // TODO add axios as dependency
    const requestUrl = BASE_URL + '/solve';
    try {
      const response = await axios.post(requestUrl, data);
      //console.log('axios response', response);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
    // const requestUrl = ApiEndpoint.getCompanyPath();
    // const payload = ApiEndpoint.makeApiPayload(requestUrl, 'GET', true, {});
    // try {
    //   const response = await axios(payload);
    //   return response.data;
    // } catch (error: any) {
    //   return rejectWithValue(error.response.data);
    // }
  }
);

// TODO the addPoint may be renamed to addGeometry object (maybe with generic GeometryType instead of boolean)
export const sketchSlice = createSlice({
  name: 'sketch',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addPoint: {
      reducer(state, action: PayloadAction<{ p: Point3DType; isLine: boolean }, string>) {
        const newPoint = { ...action.payload.p, id: state.entityIdCounter };
        state.entityIdCounter++;

        if (action.payload.isLine) {
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
        } else {
          state.points.push(newPoint);
          state.pointsMap[newPoint.id] = newPoint;
        }
      },
      prepare(payload: { p: Point3DType; isLine: boolean }) {
        //return { payload: { ...payload, id: 1 } };
        return { payload };
      },
      //reducer: (state, { payload }) => {},
      //prepare: (payload: PayloadAction<Point3DType>) => ({ payload: { ...payload, id: 0 } }),
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
    setLengthConstraintLineId: (state, { payload }) => {
      state.lengthConstraintLineId = payload;
    },
    /*
    addLine: (state, { payload }) => {
      const _id = state.counter;

      state.lines.push({ ...payload, id: _id });
      state.counter++;
    },
    */
  },
  extraReducers: (builder) => {
    builder
      .addCase(callSketchSolverBackend.pending, (state) => {
        state.isSolverRequestPending = true;
        state.solverRequestError = null;
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
          // TODO parse the action.payload.failed - need to highlight them (at first they need to be shown at all)
          console.log('Failed constraints ', action.payload.failed);
        }
      })
      .addCase(callSketchSolverBackend.rejected, (state, action) => {
        state.isSolverRequestPending = false;
        state.solverRequestError = action.payload;
      });
  },
});

export const { addPoint, resetLastPoint, addConstraint, setLengthConstraintLineId } = sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;
export const selectPointsMap = (state: RootState) => state.sketchs.pointsMap;
export const selectLines = (state: RootState) => state.sketchs.lines;
export const selectLastPoint = (state: RootState) => state.sketchs.lastPoint3D;

export const selectConstraints = (state: RootState) => state.sketchs.constraints;
export const selectLastSolverResultCode = (state: RootState) => state.sketchs.lastSolverResultCode;
export const selectLastDof = (state: RootState) => state.sketchs.lastSolverDof;
export const selectLastSolverFailedConstraints = (state: RootState) => state.sketchs.lastSolverFailedConstraints;

export const selectLengthConstraintLineId = (state: RootState) => state.sketchs.lengthConstraintLineId;

export default sketchSlice.reducer;
