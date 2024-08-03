/** This library contains helper functionality for @bitbybit-dev/occt. */
import { SketchType } from '@/app/slices/Sketch';
import { Inputs } from '@bitbybit-dev/occt';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import * as THREE from 'three';
import { getDirectionVectorForPlane } from './threejs_planes';
import { SketchTypeMap } from '@/app/slices/sketchSlice';
import { findCyclesInSketchAndConvertToOcct, SketchCyclesOcctContainer, SketchCycleTypeOcct } from './algo3d-occ';
import { SaveGraphToReduxFunction } from './algo3d';
import { GraphGeom2dMap } from '@/app/slices/graphGeom2dSlice';
import { Geometry3DType } from '@/app/types/Geometry3DType';
import { Geom3dTypeMap, ModellingOperation, ModellingOperationType } from '@/app/slices/geom3d';
import { removeGeometries } from '@/app/slices/geom3dSlice';

/** Initializes the bitbybit occt. */
export const occ_init = (onInitialized: (bitbybit: BitByBitOCCT) => Promise<void>): [Worker, BitByBitOCCT] => {
  //console.log('Started init()');
  let bitbybit = new BitByBitOCCT();
  const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
  bitbybit.init(occt);
  //console.log('bitbybit.init(occt) finished');

  bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
    if (s.state === OccStateEnum.initialised) {
      await onInitialized(bitbybit);
    } else if (s.state === OccStateEnum.computing) {
    } else if (s.state === OccStateEnum.loaded) {
    }
  });

  return [occt, bitbybit];
};

/** Converts the sketchs from redux store to objects that can be displayed in 3D space.
 *  Output type is list of SketchCyclesOcctContainer.
 */
export const createSketchCycleContainers = async (
  bitbybit: BitByBitOCCT,
  sketchs: SketchTypeMap,
  saveGraphGeom2d: SaveGraphToReduxFunction,
  graphGeom2dStateGraphs: GraphGeom2dMap
): Promise<SketchCyclesOcctContainer[]> => {
  const resultSketchCycleContainers: SketchCyclesOcctContainer[] = [];
  const allSketchs = Object.entries(sketchs).map(([key, value]) => value);
  for (const sketch of allSketchs) {
    const sketchCycleContainer = await findCyclesInSketchAndConvertToOcct(
      sketch,
      bitbybit,
      saveGraphGeom2d,
      graphGeom2dStateGraphs[sketch.id]
    );
    //console.log('---sketchCycleContainer', sketch.id, sketchCycleContainer);
    //console.log('faces', faces, faces.length);
    resultSketchCycleContainers.push(sketchCycleContainer);
  }

  //console.log('newGroups', newGroups);
  //console.log('shapes', shapes);

  return resultSketchCycleContainers;
};

/** Converts 3D geometry from redux store (resulting from modelling operations) to objects
 *  that can be displayed in 3D space.
 *  Output type is list of Inputs.OCCT.TopoDSShapePointer.
 */
