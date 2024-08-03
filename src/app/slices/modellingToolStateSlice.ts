/** This redux slice holds state information for the 3D modelling tool. */
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export enum ModellingToolStateEnum {
  EXTRUDE = 0,
  UNION = 1,
}

export interface ModellingToolState {
  sketchToExtrude: [number, string];
  selectedSketch: number;

  toolState: ModellingToolStateEnum;
  selectedShapeIds: number[];

  updatedSketchId: number;
  deletedSketchId: number;
}

const initialState: ModellingToolState = {
  sketchToExtrude: [-1, ''],
  selectedSketch: -1,

  toolState: ModellingToolStateEnum.EXTRUDE,
  selectedShapeIds: [],

  updatedSketchId: -1,
  deletedSketchId: -1,
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
    setModellingToolState: (state, { payload }) => {
      state.toolState = payload;
    },
    // First click adds the geometry, a second click removes it again from the selectedShapeIds list
    addOrRemoveSelectedShapeId: (state, { payload }) => {
      const idx = state.selectedShapeIds.findIndex((value) => value === payload);
      if (idx === -1) {
        state.selectedShapeIds.push(payload);
      } else {
        state.selectedShapeIds = state.selectedShapeIds.filter((value) => value !== payload);
      }
    },
    removeSelectedShapeId: (state, { payload }) => {
      state.selectedShapeIds = state.selectedShapeIds.filter((value) => value !== payload);
    },
    clearSelectedShapeIds: (state) => {
      state.selectedShapeIds = [];
    },
    setUpdatedSketchId: (state, { payload }) => {
      state.updatedSketchId = payload;
    },
    setDeletedSketchId: (state, { payload }) => {
      state.deletedSketchId = payload;
    },
  },
});

export const {
  setSketchToExtrude,
  setSelectedSketch,
  setModellingToolState,
  addOrRemoveSelectedShapeId,
  removeSelectedShapeId,
  clearSelectedShapeIds,
  setUpdatedSketchId,
  setDeletedSketchId,
} = modellingToolSlice.actions;

export const selectSketchToExtrude = (state: RootState) => state.modellingTool.sketchToExtrude;
export const selectSelectedSketch = (state: RootState) => state.modellingTool.selectedSketch;
export const selectModellingToolState = (state: RootState) => state.modellingTool.toolState;
export const selectSelectedShapeIds = (state: RootState) => state.modellingTool.selectedShapeIds;
export const selectUpdatedSketchId = (state: RootState) => state.modellingTool.updatedSketchId;
export const selectDeletedSketchId = (state: RootState) => state.modellingTool.deletedSketchId;

export default modellingToolSlice.reducer;
