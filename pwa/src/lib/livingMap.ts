/**
 * The living map (tracker M-17, owner: "the map has to be real").
 *
 * Ambient street life that moves along the map's REAL geometry: vehicles on real roads,
 * people on real streets and paths, kids playing football on real pitches, crowds at real
 * markets. How busy it is follows the moment (rush hours, late night, rain) and vehicles
 * show headlights after dark. It is decoration: it never shows where a real person is.
 *
 * Pure logic (no DOM, no MapLibre): the hook in hooks/useLivingMap.ts feeds it road and
 * place geometry from the map and draws what it returns.
 */

export type LngLat = [number, number];
export type VehicleKind = 'danfo' | 'keke' | 'okada' | 'car' | 'brt';
export type AgentKind = VehicleKind | 'person' | 'kid' | 'ball';

export type Agent = {
  id: number;
  kind: AgentKind;
  /** Look variant (car colour, clothes). */
  variant: number;
  // Path walkers (vehicles, people)
  path?: LngLat[];
  cum?: number[]; // cumulative metres along the path
  s?: number; // metres along the path
  dir?: 1 | -1;
  /** People walk this many metres to one side of the street's centre line. */
  side?: number;
  speed: number; // metres per second
  // Area wanderers (kids on a pitch, a market crowd)
  home?: LngLat;
  radius?: number; // metres
  pos: LngLat;
  target?: LngLat;
  bearing: number;
};

/**
 * A reported go-slow, road block, accident or flood (M-10). Vehicles crawl near it and queue
 * up on the roads through it. Strength 0–1 comes from how fresh and serious the report is.
 */
export type Jam = { centre: LngLat; radiusM: number; strength: number };

const VEHICLE_KINDS = new Set<AgentKind>(['danfo', 'keke', 'okada', 'car', 'brt']);

const M_PER_DEG_LAT = 111_320;
const mPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

export function metres(a: LngLat, b: LngLat): number {
  const dx = (b[0] - a[0]) * mPerDegLng((a[1] + b[1]) / 2);
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/** Bearing in degrees clockwise from north. */
export function bearingOf(a: LngLat, b: LngLat): number {
  const dx = (b[0] - a[0]) * mPerDegLng((a[1] + b[1]) / 2);
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

function cumulative(path: LngLat[]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + metres(path[i - 1], path[i]));
  return out;
}

/** Point and heading at distance s along a path. */
export function along(path: LngLat[], cum: number[], s: number): { pos: LngLat; bearing: number } {
  const total = cum[cum.length - 1];
  const d = Math.min(Math.max(s, 0), total);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const a = path[i - 1];
  const b = path[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / seg;
  return { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bearing: bearingOf(a, b) };
}

/**
 * How busy the street is at a local hour (0–24): 0.08 late night … 1 at rush hours.
 * Nigerian rhythm: early start, morning and evening rush, busy late afternoon markets.
 */
export function activityAt(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h < 4.5) return 0.08;
  if (h < 6) return 0.25 + (h - 4.5) * 0.3;
  if (h < 9.5) return 1; // morning rush
  if (h < 16) return 0.7;
  if (h < 19.5) return 1; // evening rush, markets
  if (h < 22) return 0.55;
  return 0.2;
}

/** Fewer people out in the rain; nobody plays football in a storm. */
export function weatherFactor(wx: string | null | undefined): { people: number; vehicles: number; play: boolean } {
  switch (wx) {
    case 'storm':
      return { people: 0.15, vehicles: 0.6, play: false };
    case 'rain':
      return { people: 0.35, vehicles: 0.8, play: false };
    case 'drizzle':
      return { people: 0.7, vehicles: 0.95, play: true };
    default:
      return { people: 1, vehicles: 1, play: true };
  }
}

/**
 * How much a traffic report still slows the street: full for the first hour, fading to
 * nothing at 3 hours (go-slows clear; the pin itself stays on the map longer). Minor
 * reports slow traffic less.
 */
export function jamStrength(createdAt: string | Date, severity?: string, now: number = Date.now()): number {
  const hours = (now - new Date(createdAt).getTime()) / 3_600_000;
  if (!(hours >= 0) || hours >= 3) return 0;
  const fresh = hours <= 1 ? 1 : 1 - (hours - 1) / 2;
  const weight = severity === 'low' ? 0.6 : 1;
  return fresh * weight;
}

/** Speed multiplier at a point: 1 when the road is clear, down to a crawl at a strong jam. */
export function jamFactor(pos: LngLat, jams: Jam[] | undefined): number {
  if (!jams?.length) return 1;
  let f = 1;
  for (const j of jams) {
    if (j.strength <= 0) continue;
    const d = metres(pos, j.centre);
    if (d >= j.radiusM) continue;
    // Slowest in the middle, easing off towards the edge of the jam.
    const closeness = Math.min(1, (1 - d / j.radiusM) * 1.6);
    f = Math.min(f, 1 - 0.88 * j.strength * closeness);
  }
  return f;
}

/** The point on a path nearest to p: how far along it (s) and how far away (d), in metres. */
export function nearestOnPath(path: LngLat[], cum: number[], p: LngLat): { at: number; d: number } {
  const kx = mPerDegLng(p[1]);
  let best = { at: 0, d: Infinity };
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = [(path[i - 1][0] - p[0]) * kx, (path[i - 1][1] - p[1]) * M_PER_DEG_LAT];
    const [bx, by] = [(path[i][0] - p[0]) * kx, (path[i][1] - p[1]) * M_PER_DEG_LAT];
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.min(1, Math.max(0, -(ax * (bx - ax) + ay * (by - ay)) / len2));
    const d = Math.hypot(ax + (bx - ax) * t, ay + (by - ay) * t);
    if (d < best.d) best = { at: cum[i - 1] + (cum[i] - cum[i - 1]) * t, d };
  }
  return best;
}

