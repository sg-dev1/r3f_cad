import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export enum ToolState {
  DISABLED = 0,
  LINE_TOOL,
  POINT_TOOL,

  CONSTRAINT_COINCIDENCE,
  CONSTRAINT_HORIZONTAL,
  CONSTRAINT_VERTICAL,
  CONSTRAINT_LENGTH,

  CURSOR_TOOL,
}

export interface SketchToolState {
  lengthConstraintLineId: number;
  selectedEntityId: number;

  toolState: ToolState;
}

const initialState: SketchToolState = {
  lengthConstraintLineId: -1,
  selectedEntityId: -1,

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
    setSelectedEntityId: (state, { payload }) => {
      //console.log('Set selected entity id to ', payload);
      state.selectedEntityId = payload;
    },
    setToolState: (state, { payload }) => {
      state.toolState = payload;
    },
  },
});

export const { setLengthConstraintLineId, setSelectedEntityId, setToolState } = sketchToolSlice.actions;

export const selectLengthConstraintLineId = (state: RootState) => state.sketchTool.lengthConstraintLineId;
export const selectSelectedEntityId = (state: RootState) => state.sketchTool.selectedEntityId;
export const selectToolState = (state: RootState) => state.sketchTool.toolState;

export default sketchToolSlice.reducer;
