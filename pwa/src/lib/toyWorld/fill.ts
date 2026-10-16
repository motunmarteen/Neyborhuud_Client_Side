/**
 * Filler buildings (owner, 2026-10-16: "Fill in, plus help map Nigeria").
 *
 * OpenStreetMap has few building outlines in much of Nigeria, so streets look empty. Where
 * there is no real outline, place styled buildings along real roads, facing the street:
 * plazas on main roads, compounds on side streets. Never on a road, water, a park or a pitch,
 * never over a real building. Decoration only (like the moving vehicles): real outlines always
 * win, pins and posts stay exactly real. Same input → same buildings (seeded by position).
 *
 * Local metres: x = east, z = south.
 */
import { hash01, type Pt } from './shapes';

export type Road = { pts: Pt[]; cls: string };
export type Filler = { id: string; ring: Pt[] };

/** Half the road width in metres; null = not a street buildings face (paths, tracks, rail). */
export function roadHalfWidth(cls: string): number | null {
  switch (cls) {
    case 'motorway':
    case 'trunk':
      return 9;
    case 'primary':
      return 7;
    case 'secondary':
      return 6;
    case 'tertiary':
      return 5;
    case 'minor':
    case 'residential':
    case 'unclassified':
      return 4;
    case 'service':
      return 3;
    default:
      return null;
  }
}

/** Frontage and depth for buildings on this kind of road. */
function lotSize(cls: string, r: number): { front: number; depth: number; gap: number } {
  if (cls === 'motorway' || cls === 'trunk' || cls === 'primary' || cls === 'secondary') {
    return { front: 14 + r * 14, depth: 12 + r * 10, gap: 3 };
  }
  if (cls === 'tertiary') return { front: 11 + r * 8, depth: 10 + r * 6, gap: 3 };
  return { front: 8 + r * 7, depth: 8 + r * 6, gap: 2.5 };
}

const CELL = 4;
const key = (x: number, z: number) => `${Math.floor(x / CELL)}:${Math.floor(z / CELL)}`;

/** A coarse occupancy grid: every cell a shape covers is taken. */
class Grid {
  private cells = new Set<string>();
  addRing(ring: Pt[]) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of ring) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    for (let x = minX; x <= maxX + CELL; x += CELL) {
      for (let z = minZ; z <= maxZ + CELL; z += CELL) {
        if (pointInRing({ x, z }, ring) || nearRing({ x, z }, ring, CELL)) this.cells.add(key(x, z));
      }
    }
  }
  addDisc(p: Pt, r: number) {
    for (let x = p.x - r; x <= p.x + r; x += CELL / 2) {
      for (let z = p.z - r; z <= p.z + r; z += CELL / 2) {
        if (Math.hypot(x - p.x, z - p.z) <= r) this.cells.add(key(x, z));
      }
    }
  }
  /** Checks the whole (four-sided) lot in small steps, edges included. */
  takenRing(ring: Pt[]): boolean {
    const [a, b, , d] = ring;
    const lenU = Math.hypot(b.x - a.x, b.z - a.z);
    const lenV = Math.hypot(d.x - a.x, d.z - a.z);
    const nu = Math.max(1, Math.ceil(lenU / (CELL / 2)));
    const nv = Math.max(1, Math.ceil(lenV / (CELL / 2)));
    for (let i = 0; i <= nu; i++) {
      for (let j = 0; j <= nv; j++) {
        const x = a.x + ((b.x - a.x) * i) / nu + ((d.x - a.x) * j) / nv;
        const z = a.z + ((b.z - a.z) * i) / nu + ((d.z - a.z) * j) / nv;
        if (this.cells.has(key(x, z))) return true;
      }
    }
    return false;
  }
}