/** Small deterministic random, so a street looks the same each time it is opened. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lane metres per BRT bus. */
const BRT_GAP_M = 180;

// Speeds in m/s, a little faster than life so the street reads as moving on a phone.
const SPEED: Record<VehicleKind | 'person', [number, number]> = {
  danfo: [7, 11],
  car: [8, 13],
  keke: [5, 8],
  okada: [8, 12],
  brt: [8, 12],
  person: [1.1, 1.7],
};

/** The vehicle mix: danfos where Lagos-style buses run (south-west), minibuses elsewhere look the same. */
function pickVehicle(r: () => number): VehicleKind {
  const x = r();
  if (x < 0.32) return 'car';
  if (x < 0.55) return 'keke';
  if (x < 0.8) return 'okada';
  return 'danfo';
}

export type Scene = {
  /** Roads cars can drive on, as polylines. */
  roads: LngLat[][];
  /** Real BRT lanes (OpenStreetMap busways). Only here do BRT buses run. */
  busways?: LngLat[][];
  /** Streets and paths people walk on. */
  walkways: LngLat[][];
  /** Pitches and playgrounds (centre and rough radius in metres). */
  pitches: { centre: LngLat; radius: number }[];
  /** Markets (centre). */
  markets: LngLat[];
};

export type Mood = {
  hour: number;
  weather: string | null | undefined;
  /** Scale with the visible area so a tiny view is not crowded. */
  density?: number;
  /** Reported go-slows on screen; none means traffic flows normally. */
  jams?: Jam[];
};

