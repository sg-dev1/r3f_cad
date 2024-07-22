/** This redux slice holds state information for the 3D modelling tool. */
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface ModellingToolState {
  sketchToExtrude: [number, string];
  selectedSketch: number;
}

const initialState: ModellingToolState = {
  sketchToExtrude: [-1, ''],
  selectedSketch: -1,
};

export const modellingToolSlice = createSlice({
  name: 'modellingToolSlice',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSketchToExtrude: (state, { payload }) => {
      state.sketchToExtrude = payload;
    },
    setSelectedSketch: (state, { payload }) => {
      state.selectedSketch = payload;
    },
  },
});

export const { setSketchToExtrude, setSelectedSketch } = modellingToolSlice.actions;

export const selectSketchToExtrude = (state: RootState) => state.modellingTool.sketchToExtrude;
export const selectSelectedSketch = (state: RootState) => state.modellingTool.selectedSketch;

export default modellingToolSlice.reducer;
