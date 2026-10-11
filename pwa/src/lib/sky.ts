/**
 * The live sky over the map (tracker M-03), from the Home Concept mockup's sky model.
 *
 * The mockup draws the day on a fixed clock (sun up 6:00, down 18:45). Here the sun follows
 * the REAL sunrise, noon and sunset for the person's own place and date (NOAA formula; Nigeria
 * is on WAT, UTC+1, all year). Real time is then mapped onto the mockup clock, so its colour
 * moments (dawn, morning, noon, sunset, dusk, night) land at the right real moments in Kano
 * and in Port Harcourt alike.
 *
 * Pure functions: no DOM, easy to test.
 */

const RAD = Math.PI / 180;
const WAT_OFFSET_MIN = 60; // Nigeria: UTC+1, no daylight saving

export type SunTimes = { sunrise: number; noon: number; sunset: number }; // minutes after local midnight (WAT)

/** Sunrise, solar noon and sunset in WAT minutes for a date and place (NOAA approximation, ±2 min). */
export function sunTimes(date: Date, lat: number, lng: number): SunTimes {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  const ha = Math.acos(Math.min(1, Math.max(-1, cosHa))) / RAD;
  const noonUtc = 720 - 4 * lng - eqTime;
  return {
    sunrise: noonUtc - 4 * ha + WAT_OFFSET_MIN,
    noon: noonUtc + WAT_OFFSET_MIN,
    sunset: noonUtc + 4 * ha + WAT_OFFSET_MIN,
  };
}

/** Minutes after midnight in WAT for a moment. */
export function watMinutes(date: Date): number {
  return (((date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + WAT_OFFSET_MIN) % 1440) + 1440) % 1440;
}

// The mockup's clock: sunrise 6:00, noon 12:22, sunset 18:45 (hours).
const MOCK_SUNRISE = 6;
const MOCK_NOON = 12.375;
const MOCK_SUNSET = 18.75;

/** Real WAT minutes → the mockup's hour, anchored on the real sunrise, noon and sunset. */
export function mockupHour(minutes: number, t: SunTimes): number {
  const m = minutes;
  if (m >= t.sunrise && m < t.noon) return MOCK_SUNRISE + ((m - t.sunrise) / (t.noon - t.sunrise)) * (MOCK_NOON - MOCK_SUNRISE);
  if (m >= t.noon && m < t.sunset) return MOCK_NOON + ((m - t.noon) / (t.sunset - t.noon)) * (MOCK_SUNSET - MOCK_NOON);
  // Night: sunset → next sunrise maps to 18:45 → 30:00 (6:00 next day).
  const nightLen = 1440 - (t.sunset - t.sunrise);
  const since = m >= t.sunset ? m - t.sunset : m + 1440 - t.sunset;
  const h = MOCK_SUNSET + (since / nightLen) * (24 + MOCK_SUNRISE - MOCK_SUNSET);
  return h >= 24 ? h - 24 : h;
}

type Key = { h: number; top: string; bot: string; tint: string; a: number; lights: number };

// Light at each moment of the day (mockup palette); colours blend smoothly between them.
const KEYS: Key[] = [
  { h: 0, top: '#060A1E', bot: '#151F48', tint: '#0A1236', a: 0.62, lights: 1 },
  { h: 4.5, top: '#0A1130', bot: '#1F2A5C', tint: '#0E1640', a: 0.55, lights: 1 },
  { h: 5.6, top: '#2A2E6A', bot: '#E59A7A', tint: '#3A3572', a: 0.34, lights: 0.7 },
  { h: 6.6, top: '#6CA6DC', bot: '#FFD8A6', tint: '#FFA868', a: 0.13, lights: 0.15 },
  { h: 9, top: '#6BBFF1', bot: '#D3EDFB', tint: '#FFFFFF', a: 0, lights: 0 },
  { h: 12, top: '#47A6EC', bot: '#BEE3FA', tint: '#FFFFFF', a: 0, lights: 0 },
  { h: 15.5, top: '#56AFEC', bot: '#CFEBFA', tint: '#FFD9A0', a: 0.05, lights: 0 },
  { h: 17.4, top: '#6B86C8', bot: '#F5B57D', tint: '#FF9A5A', a: 0.14, lights: 0.1 },
  { h: 18.6, top: '#4A4C99', bot: '#F7895A', tint: '#C8503C', a: 0.24, lights: 0.45 },
  { h: 19.6, top: '#212963', bot: '#7A5893', tint: '#1C2260', a: 0.42, lights: 0.9 },
  { h: 21, top: '#0C1332', bot: '#1C2757', tint: '#0E1640', a: 0.55, lights: 1 },
  { h: 24, top: '#060A1E', bot: '#151F48', tint: '#0A1236', a: 0.62, lights: 1 },
];

