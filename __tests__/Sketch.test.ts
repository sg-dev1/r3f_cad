/** Test cases for Sketch handling functionality. */
import {
  SketchType,
  emptySketch,
  sketchAddConstraint,
  sketchAddEntity,
  sketchDeleteConstraint,
  sketchDeleteLengthConstraintForLine,
  sketchRemoveEntity,
  sketchResetLastPoint,
  sketchUpdateCircleRadius,
  sketchUpdateConstraint,
  sketchUpdateEntities,
  sketchUpdateLinePoints,
  sketchUpdatePoint,
} from '@/app/slices/Sketch';
import { SlvsConstraints } from '@/app/types/Constraints';
import { GeometryType } from '@/app/types/EntityType';
import { SolverEntityType } from '@/app/types/SolverTypes';
import { describe, expect, test } from '@jest/globals';

const createEmptyTemplateSketch = (): SketchType => {
  return {
    id: 1,
    name: `Sketch1`,
    plane: 'xy',
    isVisible: true,

    entityIdCounter: 1,
    points: [],
    pointsMap: {},
    lines: [],
    circles: [],
    lastPoint3D: null,

    constraintIdCounter: 0,
    constraints: [],
  };
};

const createSketchWithSinglePoint = (): SketchType => {
  const sketch = createEmptyTemplateSketch();
  sketchAddEntity(sketch, { id: 0, x: 1, y: 2, z: 0 }, GeometryType.POINT);
  return sketch;
};

const createSketchWithSingleLine = (): SketchType => {
  const sketch = createEmptyTemplateSketch();
  sketchAddEntity(sketch, { id: 0, x: 1, y: 2, z: 0 }, GeometryType.LINE);
  sketchAddEntity(sketch, { id: 0, x: 3, y: 4, z: 0 }, GeometryType.LINE);
  return sketch;
};

const createSketchWithSingleCircle = (): SketchType => {
  const sketch = createEmptyTemplateSketch();
  sketchAddEntity(sketch, { id: 0, x: 4, y: 4, z: 0 }, GeometryType.CIRCLE, 5.5);
  return sketch;
};

