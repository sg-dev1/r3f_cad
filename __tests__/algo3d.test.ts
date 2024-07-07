/** Test cases for the algo3d library. */
import { emptySketch } from '@/app/slices/Sketch';
import { findCyclesInSketchAndConvertToOcct } from '@/utils/algo3d';
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { describe, expect, test, beforeAll, jest } from '@jest/globals';

//jest.mock('@bitbybit-dev/occt-worker');
//const bitbybit = require('@bitbybit-dev/occt-worker');

let bitbybit: BitByBitOCCT | null = null;
const initBitbybit = async () => {
  //console.log('Started init()');
  const code = `import initOpenCascade from '@bitbybit-dev/occt/bitbybit-dev-occt';
  import { OpenCascadeInstance } from '@bitbybit-dev/occt/bitbybit-dev-occt/bitbybit-dev-occt.js';
  import { initializationComplete, onMessageInput } from '@bitbybit-dev/occt-worker';
  
  initOpenCascade().then((occ: OpenCascadeInstance) => {
    initializationComplete(occ, undefined);
  });
  
  addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
  });`;
  bitbybit = new BitByBitOCCT();
  const occt = new Worker(URL.createObjectURL(new Blob([code])));
  bitbybit.init(occt);
  //console.log('bitbybit.init(occt) finished');

  bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
    if (s.state === OccStateEnum.initialised) {
      console.log('Occt init completed');
    } else if (s.state === OccStateEnum.computing) {
    } else if (s.state === OccStateEnum.loaded) {
    }
  });

  return occt;
};

beforeAll(() => {
  return expect(initBitbybit()).resolves.toBeDefined();
});

