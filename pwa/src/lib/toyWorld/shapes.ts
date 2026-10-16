/**
 * Toy-world buildings (owner, 2026-10-16: "like WareTrack ... varieties of building"): turn a
 * real OpenStreetMap footprint into a clean, bright, low-poly Nigerian building.
 *
 * Coordinates here are local metres: x = east, z = south, y = up. Pure maths, no three.js,
 * so it can be tested.
 */

export type Pt = { x: number; z: number };

export type BuildingKind = 'kiosk' | 'bungalow' | 'house' | 'storey' | 'plaza' | 'warehouse' | 'tall';

export type BuildingPlan = {
  kind: BuildingKind;
  /** Wall height in metres (to the roof edge). */
  height: number;
  roof: 'hip' | 'gable' | 'flat' | 'sawtooth';
  wall: string;
  roofColour: string;
  floors: number;
};

/** Shoelace area (m²) of a closed ring (first point not repeated). */
export function ringArea(ring: Pt[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    a += p.x * q.z - q.x * p.z;
  }
  return Math.abs(a) / 2;
}

/** Stable pseudo-random 0..1 from an id, so a building always looks the same. */
export function hash01(id: number | string): number {
  const s = String(id);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function convexHull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Smallest rectangle around the footprint (centre, half lengths, angle of the long side). */
export type Box = { cx: number; cz: number; halfLong: number; halfShort: number; angle: number };

export function orientedBox(ring: Pt[]): Box {
  const hull = convexHull(ring);
  let best: Box & { area: number } = { cx: 0, cz: 0, halfLong: 0, halfShort: 0, angle: 0, area: Infinity };
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const ang = Math.atan2(b.z - a.z, b.x - a.x);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const q of hull) {
      const u = q.x * c + q.z * s;
      const v = -q.x * s + q.z * c;
      minU = Math.min(minU, u); maxU = Math.max(maxU, u);
      minV = Math.min(minV, v); maxV = Math.max(maxV, v);
    }
    const area = (maxU - minU) * (maxV - minV);
    if (area < best.area) {
      const mu = (minU + maxU) / 2;
      const mv = (minV + maxV) / 2;
      const w = (maxU - minU) / 2;
      const h = (maxV - minV) / 2;
      const long = w >= h;
      best = {
        cx: mu * c - mv * s,
        cz: mu * s + mv * c,
        halfLong: long ? w : h,
        halfShort: long ? h : w,
        angle: long ? ang : ang + Math.PI / 2,
        area,
      };
    }
  }
  const { area: _area, ...box } = best;
  void _area;
  return box;
}

const WALLS = ['#FFFFFF', '#F4F1EA', '#F3E3C8', '#DCE8F5', '#F6D9C8', '#DDEFE0', '#FBEFD5'];
const ROOF_ZINC = '#8E9CAD';
const ROOF_RED = '#C8643C';
const ROOF_BLUE = '#2F6FD0';
const ROOF_GREEN = '#3E8E5A';
const ROOF_DARK = '#4A5568';

const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length) % arr.length];

/**
 * What kind of building a footprint becomes. Uses the real height when OpenStreetMap has one;
 * otherwise the size decides (most Lagos/Enugu/Kano buildings have no height in OSM).
 */
export function planBuilding(id: number | string, area: number, osmHeight: number | null, rectangularity: number): BuildingPlan {
  const r = hash01(id);
  const r2 = hash01(`${id}:b`);
  const wall = pick(WALLS, r2);
  if (osmHeight && osmHeight > 14) {
    return { kind: 'tall', height: osmHeight, roof: 'flat', wall: pick(['#FFFFFF', '#DCE8F5', '#E9EEF5'], r), roofColour: ROOF_DARK, floors: Math.max(4, Math.round(osmHeight / 3.2)) };
  }
  if (area < 35) {
    return { kind: 'kiosk', height: 2.8, roof: 'flat', wall: pick(['#2F6FD0', '#E8892B', '#0E8A3E', '#C8102E', '#F2C230'], r), roofColour: ROOF_DARK, floors: 1 };
  }
  if (area < 160) {
    const gable = rectangularity > 0.8 && r < 0.55;
    return { kind: 'bungalow', height: 3.4, roof: gable ? 'gable' : 'hip', wall, roofColour: r2 < 0.55 ? ROOF_ZINC : r2 < 0.85 ? ROOF_RED : ROOF_GREEN, floors: 1 };
  }
  if (area < 420) {
    const twoStorey = r < 0.55;
    return {
      kind: 'house',
      height: twoStorey ? 6.6 : 3.6,
      roof: rectangularity > 0.75 ? (r2 < 0.5 ? 'hip' : 'gable') : 'flat',
      wall,
      roofColour: r2 < 0.5 ? ROOF_RED : ROOF_ZINC,
      floors: twoStorey ? 2 : 1,
    };
  }
  if (area < 1400) {
    const floors = 2 + Math.floor(r * 3); // 2–4 storeys
    const plaza = r2 < 0.4;
    return { kind: plaza ? 'plaza' : 'storey', height: floors * 3.3, roof: 'flat', wall: plaza ? '#FFFFFF' : wall, roofColour: ROOF_DARK, floors };
  }
  return { kind: 'warehouse', height: 8, roof: rectangularity > 0.7 ? 'sawtooth' : 'flat', wall: '#E9EEF5', roofColour: ROOF_BLUE, floors: 1 };
}