export function pointInRing(p: Pt, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

function nearRing(p: Pt, ring: Pt[], d: number): boolean {
  return ring.some((q) => Math.abs(q.x - p.x) < d && Math.abs(q.z - p.z) < d);
}

/**
 * Place filler buildings along roads.
 * - real: real building footprints (kept free, never covered)
 * - open: water, parks, pitches (kept free)
 * - radius: only within this distance of the centre (0, 0)
 */
export function fillAlongRoads(
  roads: Road[],
  real: Pt[][],
  open: Pt[][],
  radius: number,
  max: number,
  /** Filled with palm tree spots: the empty lots between houses. */
  trees?: Pt[],
): Filler[] {
  const grid = new Grid();
  for (const r of real) grid.addRing(r);
  for (const o of open) grid.addRing(o);
  // Roads themselves are never built on.
  for (const road of roads) {
    const half = roadHalfWidth(road.cls) ?? 2;
    for (let i = 0; i < road.pts.length - 1; i++) {
      const a = road.pts[i];
      const b = road.pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      for (let t = 0; t <= len; t += CELL / 2) {
        grid.addDisc({ x: a.x + ((b.x - a.x) * t) / len, z: a.z + ((b.z - a.z) * t) / len }, half + 1);
      }
    }
  }

  const out: Filler[] = [];
  // Busier roads first: they get their plazas before side streets fill the corners.
  const order = [...roads].sort((a, b) => (roadHalfWidth(b.cls) ?? 0) - (roadHalfWidth(a.cls) ?? 0));
  for (const road of order) {
    const half = roadHalfWidth(road.cls);
    if (half == null || out.length >= max) continue;
    // Walk the whole street (round its bends), not one short piece at a time.
    const cum: number[] = [0];
    for (let i = 1; i < road.pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(road.pts[i].x - road.pts[i - 1].x, road.pts[i].z - road.pts[i - 1].z));
    }
    const total = cum[cum.length - 1];
    const at = (d: number): Pt => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const a = road.pts[i - 1];
      const b = road.pts[i];
      const seg = cum[i] - cum[i - 1] || 1;
      const k = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
      return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k };
    };
    // Side streets get a second row behind: compounds behind the street front.
    const rows = half <= 5 ? 2 : 1;
    for (const side of [-1, 1]) {
      let d = 2;
      while (d < total && out.length < max) {
        const p0 = at(d);
        const seed = `${Math.round(p0.x)}:${Math.round(p0.z)}:${side}`;
        const { front, depth, gap } = lotSize(road.cls, hash01(seed));
        if (d + front > total) break;
        const p1 = at(d + front);
        const chord = Math.hypot(p1.x - p0.x, p1.z - p0.z);
        // A sharp bend here: move on a little.
        if (chord < front * 0.85) {
          d += 3;
          continue;
        }
        const ux = (p1.x - p0.x) / chord;
        const uz = (p1.z - p0.z) / chord;
        const nx = -uz;
        const nz = ux;
        const P = (u: number, v: number): Pt => ({ x: p0.x + ux * u + nx * v, z: p0.z + uz * u + nz * v });
        if (hash01(`${seed}:skip`) < 0.1) {
          // An empty lot, like a real street: a palm grows there.
          const t = P(front * 0.3, side * (half + 3));
          const spot = [P(front * 0.3 - 1, side * (half + 2)), P(front * 0.3 + 1, side * (half + 2)), P(front * 0.3 + 1, side * (half + 4)), P(front * 0.3 - 1, side * (half + 4))];
          if (trees && Math.hypot(t.x, t.z) <= radius && !grid.takenRing(spot)) {
            grid.addRing(spot);
            trees.push(t);
          }
          d += front * 0.6 + gap;
          continue;
        }
        let v = half + 1.5 + hash01(`${seed}:sb`) * 2;
        for (let row = 0; row < rows; row++) {
          const rd = row === 0 ? depth : 7 + hash01(`${seed}:r${row}`) * 6;
          const rf = row === 0 ? front : Math.min(front, 7 + hash01(`${seed}:f${row}`) * 6);
          const ring = [P(0, side * v), P(rf, side * v), P(rf, side * (v + rd)), P(0, side * (v + rd))];
          const cx = (ring[0].x + ring[2].x) / 2;
          const cz = (ring[0].z + ring[2].z) / 2;
          if (Math.hypot(cx, cz) <= radius && !grid.takenRing(ring)) {
            grid.addRing(ring);
            out.push({ id: `fill:${seed}:${row}`, ring });
          }
          v += rd + 2.5;
          if (out.length >= max) break;
        }
        d += front + gap;
      }
    }
  }
  return out;
}
