import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Geom3dType, ModellingOperation, ModellingOperationType } from './geom3d';

export interface Geom3dState {
  geomIdCount: number;
  geometries: Geom3dType[];
}

const initialState: Geom3dState = {
  geomIdCount: 0,
  geometries: [],
};

export const geom3dSlice = createSlice({
  name: 'geom3dSlice',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    createGeom3d: (state: Geom3dState, { payload }) => {
      const extrudeOp: ModellingOperation = {
        type: ModellingOperationType.EXTRUDE,
        sketchRef: payload.sketchRef,
        distance: payload.distance,
      };
      state.geometries.push({
        id: state.geomIdCount,
        name: `Sketch${state.geomIdCount}`,
        modellingOperations: [extrudeOp],
      });
      state.geomIdCount++;
    },
  },
});

export const { createGeom3d } = geom3dSlice.actions;

export const select3dGeometries = (state: RootState) => state.geom3d.geometries;

export default geom3dSlice.reducer;