/** One triangle list (x, y, z per vertex) for the roof of a plan, over the footprint's box. */
export function roofTriangles(box: Box, plan: BuildingPlan): number[] {
  const out: number[] = [];
  const c = Math.cos(box.angle);
  const s = Math.sin(box.angle);
  const overhang = plan.roof === 'sawtooth' ? 0 : 0.35;
  const L = box.halfLong + overhang;
  const W = box.halfShort + overhang;
  const y0 = plan.height;
  // Local (u along the long side, v across) to world.
  const P = (u: number, v: number, y: number) => [box.cx + u * c - v * s, y, box.cz + u * s + v * c];
  const tri = (a: number[], b: number[], d: number[]) => out.push(...a, ...b, ...d);
  const quad = (a: number[], b: number[], d: number[], e: number[]) => {
    tri(a, b, d);
    tri(a, d, e);
  };

  if (plan.roof === 'gable') {
    const ridge = y0 + Math.min(W * 0.7, 3.2);
    const a = P(-L, -W, y0), b = P(L, -W, y0), d = P(L, W, y0), e = P(-L, W, y0);
    const r1 = P(-L, 0, ridge), r2 = P(L, 0, ridge);
    quad(a, b, r2, r1); // one slope
    quad(d, e, r1, r2); // other slope
    tri(a, r1, e); // gable ends
    tri(b, d, r2);
  } else if (plan.roof === 'hip') {
    const ridgeHalf = Math.max(L - W, 0);
    const ridge = y0 + Math.min(W * 0.65, 3);
    const a = P(-L, -W, y0), b = P(L, -W, y0), d = P(L, W, y0), e = P(-L, W, y0);
    const r1 = P(-ridgeHalf, 0, ridge), r2 = P(ridgeHalf, 0, ridge);
    quad(a, b, r2, r1);
    quad(d, e, r1, r2);
    tri(b, d, r2);
    tri(e, a, r1);
  } else if (plan.roof === 'sawtooth') {
    // Teeth across the long side, like the warehouse in the reference.
    const teeth = Math.max(2, Math.round((2 * L) / 7));
    const step = (2 * L) / teeth;
    const rise = 2.2;
    for (let i = 0; i < teeth; i++) {
      const u0 = -L + i * step;
      const u1 = u0 + step;
      const a = P(u0, -W, y0), b = P(u0, W, y0);
      const tA = P(u1, -W, y0 + rise), tB = P(u1, W, y0 + rise);
      const fA = P(u1, -W, y0), fB = P(u1, W, y0);
      quad(a, tA, tB, b); // sloped face
      quad(fA, fB, tB, tA); // steep face (glazing side)
      tri(a, fA, tA); // ends
      tri(b, tB, fB);
    }
  } else {
    // Flat roof with a small parapet rim.
    const rim = 0.6;
    const a = P(-L, -W, y0), b = P(L, -W, y0), d = P(L, W, y0), e = P(-L, W, y0);
    const a2 = P(-L, -W, y0 + rim), b2 = P(L, -W, y0 + rim), d2 = P(L, W, y0 + rim), e2 = P(-L, W, y0 + rim);
    quad(a, b, d, e);
    quad(a, a2, b2, b);
    quad(b, b2, d2, d);
    quad(d, d2, e2, e);
    quad(e, e2, a2, a);
  }
  return out;
}

/** Window and door spots on the two long sides (only for near-rectangular footprints). */
export type Opening = { x: number; y: number; z: number; angle: number; w: number; h: number; door: boolean };

export function openings(box: Box, plan: BuildingPlan, id: number | string): Opening[] {
  const out: Opening[] = [];
  const c = Math.cos(box.angle);
  const s = Math.sin(box.angle);
  const spacing = plan.kind === 'warehouse' ? 6 : 3;
  const n = Math.max(1, Math.floor((2 * box.halfLong) / spacing));
  const doorAt = Math.floor(hash01(`${id}:door`) * n);
  for (const side of [-1, 1]) {
    const v = side * (box.halfShort + 0.04);
    for (let f = 0; f < plan.floors; f++) {
      for (let i = 0; i < n; i++) {
        const u = -box.halfLong + spacing * (i + 0.5) + ((2 * box.halfLong) - n * spacing) / 2;
        const door = f === 0 && side === 1 && i === doorAt;
        const big = plan.kind === 'warehouse' || (plan.kind === 'plaza' && f === 0);
        const w = big ? 3.2 : door ? 1.1 : 1.2;
        const h = big ? 3.4 : door ? 2.2 : 1.2;
        const y = f * 3.3 + (door || big ? h / 2 : 1.7);
        out.push({ x: box.cx + u * c - v * s, y, z: box.cz + u * s + v * c, angle: box.angle, w, h, door: door || big });
      }
    }
  }
  return out;
}
