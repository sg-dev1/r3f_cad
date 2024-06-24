import { configureStore } from '@reduxjs/toolkit';
import sketchReducer from './slices/sketchSlice';
import sketchToolReducer from './slices/sketchToolStateSlice';
import modellingReducer from './slices/modellingToolStateSlice';
import geom3dReducer from './slices/geom3dSlice';
// ...

export const store = configureStore({
  reducer: {
    sketchs: sketchReducer,
    sketchTool: sketchToolReducer,
    modellingTool: modellingReducer,
    geom3d: geom3dReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