export const createGeom3dShapes = async (
  bitbybit: BitByBitOCCT,
  dispatch: any,
  sketchShapes: SketchCycleTypeOcct[],
  geometries3d: Geom3dTypeMap
) => {
  // TODO here we need to collect shapes built on the way which need to be deleted
  //   e.g. do two extrudes and one union --> only keep the union

  const finalShapes: Geometry3DType[] = [];
  const geomIdsToRemove: number[] = [];
  const shapesToDelete: Inputs.OCCT.TopoDSShapePointer[] = [];
  const allGeometries = Object.entries(geometries3d).map(([key, value]) => value);
  //console.log('allGeometries', allGeometries);
  for (const geom of allGeometries) {
    let prevShape: Inputs.OCCT.TopoDSShapePointer | null = null;
    for (let i = 0; i < geom.modellingOperations.length; i++) {
      const modellingOp = geom.modellingOperations[i];
      switch (modellingOp.type) {
        case ModellingOperationType.ADDITIVE_EXTRUDE:
          const extrudedShape = await findAndExtrudeSketch(bitbybit, sketchShapes, modellingOp);
          if (extrudedShape) {
            // TODO when assigning a new prevShape we have to collect the old shape
            //      to delete it later
            if (prevShape !== null) {
              shapesToDelete.push(prevShape);
            }
            prevShape = extrudedShape;
          }
          break;
        case ModellingOperationType.UNION:
          const unionShapes: Inputs.OCCT.TopoDSShapePointer[] = [];
          for (let j = 0; j < modellingOp.geometries.length; j++) {
            const subGeom = modellingOp.geometries[j];
            if (prevShape) {
              unionShapes.push(prevShape);
            }
            // apply operations to subgeom - for now we assume there is only one which was an extrude
            const extrudedShape = await findAndExtrudeSketch(bitbybit, sketchShapes, subGeom.modellingOperations[0]);
            if (extrudedShape) {
              unionShapes.push(extrudedShape);
            }
          }
          const unionShape = await bitbybit.occt.booleans.union({ shapes: unionShapes, keepEdges: false });
          // TODO when assigning a new prevShape we have to collect the old shape
          //      to delete it later
          if (prevShape !== null) {
            shapesToDelete.push(prevShape);
          }
          prevShape = unionShape;
          break;
        default:
          console.error('Not implemented for ModellingOperationType ', modellingOp.type);
      }
    }
    if (prevShape) {
      finalShapes.push({ geom3d: geom, occtShape: prevShape });
    } else {
      geomIdsToRemove.push(geom.id);
    }
  }

  //console.log('finalShapes', finalShapes);

  if (geomIdsToRemove.length > 0) {
    // clean up all "orphaned geometries" where the sketch was removed
    console.info('clean up orphaned shapes', geomIdsToRemove);
    dispatch(removeGeometries({ ids: geomIdsToRemove }));
  }

  if (shapesToDelete.length > 0) {
    //console.log('Deleting the following shapes', shapesToDelete);
    //await bitbybit.occt.deleteShapes({ shapes: shapesToDelete });
    // TODO track the shapes to delete and print them out first
    // With these deletes we could errors in unrelated parts,
    //   e.g. in useEffect of Occt3dGeometryVisualizer calling
    //   occtGetFacesWiresEdgesPoints4Shape()
    // Need to somehow track all the occt objects in the app
  }

  return finalShapes;
};

/** Finds a sketch in sketchShapes and extrudes it using the information given
 *  by the (ADDITIVE_EXTRUDE) ModellingOperation.
 *  If the sketch could not be found, null is returned.
 */
const findAndExtrudeSketch = async (
  bitbybit: BitByBitOCCT,
  sketchShapes: SketchCycleTypeOcct[],
  modellingOp: ModellingOperation
): Promise<Inputs.OCCT.TopoDSShapePointer | null> => {
  const sketchShape = sketchShapes.filter(
    // only support one modelling operation
    (shape) => shape.sketch.id === modellingOp.sketchRef[0] && shape.label === modellingOp.sketchRef[1]
  );
  const length = modellingOp.distance;

  //console.log('modellingOp', modellingOp, 'sketchShape', sketchShape);

  if (sketchShape.length > 0) {
    return await extrudeSketch(bitbybit, sketchShape[0].occtFace, sketchShape[0].sketch, length);
  } else {
    console.warn('Sketchshape was undefined for modellingOp ', modellingOp);
    return null;
  }
};

/** Modelling operation that extrudes a sketch given by a 2D face the given length
 *  (may be negative --> 3D shape points into the opposite direction).
 */
const extrudeSketch = async (
  bitbybit: BitByBitOCCT,
  face: Inputs.OCCT.TopoDSFacePointer,
  sketch: SketchType,
  length: number
): Promise<Inputs.OCCT.TopoDSShapePointer> => {
  const directionVectNumbers = getDirectionVectorForPlane(sketch.plane);
  const directionVect = new THREE.Vector3(directionVectNumbers[0], directionVectNumbers[1], directionVectNumbers[2]);
  directionVect.setLength(length);

  //console.log('call extrude with shape', face);

  const extrude = await bitbybit.occt.operations.extrude({
    shape: face,
    direction: [directionVect.x, directionVect.y, directionVect.z],
  });

  /*
  const extrudeFace = await bitbybit.occt.shapes.face.getFace({ shape: extrude, index: 0 });
  const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [extrudeFace, face], tolerance: 1e-7 });
  const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: shell, offset: -0.01 });
  */
  //console.log(extrude);

  //await downloadStep(extrude);
  return extrude;
};

/** Provides functionality to download a given shape as STEP file. */
const downloadStep = async (bitbybit: BitByBitOCCT, shape: Inputs.OCCT.TopoDSShapePointer) => {
  await bitbybit.occt.io.saveShapeSTEP({
    shape: shape,
    fileName: 'shape.stp',
    adjustYtoZ: false,
    tryDownload: true,
  });
};
