import { describe, expect, it } from 'vitest';
import { populate, step, type LngLat, type Scene } from './livingMap';

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