/** Build the cast for a scene and a moment. */
export function populate(scene: Scene, mood: Mood, seed = 1): Agent[] {
  const r = rng(seed);
  const act = activityAt(mood.hour);
  const wf = weatherFactor(mood.weather);
  const density = mood.density ?? 1;
  const agents: Agent[] = [];
  let id = 0;

  const usableRoads = scene.roads.filter((p) => p.length >= 2);
  const nVehicles = usableRoads.length ? Math.round(60 * act * wf.vehicles * density) : 0;
  for (let i = 0; i < nVehicles; i++) {
    const path = usableRoads[Math.floor(r() * usableRoads.length)];
    const cum = cumulative(path);
    if (cum[cum.length - 1] < 25) continue;
    const kind = pickVehicle(r);
    const [lo, hi] = SPEED[kind];
    const s = r() * cum[cum.length - 1];
    const dir: 1 | -1 = r() < 0.5 ? 1 : -1;
    const at = along(path, cum, s);
    agents.push({ id: id++, kind, variant: Math.floor(r() * 5), path, cum, s, dir, speed: lo + r() * (hi - lo), pos: at.pos, bearing: dir === 1 ? at.bearing : (at.bearing + 180) % 360 });
  }

  // Queues at reported go-slows: extra vehicles on the roads through each jam, bunched near it.
  for (const jam of mood.jams ?? []) {
    if (jam.strength <= 0) continue;
    const through = usableRoads
      .map((path) => {
        const cum = cumulative(path);
        return { path, cum, ...nearestOnPath(path, cum, jam.centre) };
      })
      .filter((x) => x.d < jam.radiusM && x.cum[x.cum.length - 1] >= 25);
    if (!through.length) continue;
    const queue = Math.round(26 * jam.strength * density);
    for (let i = 0; i < queue; i++) {
      const { path, cum, at } = through[i % through.length];
      const total = cum[cum.length - 1];
      // Bunched close to the report, nose to tail.
      const s = Math.min(total, Math.max(0, at + (r() - 0.5) * jam.radiusM * 0.7));
      const kind = pickVehicle(r);
      const [lo, hi] = SPEED[kind];
      const dir: 1 | -1 = r() < 0.5 ? 1 : -1;
      const p = along(path, cum, s);
      agents.push({ id: id++, kind, variant: Math.floor(r() * 5), path, cum, s, dir, speed: lo + r() * (hi - lo), pos: p.pos, bearing: dir === 1 ? p.bearing : (p.bearing + 180) % 360 });
    }
  }

  // BRT buses only on real BRT lanes, never invented on ordinary roads. At most one bus per
  // BRT_GAP_M of lane, spread out along it, so they never bunch up.
  const lanes = (scene.busways ?? [])
    .filter((p) => p.length >= 2)
    .map((path) => ({ path, cum: cumulative(path) }))
    .filter((l) => l.cum[l.cum.length - 1] >= 40);
  for (const { path, cum } of lanes) {
    const len = cum[cum.length - 1];
    const nBrt = Math.min(Math.floor(len / BRT_GAP_M) + 1, Math.round(6 * act * wf.vehicles * density));
    for (let i = 0; i < nBrt; i++) {
      const [lo, hi] = SPEED.brt;
      const s = ((i + 0.2 + r() * 0.6) / nBrt) * len;
      const dir: 1 | -1 = r() < 0.5 ? 1 : -1;
      const at = along(path, cum, s);
      agents.push({ id: id++, kind: 'brt', variant: Math.floor(r() * 2), path, cum, s, dir, speed: lo + r() * (hi - lo), pos: at.pos, bearing: dir === 1 ? at.bearing : (at.bearing + 180) % 360 });
    }
  }

  const walk = scene.walkways.filter((p) => p.length >= 2);
  const nPeople = walk.length ? Math.round(55 * act * wf.people * density) : 0;
  for (let i = 0; i < nPeople; i++) {
    const path = walk[Math.floor(r() * walk.length)];
    const cum = cumulative(path);
    if (cum[cum.length - 1] < 10) continue;
    const s = r() * cum[cum.length - 1];
    const dir: 1 | -1 = r() < 0.5 ? 1 : -1;
    const at = along(path, cum, s);
    // Walk on the side of the street, not in the middle.
    const side = (r() < 0.5 ? -1 : 1) * 3.5;
    agents.push({ id: id++, kind: 'person', variant: Math.floor(r() * 6), path, cum, s, dir, side, speed: SPEED.person[0] + r() * 0.6, pos: sideways(at.pos, side), bearing: at.bearing });
  }

  // Kids play football in daylight, when it is not raining.
  const daylight = mood.hour >= 7 && mood.hour <= 18.3;
  if (daylight && wf.play) {
    for (const p of scene.pitches.slice(0, 3)) {
      const radius = Math.max(10, Math.min(p.radius * 0.6, 35));
      const kids = 6 + Math.floor(r() * 5);
      for (let k = 0; k < kids; k++) {
        const pos = scatter(p.centre, radius, r);
        agents.push({ id: id++, kind: 'kid', variant: k % 2, home: p.centre, radius, pos, target: scatter(p.centre, radius, r), speed: 2 + r() * 2.2, bearing: 0 });
      }
      agents.push({ id: id++, kind: 'ball', variant: 0, home: p.centre, radius, pos: p.centre, target: scatter(p.centre, radius, r), speed: 7, bearing: 0 });
    }
  }

  // Market crowds in the day.
  if (mood.hour >= 7 && mood.hour <= 19.5) {
    for (const m of scene.markets.slice(0, 3)) {
      const crowd = Math.round(12 * act * wf.people);
      for (let k = 0; k < crowd; k++) {
        agents.push({ id: id++, kind: 'person', variant: Math.floor(r() * 6), home: m, radius: 30, pos: scatter(m, 30, r), target: scatter(m, 30, r), speed: 0.6 + r() * 0.6, bearing: 0 });
      }
    }
  }
  return agents;
}

