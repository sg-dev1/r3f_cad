/** This redux slice holds state information for 3D geometry created by different modelling operations. */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Geom3dTypeMap, ModellingOperation, ModellingOperationType } from './geom3d';

export interface Geom3dState {
  geomIdCount: number;
  geometries: Geom3dTypeMap;
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
        type: ModellingOperationType.ADDITIVE_EXTRUDE,
        sketchRef: payload.sketchRef,
        distance: payload.distance,
        geometries: [],
      };
      state.geometries[state.geomIdCount] = {
        id: state.geomIdCount,
        name: `Geometry${state.geomIdCount}`,
        isVisible: true,
        modellingOperations: [extrudeOp],
      };
      state.geomIdCount++;
    },
    createUnion: (state: Geom3dState, { payload }) => {
      if (!Array.isArray(payload.geometries) || payload.geometries.length < 2) {
        console.error('payload.geometries must have at least 2 elements');
      }

      const sortedGeometries = payload.geometries.toSorted();
      // we must exclude the first geometry (e.g. the geometry the other geometries are added to) else we get a recurse error
      const [_, ...geometries] = sortedGeometries.map((geomId: number) => state.geometries[geomId]);
      const unionOp: ModellingOperation = {
        type: ModellingOperationType.UNION,
        sketchRef: [-1, ''],
        distance: 0,
        geometries: geometries,
      };
      //console.log('unionOp', unionOp);
      for (let i = 1; i < sortedGeometries.length; i++) {
        delete state.geometries[sortedGeometries[i]];
      }
      state.geometries[sortedGeometries[0]].modellingOperations.push(unionOp);
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

export const { createGeom3d, createUnion, removeGeometries, setGeometryVisibility } = geom3dSlice.actions;

export const select3dGeometries = (state: RootState) => state.geom3d.geometries;

export default geom3dSlice.reducer;
