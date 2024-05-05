import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';
import { ConstraintType } from '../types/Constraints';
import axios from 'axios';
import { SolverRequestType, SolverEntityType } from '../types/SolverTypes';
import { GeometryType } from '../types/EntityType';
import {
  emptySketch,
  sketchAddConstraint,
  sketchAddEntity,
  sketchDeleteConstraint,
  sketchDeleteConstraintById,
  sketchDeleteLengthConstraintForLine,
  sketchRemoveEntity,
  sketchResetLastPoint,
  SketchType,
  sketchUpdateCircleRadius,
  sketchUpdateConstraint,
  sketchUpdateEntities,
  sketchUpdateLinePoints,
  sketchUpdatePoint,
} from './Sketch';
import { CircleType } from '../types/CircleType';

// Define a type for the slice state
export interface SketchState {
  isSolverRequestPending: boolean;
  solverRequestError: any | null;
  lastSolverResultCode: number;
  lastSolverDof: number;
  lastSolverFailedConstraints: number[];

  sketchIdCount: number;
  activeSketchId: number;
  sketches: { [key: number]: SketchType };
}

// Define the initial state using that type
const initialState: SketchState = {
  isSolverRequestPending: false,
  solverRequestError: null,
  lastSolverResultCode: -1,
  lastSolverDof: -1,
  lastSolverFailedConstraints: [],

  sketchIdCount: 0,
  activeSketchId: -1,
  sketches: {},
};

export const buildSolverRequestType = (input: {
  workplane: string;
  points: Point3DType[];
  lines: Line3DType[];
  circles: CircleType[];
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
      .concat(input.lines.map((line) => ({ id: line.id, t: 'line', v: [line.p1_id, line.p2_id] })))
      .concat(input.circles.map((circle) => ({ id: circle.id, t: 'circle', v: [circle.mid_pt_id, circle.radius] }))),
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
    createSketch: (state: SketchState) => {
      state.sketches[state.sketchIdCount] = { ...emptySketch, id: state.sketchIdCount };
      state.activeSketchId = state.sketchIdCount;
      state.sketchIdCount++;
    },
    setActiveSketch: (state: SketchState, { payload: id }) => {
      if (id < 0) {
        console.error('There is no sketch with negative id.');
        return;
      }
      if (!(id in state.sketches)) {
        console.error('There is no sketch with id ' + id + '.');
        return;
      }
      state.activeSketchId = id;
    },
    deleteSketch: (state: SketchState, { payload: id }) => {
      if (!(id in state.sketches)) {
        console.error('There is no sketch with id ' + id + '.');
        return;
      }
      delete state.sketches[id];
    },
    addEntity: (
      state: SketchState,
      action: PayloadAction<{ p: Point3DType; type: GeometryType; radius?: number }, string>
    ) => {
      sketchAddEntity(
        state.sketches[state.activeSketchId],
        action.payload.p,
        action.payload.type,
        action.payload?.radius
      );
    },
    removeEntity: (state: SketchState, { payload }) => {
      sketchRemoveEntity(state.sketches[state.activeSketchId], payload.id, payload.type);
    },
    updatePoint: (state: SketchState, { payload }) => {
      sketchUpdatePoint(state.sketches[state.activeSketchId], payload.id, payload.position);
    },
    updateLinePoints: (state: SketchState, { payload }) => {
      sketchUpdateLinePoints(state.sketches[state.activeSketchId], payload.id, payload.newStart, payload.newEnd);
    },
    updateCircleRadius: (state: SketchState, { payload }) => {
      sketchUpdateCircleRadius(state.sketches[state.activeSketchId], payload.id, payload.radius);
    },
    resetLastPoint: (state: SketchState) => {
      sketchResetLastPoint(state.sketches[state.activeSketchId]);
    },
    addConstraint: (state: SketchState, { payload }) => {
      sketchAddConstraint(state.sketches[state.activeSketchId], payload);
    },
    updateConstraint: (state: SketchState, { payload }) => {
      sketchUpdateConstraint(state.sketches[state.activeSketchId], payload);
    },
    deleteConstraint: (state: SketchState, { payload }) => {
      sketchDeleteConstraint(state.sketches[state.activeSketchId], payload);
    },
    deleteConstraintById: (state: SketchState, { payload }) => {
      sketchDeleteConstraintById(state.sketches[state.activeSketchId], payload);
    },
    deleteLengthConstraintForLine: (state: SketchState, { payload }) => {
      sketchDeleteLengthConstraintForLine(state.sketches[state.activeSketchId], payload);
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
          sketchUpdateEntities(state.sketches[state.activeSketchId], action.payload.workplane, action.payload.entities);
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

export const {
  createSketch,
  setActiveSketch,
  deleteSketch,
  addEntity,
  removeEntity,
  updatePoint,
  updateLinePoints,
  updateCircleRadius,
  resetLastPoint,
  addConstraint,
  updateConstraint,
  deleteConstraint,
  deleteConstraintById,
  deleteLengthConstraintForLine,
} = sketchSlice.actions;

export const selectActiveSketchId = (state: RootState) => state.sketchs.activeSketchId;

export const selectPoints = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].points;
export const selectPointsMap = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].pointsMap;
export const selectLines = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].lines;
export const selectCircles = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].circles;
export const selectLastPoint = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].lastPoint3D;
export const selectConstraints = (state: RootState) => state.sketchs.sketches[state.sketchs.activeSketchId].constraints;

export const selectLastSolverResultCode = (state: RootState) => state.sketchs.lastSolverResultCode;
export const selectLastDof = (state: RootState) => state.sketchs.lastSolverDof;
export const selectLastSolverFailedConstraints = (state: RootState) => state.sketchs.lastSolverFailedConstraints;

export default sketchSlice.reducer;
