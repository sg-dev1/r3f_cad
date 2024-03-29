import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';
import { ConstraintType } from '../types/Constraints';
import axios from 'axios';
import { SolverRequestType } from '../types/SolverTypes';

// Define a type for the slice state
export interface SketchState {
  isSolverRequestPending: boolean;
  isSolverRequestError: any | null;
  lastSolverResultCode: number;
  lastSolverDof: number;

  entityIdCounter: number;
  points: Point3DType[];
  pointsMap: Point3DMapType;
  lines: Line3DType[];
  lastPoint3D: Point3DType | null;

  constraintIdCounter: number;
  constraints: ConstraintType[];
}

// Define the initial state using that type
const initialState: SketchState = {
  isSolverRequestPending: false,
  isSolverRequestError: null,
  lastSolverResultCode: -1,
  lastSolverDof: -1,

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
      .map<{ id: number; t: 'point' | 'line' | 'circle' | 'arc'; v: number[] }>((p) => ({
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

// Feature: Call solver backend on each state change (geometry added, constraint added)
//
// (V1)
// To send a request to the (solver) backend, upon each addPoint/ addConstraint the following changes are needed:
//   - addPoint/ addConstraint needs to be converted to extraReducer
//   - usage of the callSketchSolverBackend thunk to make the request to the backend
//   - current implementation of addPoint/ addConstraint to be moved to callSketchSolverBackend.pending
// Issues I currently see
//  - Instead of the reducer the thunk callSketchSolverBackend, so we may need to of them with same functionality (but because of differences in addPoint/ addConstraint)
//  - How to pass the parameters then, e.g. action.payload, to callSketchSolverBackend.pending?
//       Does .pending has a action.payload (or something else, e.g. userData) we could use?
//
// See https://stackoverflow.com/a/67030875 (it seems an old version of React is used but this may also work for this new version)
//
// (V2)
// Other solution: Decouple it - do not call the thunk from the reducer directly, but
//   - listen to state changes with selector
//   - on each new state --> call the async thunk with data  (may require cancle ongoing requests, performance? - will also depend on performance of backend)
//   - the request object needs to be built from the sketch state data anyways
//
// (V2) prefered because much simpler

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
      state.constraints.push({ ...payload, id: state.constraintIdCounter });
      state.constraintIdCounter++;
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
        state.isSolverRequestError = null;
      })
      .addCase(callSketchSolverBackend.fulfilled, (state, action) => {
        state.isSolverRequestPending = false;

        state.lastSolverResultCode = action.payload.code;
        state.lastSolverDof = action.payload.dof;
        if (0 === action.payload.code) {
          // TODO parse the action.payload.entities
          console.log('received entities ', action.payload.entities);
        } else {
          // TODO parse the action.payload.failed
          console.log('received failed ', action.payload.failed);
        }
      })
      .addCase(callSketchSolverBackend.rejected, (state, action) => {
        state.isSolverRequestPending = false;
        state.isSolverRequestError = action.payload;
      });
  },
});

export const { addPoint, resetLastPoint, addConstraint } = sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;
export const selectPointsMap = (state: RootState) => state.sketchs.pointsMap;
export const selectLines = (state: RootState) => state.sketchs.lines;
export const selectLastPoint = (state: RootState) => state.sketchs.lastPoint3D;

export const selectConstraints = (state: RootState) => state.sketchs.constraints;

export default sketchSlice.reducer;
