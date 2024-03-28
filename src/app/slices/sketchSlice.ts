import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';

// Define a type for the slice state
export interface SketchState {
  // Just a simple counter for demo purpose
  counter: number;

  points: Point3DType[];

  pointsMap: Point3DMapType;
  lines: Line3DType[];
  lastPoint3D: Point3DType | null;
}

// Define the initial state using that type
const initialState: SketchState = {
  counter: 0,
  points: [],

  pointsMap: {},
  lines: [],
  lastPoint3D: null,
};

export const sketchSlice = createSlice({
  name: 'sketch',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addPoint: {
      reducer(state, action: PayloadAction<{ p: Point3DType; isLine: boolean }, string>) {
        const newPoint = { ...action.payload.p, id: state.counter };
        state.counter++;

        if (action.payload.isLine) {
          if (state.lastPoint3D) {
            state.points.push(state.lastPoint3D);
            state.pointsMap[state.lastPoint3D.id] = state.lastPoint3D;
            state.points.push(newPoint);
            state.pointsMap[newPoint.id] = newPoint;
            // add the line
            state.lines.push({ p1_id: state.lastPoint3D.id, p2_id: newPoint.id, id: state.counter });
            state.counter++;
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
    /*
    addLine: (state, { payload }) => {
      const _id = state.counter;

      state.lines.push({ ...payload, id: _id });
      state.counter++;
    },
    */
  },
});

export const { addPoint, resetLastPoint } = sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;
export const selectPointsMap = (state: RootState) => state.sketchs.pointsMap;
export const selectLines = (state: RootState) => state.sketchs.lines;
export const selectLastPoint = (state: RootState) => state.sketchs.lastPoint3D;

export default sketchSlice.reducer;