describe('bitbybit dummy test suite', () => {
  test('empty sketch', () => {
    if (!bitbybit) {
      console.error('Bitbybit was null');
      return;
    }

    const sketch = { ...emptySketch };
    return expect(findCyclesInSketchAndConvertToOcct(sketch, bitbybit)).resolves.toStrictEqual([]);
  });

  test('simple sketch', () => {
    if (!bitbybit) {
      console.error('Bitbybit was null');
      return;
    }

    const sketch = {
      id: 0,
      name: 'Sketch0',
      plane: 'xy',
      isVisible: true,
      entityIdCounter: 7,
      points: [
        {
          x: -180.50000000000003,
          y: 78.51250457763675,
          z: 0,
          id: 1,
        },
        {
          x: 101,
          y: 54.51250457763673,
          z: 0,
          id: 3,
        },
        {
          x: -157.00000000000003,
          y: -90.4874954223633,
          z: 0,
          id: 5,
        },
      ],
      pointsMap: {
        '1': {
          x: -180.50000000000003,
          y: 78.51250457763675,
          z: 0,
          id: 1,
        },
        '3': {
          x: 101,
          y: 54.51250457763673,
          z: 0,
          id: 3,
        },
        '5': {
          x: -157.00000000000003,
          y: -90.4874954223633,
          z: 0,
          id: 5,
        },
      },
      lines: [],
      circles: [
        {
          id: 2,
          mid_pt_id: 1,
          radius: 78.10249675906657,
        },
        {
          id: 4,
          mid_pt_id: 3,
          radius: 233.06490512301508,
        },
        {
          id: 6,
          mid_pt_id: 5,
          radius: 134.85733202165912,
        },
      ],
      lastPoint3D: null,
      constraintIdCounter: 0,
      constraints: [],
    };
    const expectedResult = [
      {
        cycle: [
          {
            t: 3,
            start: [-120.14735239864254, 128.08626706855893, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-233.14284094076217, 20.817346221968613, 0],
            radius: 78.10249675906657,
            start_angle: 0.6876551627708551,
            end_angle: 3.972748315406124,
            clockwise: false,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
          {
            t: 3,
            start: [-233.14284094076214, 20.81734622196862, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-131.72774427566776, 41.98066335779022, 0],
            radius: 134.85733202165912,
            start_angle: 2.1707663496477547,
            end_angle: 1.3822818078229064,
            clockwise: true,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-131.7277442756677, 41.980663357790306, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-120.14735239864262, 128.08626706855884, 0],
            radius: 233.06490512301508,
            start_angle: 3.1953883450953815,
            end_angle: 2.8204201938107056,
            clockwise: true,
            midPt2d: [101, 54.51250457763673],
          },
        ],
        innerCycles: [],
        face: {
          hash: -1939326396,
          type: 'occ-shape',
        },
        faceArea: 13742.225749115032,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 0,
        flattenShapes: [
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 0.6876551627708551,
            endAngle: 3.972748315406124,
            counterClockwise: true,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 2.1707663496477547,
            endAngle: 1.3822818078229064,
            counterClockwise: false,
          },
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 3.1953883450953815,
            endAngle: 2.8204201938107056,
            counterClockwise: false,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-120.14735239864254, 128.08626706855893, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-114.11329243493452, 37.36879231597422, 0],
            radius: 78.10249675906657,
            start_angle: 0.6876551627708551,
            end_angle: 5.728364195295833,
            clockwise: true,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
          {
            t: 3,
            start: [-114.11329243493454, 37.36879231597425, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-30.703993727962967, -137.7719410650224, 0],
            radius: 134.85733202165912,
            start_angle: 1.247160853874616,
            end_angle: 5.924946178524205,
            clockwise: true,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-30.703993727962995, -137.77194106502233, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-120.14735239864262, 128.08626706855884, 0],
            radius: 233.06490512301508,
            start_angle: 4.111839641251729,
            end_angle: 2.8204201938107056,
            clockwise: false,
            midPt2d: [101, 54.51250457763673],
          },
        ],
        innerCycles: [],
        face: {
          hash: -1399426927,
          type: 'occ-shape',
        },
        faceArea: 158523.03742373045,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 1,
        flattenShapes: [
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 0.6876551627708551,
            endAngle: 5.728364195295833,
            counterClockwise: false,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 1.247160853874616,
            endAngle: 5.924946178524205,
            counterClockwise: false,
          },
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 4.111839641251729,
            endAngle: 2.8204201938107056,
            counterClockwise: true,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-120.14735239864262, 128.08626706855884, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-131.7277442756677, 41.980663357790306, 0],
            radius: 233.06490512301508,
            start_angle: 2.8204201938107056,
            end_angle: 3.1953883450953815,
            clockwise: false,
            midPt2d: [101, 54.51250457763673],
          },
          {
            t: 3,
            start: [-131.72774427566776, 41.98066335779022, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-114.11329243493454, 37.36879231597425, 0],
            radius: 134.85733202165912,
            start_angle: 1.3822818078229064,
            end_angle: 1.247160853874616,
            clockwise: true,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-114.11329243493452, 37.36879231597422, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-120.14735239864254, 128.08626706855893, 0],
            radius: 78.10249675906657,
            start_angle: 5.728364195295833,
            end_angle: 0.6876551627708551,
            clockwise: false,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
        ],
        innerCycles: [],
        face: {
          hash: -1185569873,
          type: 'occ-shape',
        },
        faceArea: 1920.7616700269791,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 2,
        flattenShapes: [
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 2.8204201938107056,
            endAngle: 3.1953883450953815,
            counterClockwise: true,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 1.3822818078229064,
            endAngle: 1.247160853874616,
            counterClockwise: false,
          },
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 5.728364195295833,
            endAngle: 0.6876551627708551,
            counterClockwise: true,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-233.14284094076217, 20.817346221968613, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-129.41048368521052, 19.437456353188708, 0],
            radius: 78.10249675906657,
            start_angle: 3.972748315406124,
            end_angle: 5.425426403682703,
            clockwise: false,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
          {
            t: 3,
            start: [-129.41048368521052, 19.437456353188736, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-131.7277442756677, 41.980663357790306, 0],
            radius: 233.06490512301508,
            start_angle: 3.2926613726428533,
            end_angle: 3.1953883450953815,
            clockwise: true,
            midPt2d: [101, 54.51250457763673],
          },
          {
            t: 3,
            start: [-131.72774427566776, 41.98066335779022, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-233.14284094076214, 20.81734622196862, 0],
            radius: 134.85733202165912,
            start_angle: 1.3822818078229064,
            end_angle: 2.1707663496477547,
            clockwise: false,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
        ],
        innerCycles: [],
        face: {
          hash: -2139257133,
          type: 'occ-shape',
        },
        faceArea: 3285.560892654176,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 4,
        flattenShapes: [
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 3.972748315406124,
            endAngle: 5.425426403682703,
            counterClockwise: true,
          },
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 3.2926613726428533,
            endAngle: 3.1953883450953815,
            counterClockwise: false,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 1.3822818078229064,
            endAngle: 2.1707663496477547,
            counterClockwise: true,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-233.14284094076214, 20.81734622196862, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-30.703993727962967, -137.7719410650224, 0],
            radius: 134.85733202165912,
            start_angle: 2.1707663496477547,
            end_angle: 5.924946178524205,
            clockwise: false,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-30.703993727962995, -137.77194106502233, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-129.41048368521052, 19.437456353188736, 0],
            radius: 233.06490512301508,
            start_angle: 4.111839641251729,
            end_angle: 3.2926613726428533,
            clockwise: true,
            midPt2d: [101, 54.51250457763673],
          },
          {
            t: 3,
            start: [-129.41048368521052, 19.437456353188708, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-233.14284094076217, 20.817346221968613, 0],
            radius: 78.10249675906657,
            start_angle: 5.425426403682703,
            end_angle: 3.972748315406124,
            clockwise: true,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
        ],
        innerCycles: [],
        face: {
          hash: 1713766378,
          type: 'occ-shape',
        },
        faceArea: 43643.85624710649,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 5,
        flattenShapes: [
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 2.1707663496477547,
            endAngle: 5.924946178524205,
            counterClockwise: true,
          },
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 4.111839641251729,
            endAngle: 3.2926613726428533,
            counterClockwise: false,
          },
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 5.425426403682703,
            endAngle: 3.972748315406124,
            counterClockwise: false,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-129.41048368521052, 19.437456353188708, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-114.11329243493452, 37.36879231597422, 0],
            radius: 78.10249675906657,
            start_angle: 5.425426403682703,
            end_angle: 5.728364195295833,
            clockwise: false,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
          {
            t: 3,
            start: [-114.11329243493454, 37.36879231597425, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-131.72774427566776, 41.98066335779022, 0],
            radius: 134.85733202165912,
            start_angle: 1.247160853874616,
            end_angle: 1.3822818078229064,
            clockwise: false,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-131.7277442756677, 41.980663357790306, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-129.41048368521052, 19.437456353188736, 0],
            radius: 233.06490512301508,
            start_angle: 3.1953883450953815,
            end_angle: 3.2926613726428533,
            clockwise: false,
            midPt2d: [101, 54.51250457763673],
          },
        ],
        innerCycles: [],
        face: {
          hash: -169106387,
          type: 'occ-shape',
        },
        faceArea: 215.16687510154168,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 6,
        flattenShapes: [
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 5.425426403682703,
            endAngle: 5.728364195295833,
            counterClockwise: true,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 1.247160853874616,
            endAngle: 1.3822818078229064,
            counterClockwise: true,
          },
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 3.1953883450953815,
            endAngle: 3.2926613726428533,
            counterClockwise: true,
          },
        ],
      },
      {
        cycle: [
          {
            t: 3,
            start: [-129.41048368521052, 19.437456353188736, 0],
            mid_pt: [101, 54.51250457763673, 0],
            end: [-30.703993727962995, -137.77194106502233, 0],
            radius: 233.06490512301508,
            start_angle: 3.2926613726428533,
            end_angle: 4.111839641251729,
            clockwise: false,
            midPt2d: [101, 54.51250457763673],
          },
          {
            t: 3,
            start: [-30.703993727962967, -137.7719410650224, 0],
            mid_pt: [-157.00000000000003, -90.4874954223633, 0],
            end: [-114.11329243493454, 37.36879231597425, 0],
            radius: 134.85733202165912,
            start_angle: 5.924946178524205,
            end_angle: 1.247160853874616,
            clockwise: false,
            midPt2d: [-157.00000000000003, -90.4874954223633],
          },
          {
            t: 3,
            start: [-114.11329243493452, 37.36879231597422, 0],
            mid_pt: [-180.50000000000003, 78.51250457763675, 0],
            end: [-129.41048368521052, 19.437456353188708, 0],
            radius: 78.10249675906657,
            start_angle: 5.728364195295833,
            end_angle: 5.425426403682703,
            clockwise: true,
            midPt2d: [-180.50000000000003, 78.51250457763675],
          },
        ],
        innerCycles: [],
        face: {
          hash: -1703279296,
          type: 'occ-shape',
        },
        faceArea: 9989.990779648568,
        sketch: {
          id: 0,
          name: 'Sketch0',
          plane: 'xy',
          isVisible: true,
          entityIdCounter: 7,
          points: [
            {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          ],
          pointsMap: {
            '1': {
              x: -180.50000000000003,
              y: 78.51250457763675,
              z: 0,
              id: 1,
            },
            '3': {
              x: 101,
              y: 54.51250457763673,
              z: 0,
              id: 3,
            },
            '5': {
              x: -157.00000000000003,
              y: -90.4874954223633,
              z: 0,
              id: 5,
            },
          },
          lines: [],
          circles: [
            {
              id: 2,
              mid_pt_id: 1,
              radius: 78.10249675906657,
            },
            {
              id: 4,
              mid_pt_id: 3,
              radius: 233.06490512301508,
            },
            {
              id: 6,
              mid_pt_id: 5,
              radius: 134.85733202165912,
            },
          ],
          lastPoint3D: null,
          constraintIdCounter: 0,
          constraints: [],
        },
        index: 7,
        flattenShapes: [
          {
            pc: {
              x: 101,
              y: 54.51250457763673,
            },
            r: 233.06490512301508,
            startAngle: 3.2926613726428533,
            endAngle: 4.111839641251729,
            counterClockwise: true,
          },
          {
            pc: {
              x: -157.00000000000003,
              y: -90.4874954223633,
            },
            r: 134.85733202165912,
            startAngle: 5.924946178524205,
            endAngle: 1.247160853874616,
            counterClockwise: true,
          },
          {
            pc: {
              x: -180.50000000000003,
              y: 78.51250457763675,
            },
            r: 78.10249675906657,
            startAngle: 5.728364195295833,
            endAngle: 5.425426403682703,
            counterClockwise: false,
          },
        ],
      },
    ];
    return expect(findCyclesInSketchAndConvertToOcct(sketch, bitbybit)).resolves.toStrictEqual(expectedResult);
  });
});
