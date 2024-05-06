import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export enum ToolState {
  DISABLED = 0,
  LINE_TOOL,
  POINT_TOOL,
  CIRCLE_TOOL,

  CONSTRAINT_COINCIDENCE,
  CONSTRAINT_HORIZONTAL,
  CONSTRAINT_VERTICAL,
  CONSTRAINT_LENGTH,
  CONSTRAINT_DIAMETER,
  CONSTRAINT_PARALLEL,
  CONSTRAINT_EQUAL,

  CURSOR_TOOL,
}

export interface SketchToolState {
  lengthConstraintLineId: number;
  diamConstraintCircleId: number;
  selectedEntityId: number;
  selectedConstraintId: number;
  currentPlane: string;

  toolState: ToolState;
}

const initialState: SketchToolState = {
  lengthConstraintLineId: -1,
  diamConstraintCircleId: -1,
  selectedEntityId: -1,
  selectedConstraintId: -1,
  currentPlane: 'xy',

  toolState: ToolState.LINE_TOOL,
};

export const sketchToolSlice = createSlice({
  name: 'sketchTool',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setLengthConstraintLineId: (state, { payload }) => {
      state.lengthConstraintLineId = payload;
    },
    setDiamConstraintCircleId: (state, { payload }) => {
      state.diamConstraintCircleId = payload;
    },
    setSelectedEntityId: (state, { payload }) => {
      //console.log('Set selected entity id to ', payload);
      state.selectedEntityId = payload;
    },
    setSelectedConstraintId: (state, { payload }) => {
      state.selectedConstraintId = payload;
    },
    setToolState: (state, { payload }) => {
      state.toolState = payload;
    },
    setCurrentPlane: (state, { payload }) => {
      state.currentPlane = payload;
    },
  },
});

export const {
  setLengthConstraintLineId,
  setDiamConstraintCircleId,
  setSelectedEntityId,
  setSelectedConstraintId,
  setToolState,
  setCurrentPlane,
} = sketchToolSlice.actions;

export const selectLengthConstraintLineId = (state: RootState) => state.sketchTool.lengthConstraintLineId;
export const selectDiamConstraintCircleId = (state: RootState) => state.sketchTool.diamConstraintCircleId;
export const selectSelectedEntityId = (state: RootState) => state.sketchTool.selectedEntityId;
export const selectSelectedConstraintId = (state: RootState) => state.sketchTool.selectedConstraintId;
export const selectToolState = (state: RootState) => state.sketchTool.toolState;
export const selectCurrentPlane = (state: RootState) => state.sketchTool.currentPlane;

export default sketchToolSlice.reducer;