describe('Sketch test suite', () => {
  test('add point to sketch', () => {
    const sketch = createEmptyTemplateSketch();
    sketchAddEntity(sketch, { id: 0, x: 1, y: 2, z: 0 }, GeometryType.POINT);
    expect(sketch.points).toContainEqual({ id: 1, x: 1, y: 2, z: 0 });
    expect(sketch.pointsMap).toHaveProperty('1', { id: 1, x: 1, y: 2, z: 0 });
  });

  test('add line to sketch', () => {
    const sketch = createEmptyTemplateSketch();

    sketchAddEntity(sketch, { id: 0, x: 1, y: 2, z: 0 }, GeometryType.LINE);
    sketchAddEntity(sketch, { id: 0, x: 3, y: 4, z: 0 }, GeometryType.LINE);

    expect(sketch.lines).toContainEqual({ p1_id: 1, p2_id: 2, id: 3 });
  });

  test('add circle to sketch', () => {
    const sketch = createEmptyTemplateSketch();

    sketchAddEntity(sketch, { id: 0, x: 4, y: 4, z: 0 }, GeometryType.CIRCLE, 5.5);

    expect(sketch.points).toContainEqual({ id: 1, x: 4, y: 4, z: 0 });
    expect(sketch.circles).toContainEqual({ id: 2, mid_pt_id: 1, radius: 5.5 });
  });

  // TODO add arc test case

  test('remove last point entity in sketch', () => {
    const sketch = createSketchWithSinglePoint();
    sketchRemoveEntity(sketch, 1, GeometryType.POINT);
    expect(sketch.points).toStrictEqual([]);
    expect(sketch.pointsMap).toStrictEqual({});
  });

  test('remove last line entity in sketch', () => {
    const sketch = createSketchWithSingleLine();
    sketchRemoveEntity(sketch, 3, GeometryType.LINE);
    expect(sketch.lines).toStrictEqual([]);
  });

  test('remove last circle entity in sketch', () => {
    const sketch = createSketchWithSingleCircle();
    sketchRemoveEntity(sketch, 2, GeometryType.CIRCLE);
    expect(sketch.circles).toStrictEqual([]);
  });

  test('remove point of last circle entity in sketch - should remove circle', () => {
    const sketch = createSketchWithSingleCircle();
    sketchRemoveEntity(sketch, 1, GeometryType.POINT);
    expect(sketch.circles).toStrictEqual([]);
  });

  // TODO remove arc test case

  test('update point', () => {
    const sketch = createSketchWithSinglePoint();
    sketchUpdatePoint(sketch, 1, [5.4, 6.2, 0.5]);
    expect(sketch.points).toContainEqual({ id: 1, x: 5.4, y: 6.2, z: 0.5 });
    expect(sketch.pointsMap).toHaveProperty('1', { id: 1, x: 5.4, y: 6.2, z: 0.5 });
  });

  test('update line points', () => {
    const sketch = createSketchWithSingleLine();
    sketchUpdateLinePoints(sketch, 3, [5.4, 6.2, 0.5], [6.3, 5.9, 0.3]);
    expect(sketch.points).toContainEqual({ id: 1, x: 5.4, y: 6.2, z: 0.5 });
    expect(sketch.pointsMap).toHaveProperty('1', { id: 1, x: 5.4, y: 6.2, z: 0.5 });
    expect(sketch.points).toContainEqual({ id: 2, x: 6.3, y: 5.9, z: 0.3 });
    expect(sketch.pointsMap).toHaveProperty('2', { id: 2, x: 6.3, y: 5.9, z: 0.3 });
  });

  test('update circle radius', () => {
    const sketch = createSketchWithSingleCircle();
    sketchUpdateCircleRadius(sketch, 2, 15.5);
    expect(sketch.circles).toContainEqual({ id: 2, mid_pt_id: 1, radius: 15.5 });
  });

  test('reset last point', () => {
    const sketch = createEmptyTemplateSketch();
    sketch.lastPoint3D = { id: 0, x: 1, y: 1, z: 1 };
    sketchResetLastPoint(sketch);
    expect(sketch.lastPoint3D).toBeNull();
  });

  test('add constraint', () => {
    const sketch = createSketchWithSingleLine();
    sketchAddConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, 1, 0] });
    expect(sketch.constraints).toContainEqual(
      expect.objectContaining({ t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, 1, 0] })
    );
  });

  test('update constraint', () => {
    const sketch = createSketchWithSingleLine();
    sketchAddConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE, v: [55.5, 1, 2, 0, 0] });

    sketchUpdateConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE, v: [25.5, 1, 2, 0, 0] });
    expect(sketch.constraints).toContainEqual(
      expect.objectContaining({ t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE, v: [25.5, 1, 2, 0, 0] })
    );
  });

  test('delete last constraint', () => {
    const sketch = createSketchWithSingleLine();
    sketchAddConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, 1, 0] });
    sketchDeleteConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, 1, 0] });
    expect(sketch.constraints).toStrictEqual([]);
  });

  test('delete length constraint for line', () => {
    const sketch = createSketchWithSingleLine();
    sketchAddConstraint(sketch, { id: 0, t: SlvsConstraints.SLVS_C_PT_PT_DISTANCE, v: [55.5, 1, 2, 0, 0] });
    sketchDeleteLengthConstraintForLine(sketch, 3);
    expect(sketch.constraints).toStrictEqual([]);
  });

  test('sketch update entities - single circle entity', () => {
    const sketch = createSketchWithSingleCircle();
    const updateEntities: SolverEntityType[] = [
      {
        id: 2,
        t: 'circle',
        v: [1, 27.5],
      },
    ];
    sketchUpdateEntities(sketch, 'xz', updateEntities);
    expect(sketch.circles).toContainEqual({ id: 2, mid_pt_id: 1, radius: 27.5 });
  });

  test('sketch update entities - single point entity on xy plane', () => {
    const sketch = createSketchWithSinglePoint();
    const updateEntities: SolverEntityType[] = [
      {
        id: 1,
        t: 'point',
        v: [22.5, 23.5],
      },
    ];
    sketchUpdateEntities(sketch, 'xy', updateEntities);
    expect(sketch.points).toContainEqual(expect.objectContaining({ x: 22.5, y: 23.5 }));
  });

  test('sketch update entities - single point entity on xz plane', () => {
    const sketch = createSketchWithSinglePoint();
    const updateEntities: SolverEntityType[] = [
      {
        id: 1,
        t: 'point',
        v: [22.5, 23.5],
      },
    ];
    sketchUpdateEntities(sketch, 'xz', updateEntities);
    expect(sketch.points).toContainEqual(expect.objectContaining({ x: 22.5, z: 23.5 }));
  });

  test('sketch update entities - single point entity on yz plane', () => {
    const sketch = createSketchWithSinglePoint();
    const updateEntities: SolverEntityType[] = [
      {
        id: 1,
        t: 'point',
        v: [22.5, 23.5],
      },
    ];
    sketchUpdateEntities(sketch, 'yz', updateEntities);
    expect(sketch.points).toContainEqual(expect.objectContaining({ y: 23.5, z: 22.5 }));
  });
});
