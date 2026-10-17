import { describe, expect, it } from 'vitest';
import { jamFactor, jamStrength, populate, step, type Jam, type LngLat, type Scene } from './livingMap';

// About 1 km of straight road in Lagos.
const road: LngLat[] = [[3.37, 6.556], [3.38, 6.556]];
const base: Scene = { roads: [road], walkways: [], pitches: [], markets: [] };
const rush = { hour: 8, weather: 'clear' };

describe('BRT buses', () => {
  it('run only where OpenStreetMap has a real BRT lane', () => {
    expect(populate(base, rush).some((a) => a.kind === 'brt')).toBe(false);
    const withLane = populate({ ...base, busways: [road] }, rush);
    const buses = withLane.filter((a) => a.kind === 'brt');
    expect(buses.length).toBeGreaterThan(0);
    // Every bus is on the lane itself.
    for (const b of buses) expect(b.path).toBe(road);
  });

  it('move along the lane', () => {
    const agents = populate({ ...base, busways: [road] }, rush).filter((a) => a.kind === 'brt');
    const before = agents.map((a) => a.s);
    step(agents, 1);
    agents.forEach((a, i) => expect(a.s).not.toBe(before[i]));
  });
});

describe('go-slows (M-10)', () => {
  const now = Date.parse('2026-10-17T08:00:00Z');
  const ago = (h: number) => new Date(now - h * 3_600_000).toISOString();

  it('a report slows traffic fully for an hour, then fades out by 3 hours', () => {
    expect(jamStrength(ago(0.5), 'high', now)).toBe(1);
    expect(jamStrength(ago(2), 'high', now)).toBeCloseTo(0.5);
    expect(jamStrength(ago(3), 'high', now)).toBe(0);
    expect(jamStrength(ago(0.5), 'low', now)).toBe(0.6);
  });

  it('vehicles crawl at the jam and drive normally away from it', () => {
    const jam: Jam = { centre: [3.375, 6.556], radiusM: 220, strength: 1 };
    expect(jamFactor([3.375, 6.556], [jam])).toBeCloseTo(0.12);
    expect(jamFactor([3.385, 6.556], [jam])).toBe(1);
    expect(jamFactor([3.375, 6.556], [])).toBe(1);
  });

  it('queues extra vehicles on the road through the jam', () => {
    const jam: Jam = { centre: [3.375, 6.556], radiusM: 220, strength: 1 };
    const clear = populate(base, rush, 3).length;
    expect(populate(base, { ...rush, jams: [jam] }, 3).length).toBeGreaterThan(clear);
  });

  it('a car in the jam moves much less than one on a clear road', () => {
    const jam: Jam = { centre: [3.375, 6.556], radiusM: 220, strength: 1 };
    const mk = () => populate(base, rush, 5).find((a) => a.kind === 'car')!;
    const inJam = { ...mk(), s: 500, pos: [3.375, 6.556] as LngLat, dir: 1 as const };
    const free = { ...mk(), s: 50, pos: [3.3705, 6.556] as LngLat, dir: 1 as const, speed: inJam.speed };
    step([inJam], 1, Math.random, [jam]);
    step([free], 1, Math.random, [jam]);
    expect(inJam.s - 500).toBeLessThan((free.s - 50) * 0.2);
  });
});
