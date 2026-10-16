/**
 * Toy-world street life models (owner, 2026-10-16): low-poly danfos, kekes, okadas, cars,
 * people, kids, the football and palm trees, built in code (nothing to download).
 *
 * Each model is one geometry with vertex colours. Parts drawn white take the instance colour
 * (car paint, shirts); dark parts stay dark. Forward is +x, up is +y, sizes in metres.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Part = { w: number; h: number; d: number; x: number; y: number; z: number; colour: string };

function boxPart(p: Part): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(p.w, p.h, p.d).toNonIndexed();
  g.translate(p.x, p.y, p.z);
  const c = new THREE.Color(p.colour);
  const n = g.getAttribute('position').count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.deleteAttribute('uv');
  return g;
}

function model(parts: Part[]): THREE.BufferGeometry {
  return mergeGeometries(parts.map(boxPart), false)!;
}

const TINT = '#FFFFFF'; // takes the instance colour
const GLASS = '#26324A';
const TYRE = '#1F2328';
const DARK = '#2B2F36';
const SKIN = ['#7A4B2E', '#5C3A22', '#8D5A3B', '#6B4128'];

const wheels = (len: number, width: number, r = 0.35, xs?: number[]): Part[] =>
  (xs ?? [-len * 0.32, len * 0.32]).flatMap((x) => [
    { w: r * 2, h: r * 2, d: 0.25, x, y: r, z: width / 2, colour: TYRE },
    { w: r * 2, h: r * 2, d: 0.25, x, y: r, z: -width / 2, colour: TYRE },
  ]);

/** Lagos danfo: yellow body (instance colour), two black stripes, dark windows. */
export function danfoModel() {
  return model([
    { w: 5, h: 1.6, d: 2, x: 0, y: 1.2, z: 0, colour: TINT },
    { w: 5.02, h: 0.12, d: 2.02, x: 0, y: 0.75, z: 0, colour: DARK },
    { w: 5.02, h: 0.12, d: 2.02, x: 0, y: 1.05, z: 0, colour: DARK },
    { w: 4.2, h: 0.55, d: 2.04, x: -0.2, y: 1.65, z: 0, colour: GLASS },
    { w: 0.06, h: 0.55, d: 1.6, x: 2.52, y: 1.6, z: 0, colour: GLASS },
    ...wheels(5, 2),
  ]);
}

/** Keke: small three-wheeler with a black canopy. */
export function kekeModel() {
  return model([
    { w: 2.2, h: 0.9, d: 1.3, x: 0, y: 0.75, z: 0, colour: TINT },
    { w: 2.3, h: 0.12, d: 1.4, x: -0.05, y: 1.85, z: 0, colour: DARK },
    { w: 0.08, h: 0.95, d: 0.08, x: 1, y: 1.35, z: 0.6, colour: DARK },
    { w: 0.08, h: 0.95, d: 0.08, x: 1, y: 1.35, z: -0.6, colour: DARK },
    { w: 0.08, h: 0.95, d: 0.08, x: -1, y: 1.35, z: 0.6, colour: DARK },
    { w: 0.08, h: 0.95, d: 0.08, x: -1, y: 1.35, z: -0.6, colour: DARK },
    { w: 0.06, h: 0.5, d: 1.1, x: 1.1, y: 1.4, z: 0, colour: GLASS },
    { w: 0.6, h: 0.6, d: 0.2, x: 1.0, y: 0.3, z: 0, colour: TYRE },
    ...wheels(2.2, 1.2, 0.28, [-0.7]),
  ]);
}

/** Okada with its rider (rider's shirt is the instance colour). */
export function okadaModel() {
  return model([
    { w: 1.7, h: 0.35, d: 0.32, x: 0, y: 0.7, z: 0, colour: '#B3261E' },
    { w: 0.7, h: 0.7, d: 0.18, x: 0.65, y: 0.35, z: 0, colour: TYRE },
    { w: 0.7, h: 0.7, d: 0.18, x: -0.65, y: 0.35, z: 0, colour: TYRE },
    { w: 0.45, h: 0.7, d: 0.42, x: -0.1, y: 1.25, z: 0, colour: TINT },
    { w: 0.3, h: 0.3, d: 0.3, x: -0.05, y: 1.75, z: 0, colour: SKIN[0] },
    { w: 0.34, h: 0.18, d: 0.34, x: -0.05, y: 1.92, z: 0, colour: DARK },
  ]);
}

/** Car: body in the instance colour, darker cabin glass. */
export function carModel() {
  return model([
    { w: 4.2, h: 0.75, d: 1.8, x: 0, y: 0.75, z: 0, colour: TINT },
    { w: 2.2, h: 0.65, d: 1.6, x: -0.25, y: 1.45, z: 0, colour: GLASS },
    { w: 2.24, h: 0.08, d: 1.64, x: -0.25, y: 1.8, z: 0, colour: TINT },
    ...wheels(4.2, 1.8, 0.33),
  ]);
}

/** A person: shirt in the instance colour, dark trousers, head. */
export function personModel(height = 1.7) {
  const k = height / 1.7;
  return model([
    { w: 0.32 * k, h: 0.8 * k, d: 0.4 * k, x: 0, y: 0.4 * k, z: 0, colour: '#2E3A55' },
    { w: 0.38 * k, h: 0.62 * k, d: 0.52 * k, x: 0, y: 1.1 * k, z: 0, colour: TINT },
    { w: 0.28 * k, h: 0.28 * k, d: 0.28 * k, x: 0, y: 1.56 * k, z: 0, colour: SKIN[1] },
  ]);
}

export function ballModel() {
  const g = new THREE.IcosahedronGeometry(0.22, 0).toNonIndexed();
  g.translate(0, 0.22, 0);
  const n = g.getAttribute('position').count;
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  return g;
}

/** Palm tree: tall trunk and a crown of fronds. */
export function palmModel() {
  const trunk = boxPart({ w: 0.35, h: 7, d: 0.35, x: 0, y: 3.5, z: 0, colour: '#8A6A45' });
  const fronds: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.BoxGeometry(3.2, 0.12, 0.7).toNonIndexed();
    f.translate(1.5, 0, 0);
    f.rotateZ(-0.35);
    f.rotateY((i / 6) * Math.PI * 2);
    f.translate(0, 7, 0);
    const n = f.getAttribute('position').count;
    const c = new THREE.Color(i % 2 ? '#2F8F4E' : '#3FA35C');
    const cols = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) cols.set([c.r, c.g, c.b], j * 3);
    f.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    f.deleteAttribute('uv');
    fronds.push(f);
  }
  return mergeGeometries([trunk, ...fronds], false)!;
}

/** Instance colours by variant: danfo yellows, keke colours, car paints, shirts. */
export const VARIANT_COLOURS: Record<string, string[]> = {
  danfo: ['#F2C230', '#F5C518', '#EDB81C', '#F2C230', '#F7CC3B'],
  keke: ['#F2C230', '#2F9E57', '#F2C230', '#3B82C4', '#F2C230'],
  okada: ['#C8102E', '#2B6AA6', '#0E8A3E', '#E8892B', '#8B5CF6'],
  car: ['#FFFFFF', '#C8102E', '#2B6AA6', '#1D2433', '#9AA3AF'],
  person: ['#E8892B', '#2B6AA6', '#0E8A3E', '#C8102E', '#8B5CF6', '#F2C230'],
  kid: ['#C8102E', '#2B6AA6'],
  ball: ['#FFFFFF'],
};