function mix(a: string, b: string, t: number): string {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const x = p(a);
  const y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export type SkyPhase = 'Midnight' | 'Late night' | 'Dawn' | 'Early morning' | 'Morning' | 'Noon' | 'Afternoon' | 'Evening' | 'Sunset' | 'Dusk' | 'Night';

function phaseOf(h: number): SkyPhase {
  if (h < 4.5) return h < 1 || h >= 23 ? 'Midnight' : 'Late night';
  if (h < 5.9) return 'Dawn';
  if (h < 8) return 'Early morning';
  if (h < 11.5) return 'Morning';
  if (h < 13.5) return 'Noon';
  if (h < 16.5) return 'Afternoon';
  if (h < 18.2) return 'Evening';
  if (h < 19.2) return 'Sunset';
  if (h < 20.3) return 'Dusk';
  if (h < 23) return 'Night';
  return 'Midnight';
}

export type SkyState = {
  /** The mockup hour this moment maps to (for debugging and the demo). */
  hour: number;
  phase: SkyPhase;
  skyTop: string;
  skyBot: string;
  /** Colour wash over the map (warm at dawn/sunset, blue at night) and its strength. */
  tint: string;
  tintAlpha: number;
  /** 0 (day) .. 1 (night): drives stars and night lights (M-06). */
  dark: number;
  starOpacity: number;
  /** Positions as fractions: x 0 (east, left) .. 1 (west, right); arc 0 (horizon) .. 1 (top of the sky). */
  sun: { up: boolean; x: number; arc: number; color: string; glow: string; opacity: number };
  moon: { up: boolean; x: number; arc: number; opacity: number };
  /** Sunlight on the ground (M-04): warm near the horizon, pale at midday. */
  sunGround: string;
};

/** The sky for a real moment and place. Without a place, central Nigeria's sun times. */
export function skyAt(date: Date, place?: { lat: number; lng: number } | null): SkyState {
  const { lat, lng } = place ?? { lat: 9.08, lng: 8.68 };
  return skyForHour(mockupHour(watMinutes(date), sunTimes(date, lat, lng)));
}

/** The sky at a mockup hour (0..24). Used by skyAt and by the design-kit time slider. */
export function skyForHour(h: number): SkyState {
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
  const A = KEYS[i];
  const B = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (h - A.h) / (B.h - A.h)));
  const dark = A.lights + (B.lights - A.lights) * t;

  const sunT = (h - MOCK_SUNRISE) / (MOCK_SUNSET - MOCK_SUNRISE);
  const sunUp = sunT > -0.03 && sunT < 1.03;
  const sunClamped = Math.min(1, Math.max(0, sunT));
  const sunArc = Math.sin(Math.PI * sunClamped);

  const nightH = h >= 19 ? h - 19 : h + 5;
  const moonT = nightH / 10.75;
  const moonUp = moonT >= 0 && moonT <= 1;
  const moonClamped = Math.min(1, Math.max(0, moonT));

  return {
    hour: h,
    phase: phaseOf(h),
    skyTop: mix(A.top, B.top, t),
    skyBot: mix(A.bot, B.bot, t),
    tint: mix(A.tint, B.tint, t),
    tintAlpha: A.a + (B.a - A.a) * t,
    dark,
    starOpacity: Math.max(0, (dark - 0.5) * 2),
    sun: {
      up: sunUp,
      x: sunClamped,
      arc: sunArc,
      color: mix('#FF8A3D', '#FFE27A', Math.min(1, sunArc * 1.6)),
      glow: `rgba(255,214,110,${(0.35 + sunArc * 0.3).toFixed(2)})`,
      opacity: sunUp ? 1 : 0,
    },
    moon: { up: moonUp, x: moonClamped, arc: Math.sin(Math.PI * moonClamped), opacity: moonUp ? 1 : 0 },
    sunGround: sunUp ? (sunArc < 0.45 ? 'rgba(255,150,80,.30)' : 'rgba(255,240,190,.16)') : 'rgba(0,0,0,0)',
  };
}
