/** Test cases for ArcType functionality. */
import { SketchPlaneType } from '@/app/slices/Sketch';
import { createArc } from '@/app/types/ArcType';
import { toDegree, toRadiant } from '@/utils/utils';
import { describe, expect, test } from '@jest/globals';

const xyPlane: SketchPlaneType = { plane: 'xy', normalVector: [0, 0, 0], offset: 0 };

describe('create arc tests', () => {
  test('create 90 degree arc in Q1', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [1, 0, 0], [0, 1, 0], { radiusDivisor: 1, angleHint: Math.PI / 2 });
    //console.log('arc', arc);

    expect(arc.start[0]).toBeCloseTo(1);
    expect(arc.start[1]).toBeCloseTo(0);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(0);
    expect(arc.end[1]).toBeCloseTo(1);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(false);

    expect(arc.start_angle).toBeCloseTo(0);
    expect(arc.end_angle).toBeCloseTo(Math.PI / 2);

    expect(arc.middle[0]).toBeCloseTo(0.707);
    expect(arc.middle[1]).toBeCloseTo(0.707);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create 90 degree reverse arc in Q1', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [0, 1, 0], [1, 0, 0], { radiusDivisor: 1, angleHint: Math.PI / 2 });
    //console.log('arc', arc);

    expect(arc.start[0]).toBeCloseTo(0);
    expect(arc.start[1]).toBeCloseTo(1);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(1);
    expect(arc.end[1]).toBeCloseTo(0);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(true);

    expect(arc.start_angle).toBeCloseTo(Math.PI / 2);
    expect(arc.end_angle).toBeCloseTo(0);

    expect(arc.middle[0]).toBeCloseTo(0.707);
    expect(arc.middle[1]).toBeCloseTo(0.707);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create 90 degree arc in Q1 and Q2', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [0.7, 0.7, 0], [-0.7, 0.7, 0], {
      radiusDivisor: 1,
      angleHint: Math.PI / 2,
    });
    //console.log('arc', arc);

    expect(arc.start[0]).toBeCloseTo(0.7);
    expect(arc.start[1]).toBeCloseTo(0.7);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(-0.7);
    expect(arc.end[1]).toBeCloseTo(0.7);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(0.983);
    expect(arc.clockwise).toBe(false);

    expect(arc.start_angle).toBeCloseTo(Math.PI / 4);
    expect(arc.end_angle).toBeCloseTo((3 * Math.PI) / 4);

    expect(arc.middle[0]).toBeCloseTo(0);
    expect(arc.middle[1]).toBeCloseTo(0.983);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create 90 degree reverse arc in Q1 and Q2', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [-0.7, 0.7, 0], [0.7, 0.7, 0], {
      radiusDivisor: 1,
      angleHint: Math.PI / 2,
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.end[0]).toBeCloseTo(0.7);
    expect(arc.end[1]).toBeCloseTo(0.7);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.start[0]).toBeCloseTo(-0.7);
    expect(arc.start[1]).toBeCloseTo(0.7);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(0.983);
    expect(arc.clockwise).toBe(true);

    expect(arc.end_angle).toBeCloseTo(Math.PI / 4);
    expect(arc.start_angle).toBeCloseTo((3 * Math.PI) / 4);

    expect(arc.middle[0]).toBeCloseTo(0);
    expect(arc.middle[1]).toBeCloseTo(0.983);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create arc from Q1 to Q3', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [1 / 2, Math.sqrt(3) / 2, 0], [-Math.sqrt(3) / 2, -1 / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(210 - 60),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.start[0]).toBeCloseTo(1 / 2);
    expect(arc.start[1]).toBeCloseTo(Math.sqrt(3) / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.end[1]).toBeCloseTo(-1 / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(false);

    expect(arc.start_angle).toBeCloseTo(Math.PI / 3);
    expect(arc.end_angle).toBeCloseTo((7 * Math.PI) / 6);

    expect(arc.middle[0]).toBeCloseTo(-0.707);
    expect(arc.middle[1]).toBeCloseTo(0.707);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create reverse arc from Q1 to Q3', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [-Math.sqrt(3) / 2, -1 / 2, 0], [1 / 2, Math.sqrt(3) / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(210 - 60),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.end[0]).toBeCloseTo(1 / 2);
    expect(arc.end[1]).toBeCloseTo(Math.sqrt(3) / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.start[0]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.start[1]).toBeCloseTo(-1 / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(true);

    expect(arc.end_angle).toBeCloseTo(Math.PI / 3);
    expect(arc.start_angle).toBeCloseTo((7 * Math.PI) / 6);

    expect(arc.middle[0]).toBeCloseTo(-0.707);
    expect(arc.middle[1]).toBeCloseTo(0.707);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create arc from Q1 to Q4', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [1 / 2, Math.sqrt(3) / 2, 0], [1 / 2, -Math.sqrt(3) / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(300 - 60),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.start[0]).toBeCloseTo(1 / 2);
    expect(arc.start[1]).toBeCloseTo(Math.sqrt(3) / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(1 / 2);
    expect(arc.end[1]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(false);

    expect(arc.start_angle).toBeCloseTo(Math.PI / 3);
    expect(arc.end_angle).toBeCloseTo((5 * Math.PI) / 3);

    expect(arc.middle[0]).toBeCloseTo(-1);
    expect(arc.middle[1]).toBeCloseTo(0);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create reverse arc from Q1 to Q4', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [1 / 2, -Math.sqrt(3) / 2, 0], [1 / 2, Math.sqrt(3) / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(300 - 60),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.end[0]).toBeCloseTo(1 / 2);
    expect(arc.end[1]).toBeCloseTo(Math.sqrt(3) / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.start[0]).toBeCloseTo(1 / 2);
    expect(arc.start[1]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(true);

    expect(arc.end_angle).toBeCloseTo(Math.PI / 3);
    expect(arc.start_angle).toBeCloseTo((5 * Math.PI) / 3);

    expect(arc.middle[0]).toBeCloseTo(-1);
    expect(arc.middle[1]).toBeCloseTo(0);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create arc from Q2 to Q4', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [-1 / 2, Math.sqrt(3) / 2, 0], [1 / 2, -Math.sqrt(3) / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(300 - 120),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.start[0]).toBeCloseTo(-1 / 2);
    expect(arc.start[1]).toBeCloseTo(Math.sqrt(3) / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(1 / 2);
    expect(arc.end[1]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(false);

    expect(arc.start_angle).toBeCloseTo((2 * Math.PI) / 3);
    expect(arc.end_angle).toBeCloseTo((5 * Math.PI) / 3);

    expect(arc.middle[0]).toBeCloseTo(-0.866);
    expect(arc.middle[1]).toBeCloseTo(-0.5);
    expect(arc.middle[2]).toBeCloseTo(0);
  });

  test('create reverse arc from Q2 to Q4', () => {
    const arc = createArc(xyPlane, [0, 0, 0], [1 / 2, -Math.sqrt(3) / 2, 0], [-Math.sqrt(2) / 2, Math.sqrt(2) / 2, 0], {
      radiusDivisor: 1,
      angleHint: toRadiant(300 - 135),
    });
    //console.log('arc', arc, toDegree(arc.start_angle), toDegree(arc.end_angle));

    expect(arc.start[0]).toBeCloseTo(1 / 2);
    expect(arc.start[1]).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(arc.start[2]).toBeCloseTo(0);
    expect(arc.end[0]).toBeCloseTo(-Math.sqrt(2) / 2);
    expect(arc.end[1]).toBeCloseTo(Math.sqrt(2) / 2);
    expect(arc.end[2]).toBeCloseTo(0);
    expect(arc.mid_pt[0]).toBeCloseTo(0);
    expect(arc.mid_pt[1]).toBeCloseTo(0);
    expect(arc.mid_pt[2]).toBeCloseTo(0);
    expect(arc.midPt2d[0]).toBeCloseTo(0);
    expect(arc.midPt2d[1]).toBeCloseTo(0);

    expect(arc.radius).toBeCloseTo(1);
    expect(arc.clockwise).toBe(true);

    expect(arc.end_angle).toBeCloseTo((3 * Math.PI) / 4);
    expect(arc.start_angle).toBeCloseTo((5 * Math.PI) / 3);

    expect(arc.middle[0]).toBeCloseTo(-0.793);
    expect(arc.middle[1]).toBeCloseTo(-0.60876);
    expect(arc.middle[2]).toBeCloseTo(0);
  });
});
