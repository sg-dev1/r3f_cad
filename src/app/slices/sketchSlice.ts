import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';
import { ConstraintType } from '../types/Constraints';

// Define a type for the slice state
export interface SketchState {
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
  entityIdCounter: 0,
  points: [],
  pointsMap: {},
  lines: [],
  lastPoint3D: null,

  constraintIdCounter: 0,
  constraints: [],
};

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
});

export const { addPoint, resetLastPoint, addConstraint } = sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;
export const selectPointsMap = (state: RootState) => state.sketchs.pointsMap;
export const selectLines = (state: RootState) => state.sketchs.lines;
export const selectLastPoint = (state: RootState) => state.sketchs.lastPoint3D;

export const selectConstraints = (state: RootState) => state.sketchs.constraints;

export default sketchSlice.reducer;
