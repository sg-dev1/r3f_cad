import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

// Define a type for the slice state
export interface SketchState {
  // Just a simple counter for demo purpose
  counter: number;
}

// Define the initial state using that type
const initialState: SketchState = {
  counter: 0,
};

export const sketchSlice = createSlice({
  name: 'sketch',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    //
    // Example reducers, to be removed
    //
    increment: (state) => {
      state.counter += 1;
    },
    decrement: (state) => {
      state.counter -= 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.counter += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = sketchSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.sketchs.counter;

export default sketchSlice.reducer;
