import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Point3DMapType, Point3DType } from '../types/Point3DType';
import { Line3DType } from '../types/Line3DType';

// Define a type for the slice state
export interface SketchState {
  // Just a simple counter for demo purpose
  counter: number;

  points: Point3DType[];
}

// Define the initial state using that type
const initialState: SketchState = {
  counter: 0,
  points: [],
};

export const sketchSlice = createSlice({
  name: 'sketch',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addPoint: {
      reducer(state, action: PayloadAction<Point3DType, string>) {
        const _id = state.counter;

        state.points.push({ ...action.payload, id: _id });
        state.counter++;
      },
      prepare(payload: Point3DType) {
        //return { payload: { ...payload, id: 1 } };
        return { payload };
      },
      //reducer: (state, { payload }) => {},
      //prepare: (payload: PayloadAction<Point3DType>) => ({ payload: { ...payload, id: 0 } }),
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

export const { addPoint } = sketchSlice.actions;

export const selectPoints = (state: RootState) => state.sketchs.points;

export default sketchSlice.reducer;
