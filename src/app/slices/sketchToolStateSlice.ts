import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface SketchToolState {
  lengthConstraintLineId: number;
  selectedEntityId: number;
}

const initialState: SketchToolState = {
  lengthConstraintLineId: -1,
  selectedEntityId: -1,
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
      console.log('Set selected entity id to ', payload);
      state.selectedEntityId = payload;
    },
  },
});

export const { setLengthConstraintLineId, setSelectedEntityId } = sketchToolSlice.actions;

export const selectLengthConstraintLineId = (state: RootState) => state.sketchTool.lengthConstraintLineId;
export const selectSelectedEntityId = (state: RootState) => state.sketchTool.selectedEntityId;

export default sketchToolSlice.reducer;
