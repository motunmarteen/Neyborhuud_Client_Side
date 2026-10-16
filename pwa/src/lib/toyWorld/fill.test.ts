import { describe, expect, it } from 'vitest';
import { fillAlongRoads, pointInRing, roadHalfWidth, type Road } from './fill';
import type { Pt } from './shapes';

const street: Road = { cls: 'residential', pts: [{ x: -150, z: 0 }, { x: 150, z: 0 }] };
const square = (cx: number, cz: number, h: number): Pt[] => [
  { x: cx - h, z: cz - h },
  { x: cx + h, z: cz - h },
  { x: cx + h, z: cz + h },
  { x: cx - h, z: cz + h },
];

const overlaps = (a: Pt[], b: Pt[]) => a.some((p) => pointInRing(p, b)) || b.some((p) => pointInRing(p, a));

describe('filler buildings along roads', () => {
  it('lines both sides of a street, facing it, never on the road', () => {
    const f = fillAlongRoads([street], [], [], 400, 500);
    expect(f.length).toBeGreaterThan(20);
    expect(f.some((b) => b.ring[0].z < 0)).toBe(true);
    expect(f.some((b) => b.ring[0].z > 0)).toBe(true);
    const half = roadHalfWidth('residential')!;
    for (const b of f) for (const p of b.ring) expect(Math.abs(p.z)).toBeGreaterThanOrEqual(half);
  });

  it('never covers a real building, water or a park', () => {
    const real = square(0, 14, 6);
    const pond = square(60, -18, 12);
    const f = fillAlongRoads([street], [real], [pond], 400, 500);
    for (const b of f) {
      expect(overlaps(b.ring, real)).toBe(false);
      expect(overlaps(b.ring, pond)).toBe(false);
    }
  });

  it('fillers do not overlap each other', () => {
    const cross: Road = { cls: 'tertiary', pts: [{ x: 0, z: -150 }, { x: 0, z: 150 }] };
    const f = fillAlongRoads([street, cross], [], [], 400, 500);
    for (let i = 0; i < f.length; i++) {
      for (let j = i + 1; j < f.length; j++) expect(overlaps(f[i].ring, f[j].ring)).toBe(false);
    }
  });

  it('is the same every time, and respects the radius and the cap', () => {
    const a = fillAlongRoads([street], [], [], 400, 500);
    const b = fillAlongRoads([street], [], [], 400, 500);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(fillAlongRoads([street], [], [], 400, 5)).toHaveLength(5);
    for (const x of fillAlongRoads([street], [], [], 40, 500)) {
      const cx = (x.ring[0].x + x.ring[2].x) / 2;
      expect(Math.abs(cx)).toBeLessThanOrEqual(40);
    }
  });

  it('ignores paths and tracks', () => {
    expect(fillAlongRoads([{ cls: 'path', pts: street.pts }], [], [], 400, 500)).toHaveLength(0);
  });

  it('plants palms on empty lots, never on the road or a building', () => {
    const trees: Pt[] = [];
    const f = fillAlongRoads([street], [], [], 400, 500, trees);
    expect(trees.length).toBeGreaterThan(0);
    const half = roadHalfWidth('residential')!;
    for (const t of trees) {
      expect(Math.abs(t.z)).toBeGreaterThanOrEqual(half);
      for (const b of f) expect(pointInRing(t, b.ring)).toBe(false);
    }
  });
});
