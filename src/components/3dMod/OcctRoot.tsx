import { useAppSelector } from '@/app/hooks';
import { selectSketchToExtrude } from '@/app/slices/modellingToolStateSlice';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/Addons.js';
import { Inputs } from '@bitbybit-dev/occt';
import { addShapeToScene } from './occt_visualize';
import { selectSketchs } from '@/app/slices/sketchSlice';

const OcctRoot = () => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

  const { scene, gl, camera } = useThree();

  const sketchs = useAppSelector(selectSketchs);
  const sketchToExtrude = useAppSelector(selectSketchToExtrude);

  const [groups, setGroups] = useState<THREE.Group[]>([]);
  const [sketchShapes, setSketchShapes] = useState<Inputs.OCCT.TopoDSShapePointer[]>([]);

  // Note: Currently the init() needs to be re called when coming back from Sketcher
  // Most likely this is because this component needs to be mounted again
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    createSketchShapes(bitbybit);
  }, [sketchs]);

  const createSketchShapes = async (bitbybit?: BitByBitOCCT) => {
    if (!bitbybit) {
      return;
    }

    if (sketchShapes.length > 0) {
      console.log('Deleting previous sketchShapes');
      await bitbybit.occt.deleteShapes({
        shapes: sketchShapes,
      });
    }

    if (groups.length > 0) {
      console.log('Deleting previous groups');
      groups.forEach((group) =>
        group.traverse((obj) => {
          scene.remove(obj);
        })
      );
    }

    const shapes: Inputs.OCCT.TopoDSShapePointer[] = [];
    const newGroups: THREE.Group[] = [];
    const allSketchs = Object.entries(sketchs).map(([key, value]) => value);
    allSketchs.forEach(async (sketch) => {
      // 1) Convert all lines to Wires
      const linesDto: Inputs.OCCT.LineDto[] = sketch.lines.map((line) => {
        const startP = sketch.pointsMap[line.p1_id];
        const endP = sketch.pointsMap[line.p2_id];
        return { start: [startP.x, startP.y, startP.z], end: [endP.x, endP.y, endP.z] };
      });
      const lineWires = (await bitbybit.occt.shapes.wire.createLines({
        lines: linesDto,
        returnCompound: false,
      })) as Inputs.OCCT.TopoDSWirePointer[];
      //console.log('lineWires', lineWires);

      // 2) Combine all Wires to a single Wire
      const wire1 = await bitbybit.occt.shapes.wire.combineEdgesAndWiresIntoAWire({ shapes: lineWires });
      console.log('wire1', wire1);

      // 3) Create a Face from the Wire - Fails if Wire is not closed
      const baseFace = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire1, planar: true });
      console.log('baseFace', baseFace);

      // 4) Create THREE.Group for visualization
      const group = await addShapeToScene(bitbybit, baseFace, scene, 0.05);
      newGroups.push(group);
      // result should be a Inputs.OCCT.TopoDSShapePointer, note:
      // type TopoDSShapePointer = TopoDSVertexPointer | TopoDSEdgePointer | TopoDSWirePointer | TopoDSFacePointer | TopoDSShellPointer | TopoDSSolidPointer | TopoDSCompoundPointer;
      shapes.push(baseFace);

      // TODO add improvements from B007-A

      // 5) Delete all helper faces (except the final one)
      await bitbybit.occt.deleteShapes({ shapes: [...lineWires, wire1] });
    });

    setGroups(newGroups);
    setSketchShapes(shapes);
  };

  const init = async () => {
    //console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
    await bitbybit.init(occt);
    //console.log('bitbybit.init(occt) finished');

    const animation = (time: number) => {
      gl.render(scene, camera);
      //controls.update();
    };

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        // Launch the function converting Sketches to be visualized in 3D
        await createSketchShapes(bitbybit);
        gl.setAnimationLoop(animation);
        console.log('Occt init completed');

        // TODO here some static things to display may be created
        //    e.g. small rotation gizmo cube at top right, e.g.
        //         to display camera orientation and change it to look at plane
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  return <></>;
};

export default OcctRoot;
