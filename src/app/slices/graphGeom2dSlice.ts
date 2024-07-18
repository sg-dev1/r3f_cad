/**
 * This redux slice holds state information of the SketchCycle graph
 * used to label sketch cycles generated in algo3d.
 *  */
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

/** A reduced version of the SketchShapeLabelingGraphNode defined in algo3d.ts */
export interface GraphNodeGeom2d {
  id: number;
  centroid: [number, number];
  topLeftCorner: [number, number];
  label: string;
}

export interface GraphGeom2d {
  nodes: GraphNodeGeom2d[];
  adjacencyList: number[][];
}

export interface GraphGeom2dState {
  stateGraphs: { [sketchIdAsKey: number]: GraphGeom2d };
}

const initialState: GraphGeom2dState = {
  stateGraphs: {},
};

export const graphGeom2dSlice = createSlice({
  name: 'graphGeom2dSlice',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setStateGraph: (state, { payload: { sketchId, graph } }) => {
      state.stateGraphs[sketchId] = graph;
    },
  },
});

export const { setStateGraph } = graphGeom2dSlice.actions;

export const selectStateGraphs = (state: RootState) => state.graphGeom2d.stateGraphs;

export default graphGeom2dSlice.reducer;
