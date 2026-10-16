import { describe, expect, it } from 'vitest';
import { hash01, openings, orientedBox, planBuilding, ringArea, roofTriangles } from './shapes';

const rect = (w: number, d: number, angle = 0) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([x, z]) => ({ x: x * c - z * s + 10, z: x * s + z * c - 5 }));
};

describe('toy-world shapes', () => {
  it('measures footprints', () => {
    expect(ringArea(rect(10, 6))).toBeCloseTo(60);
  });

  it('finds the long side of a turned building', () => {
    const b = orientedBox(rect(20, 8, 0.6));
    expect(b.halfLong).toBeCloseTo(10, 4);
    expect(b.halfShort).toBeCloseTo(4, 4);
    expect(b.cx).toBeCloseTo(10, 4);
    expect(b.cz).toBeCloseTo(-5, 4);
    // Long side direction matches 0.6 rad (or the opposite way).
    expect(Math.abs(Math.sin(b.angle - 0.6))).toBeLessThan(1e-6);
  });

  it('picks building kinds by size, or the real height when OSM has it', () => {
    expect(planBuilding(1, 20, null, 1).kind).toBe('kiosk');
    expect(planBuilding(2, 100, null, 1).kind).toBe('bungalow');
    expect(['house']).toContain(planBuilding(3, 300, null, 1).kind);
    expect(['storey', 'plaza']).toContain(planBuilding(4, 800, null, 1).kind);
    expect(planBuilding(5, 3000, null, 1)).toMatchObject({ kind: 'warehouse', roof: 'sawtooth' });
    expect(planBuilding(6, 300, 30, 1)).toMatchObject({ kind: 'tall', height: 30 });
  });

  it('always draws the same building the same way', () => {
    expect(hash01('abc')).toBe(hash01('abc'));
    expect(planBuilding('w1', 120, null, 0.9)).toEqual(planBuilding('w1', 120, null, 0.9));
  });

  it('builds closed roofs (whole triangles) sitting on the walls', () => {
    const box = orientedBox(rect(12, 8));
    for (const roof of ['hip', 'gable', 'flat', 'sawtooth'] as const) {
      const tris = roofTriangles(box, { kind: 'house', height: 4, roof, wall: '#fff', roofColour: '#000', floors: 1 });
      expect(tris.length % 9).toBe(0);
      expect(tris.length).toBeGreaterThan(0);
      const ys = tris.filter((_, i) => i % 3 === 1);
      expect(Math.min(...ys)).toBeCloseTo(4);
    }
  });

  it('puts one door on the ground floor and windows on each floor', () => {
    const box = orientedBox(rect(12, 8));
    const o = openings(box, { kind: 'house', height: 6.6, roof: 'hip', wall: '#fff', roofColour: '#000', floors: 2 }, 'h1');
    expect(o.filter((x) => x.door)).toHaveLength(1);
    expect(o.some((x) => x.y > 3.3)).toBe(true);
  });
});
