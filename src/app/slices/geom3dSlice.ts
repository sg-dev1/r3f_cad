/** This redux slice holds state information for 3D geometry created by different modelling operations. */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Geom3dType, ModellingOperation, ModellingOperationType } from './geom3d';

export interface Geom3dState {
  geomIdCount: number;
  geometries: { [key: number]: Geom3dType };
}

const initialState: Geom3dState = {
  geomIdCount: 0,
  geometries: {},
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
      state.geometries[state.geomIdCount] = {
        id: state.geomIdCount,
        name: `Geometry${state.geomIdCount}`,
        isVisible: true,
        modellingOperations: [extrudeOp],
      };
      state.geomIdCount++;
    },
    removeGeometries: (state: Geom3dState, action: PayloadAction<{ ids: number[] }, string>) => {
      const anyIdNotFound = action.payload.ids.reduce(
        (aggregate, currId, elem, arr) => aggregate || !(currId in state.geometries),
        false
      );
      if (anyIdNotFound) {
        console.error('There is at least one non existing id in ids', action.payload.ids);
        return;
      }
      action.payload.ids.forEach((id) => delete state.geometries[id]);
    },
    setGeometryVisibility: (state: Geom3dState, { payload: { id, visible } }) => {
      if (!(id in state.geometries)) {
        console.error('There is no geometry with id ' + id + '.');
        return;
      }
      state.geometries[id].isVisible = visible;
    },
  },
});

export const { createGeom3d, removeGeometries, setGeometryVisibility } = geom3dSlice.actions;

export const select3dGeometries = (state: RootState) => state.geom3d.geometries;

export default geom3dSlice.reducer;
