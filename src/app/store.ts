/** This library contains the setup logic for the redux store. */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import sketchReducer from './slices/sketchSlice';
import sketchToolReducer from './slices/sketchToolStateSlice';
import modellingReducer from './slices/modellingToolStateSlice';
import geom3dReducer from './slices/geom3dSlice';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// ...

const persistConfig = {
  key: 'root', // key for persisted state in storage
  storage, // localStorage as storage engine
  blacklist: ['sketchTool', 'modellingTool'],
};

const rootReducer = combineReducers({
  sketchs: sketchReducer,
  sketchTool: sketchToolReducer,
  modellingTool: modellingReducer,
  geom3d: geom3dReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