/** A point a few metres east or west of another (people keep to the side of the street). */
function sideways(p: LngLat, metresEast: number): LngLat {
  return [p[0] + metresEast / mPerDegLng(p[1]), p[1]];
}

function scatter(c: LngLat, radiusM: number, r: () => number): LngLat {
  const a = r() * Math.PI * 2;
  const d = Math.sqrt(r()) * radiusM;
  return [c[0] + (Math.sin(a) * d) / mPerDegLng(c[1]), c[1] + (Math.cos(a) * d) / M_PER_DEG_LAT];
}

/** Move everyone forward by dt seconds; vehicles crawl through jams. Mutates and returns the agents. */
export function step(agents: Agent[], dt: number, r: () => number = Math.random, jams?: Jam[]): Agent[] {
  const ball = new Map<string, Agent>();
  for (const a of agents) if (a.kind === 'ball' && a.home) ball.set(a.home.join(','), a);

  for (const a of agents) {
    if (a.path && a.cum && a.s != null && a.dir) {
      const total = a.cum[a.cum.length - 1];
      const slow = VEHICLE_KINDS.has(a.kind) ? jamFactor(a.pos, jams) : 1;
      a.s += a.speed * slow * dt * a.dir;
      if (a.s > total || a.s < 0) {
        // Turn around at the end of the street (the next street comes with the next scene).
        a.dir = a.dir === 1 ? -1 : 1;
        a.s = Math.min(Math.max(a.s, 0), total);
      }
      const at = along(a.path, a.cum, a.s);
      a.pos = a.side ? sideways(at.pos, a.side) : at.pos;
      a.bearing = a.dir === 1 ? at.bearing : (at.bearing + 180) % 360;
      continue;
    }
    if (a.home && a.target && a.radius) {
      // Kids chase the ball; the crowd drifts between stalls.
      const goal = a.kind === 'kid' ? ball.get(a.home.join(','))?.pos ?? a.target : a.target;
      const d = metres(a.pos, goal);
      const move = a.speed * dt;
      if (d <= move || d < 1.5) {
        a.pos = goal === a.target ? a.target : a.pos;
        a.target = scatter(a.home, a.radius, r);
        if (a.kind === 'kid' && r() < 0.5) a.target = scatter(a.home, a.radius * 0.5, r);
      } else {
        const t = move / d;
        a.bearing = bearingOf(a.pos, goal);
        a.pos = [a.pos[0] + (goal[0] - a.pos[0]) * t, a.pos[1] + (goal[1] - a.pos[1]) * t];
      }
    }
  }
  return agents;
}
