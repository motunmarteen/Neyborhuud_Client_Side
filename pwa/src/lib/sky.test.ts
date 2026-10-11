import { describe, expect, it } from 'vitest';
import { mockupHour, skyAt, skyForHour, sunTimes } from './sky';

const hm = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`;
const OCT_11 = new Date('2026-10-11T12:00:00Z');
const LAGOS = { lat: 6.5244, lng: 3.3792 };
const KANO = { lat: 12.0022, lng: 8.592 };
const MAIDUGURI = { lat: 11.8333, lng: 13.15 };

describe('sunTimes (WAT)', () => {
  it('gives real mid-October sunrise and sunset in Lagos', () => {
    const t = sunTimes(OCT_11, LAGOS.lat, LAGOS.lng);
    // Lagos solar noon is ~12:33 WAT (3.4°E, equation of time +13 min) and the October day is
    // just under 12 h, so sunrise ~6:33 and sunset ~18:32 WAT.
    expect(t.noon).toBeGreaterThan(12 * 60 + 28);
    expect(t.noon).toBeLessThan(12 * 60 + 38);
    expect(t.sunrise).toBeGreaterThan(6 * 60 + 25);
    expect(t.sunrise).toBeLessThan(6 * 60 + 42);
    expect(t.sunset).toBeGreaterThan(18 * 60 + 22);
    expect(t.sunset).toBeLessThan(18 * 60 + 40);
  });

  it('rises earlier further east (Kano, Maiduguri) — the whole country, not one city', () => {
    const lagos = sunTimes(OCT_11, LAGOS.lat, LAGOS.lng);
    const kano = sunTimes(OCT_11, KANO.lat, KANO.lng);
    const maid = sunTimes(OCT_11, MAIDUGURI.lat, MAIDUGURI.lng);
    expect(lagos.sunrise - kano.sunrise).toBeGreaterThan(12);
    expect(kano.sunrise - maid.sunrise).toBeGreaterThan(12);
    expect(maid.sunrise).toBeGreaterThan(5 * 60 + 40); // ~5:55 WAT
    expect(hm(maid.sunrise)).toMatch(/^[56]:/);
  });
});

describe('mockupHour', () => {
  it('pins real sunrise, noon and sunset to the mockup clock', () => {
    const t = sunTimes(OCT_11, KANO.lat, KANO.lng);
    expect(mockupHour(t.sunrise, t)).toBeCloseTo(6, 5);
    expect(mockupHour(t.noon, t)).toBeCloseTo(12.375, 5);
    expect(mockupHour(t.sunset, t)).toBeCloseTo(18.75, 5);
  });
  it('wraps the night through midnight', () => {
    const t = sunTimes(OCT_11, KANO.lat, KANO.lng);
    const h = mockupHour(0, t);
    // Real midnight sits just around midnight on the mockup clock.
    expect(h < 0.5 || h > 23.5).toBe(true);
  });
});

describe('sky', () => {
  it('is dark with stars at night and bright without stars at noon', () => {
    expect(skyForHour(1).starOpacity).toBeGreaterThan(0.9);
    expect(skyForHour(1).sun.up).toBe(false);
    expect(skyForHour(1).moon.up).toBe(true);
    expect(skyForHour(12.375).starOpacity).toBe(0);
    expect(skyForHour(12.375).sun.arc).toBeGreaterThan(0.99);
  });
  it('moves the sun east to west', () => {
    expect(skyForHour(8).sun.x).toBeLessThan(skyForHour(16).sun.x);
  });
  it('works without a known place (central Nigeria)', () => {
    expect(skyAt(OCT_11).phase).toBeTruthy();
  });
});
