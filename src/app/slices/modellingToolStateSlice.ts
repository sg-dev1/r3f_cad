import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface ModellingToolState {
  sketchToExtrude: number;
}

const initialState: ModellingToolState = {
  sketchToExtrude: -1,
};

export const modellingToolSlice = createSlice({
  name: 'modellingToolSlice',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSketchToExtrude: (state, { payload }) => {
      state.sketchToExtrude = payload;
    },
  },
});

export const { setSketchToExtrude } = modellingToolSlice.actions;

export const selectSketchToExtrude = (state: RootState) => state.modellingTool.sketchToExtrude;

export default modellingToolSlice.reducer;
