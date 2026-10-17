/**
 * 3D billboards for the toy world (M-18 step 3).
 *
 * Each map billboard ad stands at its real spot as a board on two posts, drawn from the same
 * content as the 2D board (colour, "Ad" chip, title, line), so what a business designs is
 * still what neighbours see. The board turns to face the viewer and keeps about the 2D
 * board's size on screen at any zoom, so it stays readable. The face is self-lit (bright by
 * night too) and two lamps on top switch on after dusk.
 *
 * Taps: the layer cannot hold DOM buttons, so `pick` finds the board under a screen point
 * from the same projection the layer draws with. The 2D marker stays in the page for screen
 * readers and keyboard users; CSS only hides it from sight while the 3D board shows.
 */
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';

export type { ToyBillboard } from './constants';
import type { ToyBillboard } from './constants';

/** Face width in model metres; the whole board is scaled so this is ~FACE_PX on screen. */
const FACE_W = 12;
const FACE_H = 6;
const POST_H = 7;
const FACE_PX = 132;

type Board = { data: ToyBillboard; group: THREE.Group; face: THREE.Mesh; texture: THREE.CanvasTexture };

/** Draw the board face: same parts as the 2D board. */
function faceCanvas(b: ToyBillboard): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = b.colour;
  g.fillRect(0, 0, 512, 256);
  // "Ad" chip, top left: every ad says so.
  g.font = '800 30px Nunito, "Nunito Sans", system-ui, sans-serif';
  const chipW = g.measureText(b.chip).width + 28;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath();
  g.roundRect?.(20, 18, chipW, 44, 22);
  if (!g.roundRect) g.rect(20, 18, chipW, 44);
  g.fill();
  g.fillStyle = '#1D2433';
  g.textBaseline = 'middle';
  g.fillText(b.chip, 34, 41);
  // Title, shrunk to fit; then the line.
  g.fillStyle = b.ink;
  g.textAlign = 'center';
  let size = 76;
  do {
    g.font = `900 ${size}px Nunito, "Nunito Sans", system-ui, sans-serif`;
    size -= 4;
  } while (g.measureText(b.title).width > 470 && size > 30);
  g.fillText(b.title, 256, b.line ? 128 : 146, 480);
  if (b.line) {
    g.font = '700 34px "Nunito Sans", Nunito, system-ui, sans-serif';
    g.globalAlpha = 0.92;
    g.fillText(b.line, 256, 196, 480);
    g.globalAlpha = 1;
  }
  return c;
}

export function createBillboards() {
  const root = new THREE.Group();
  const steel = new THREE.MeshLambertMaterial({ color: '#3A4252' });
  const lampOn = new THREE.MeshBasicMaterial({ color: '#FFF1C2' });
  const postGeo = new THREE.BoxGeometry(0.5, POST_H, 0.5);
  const frameGeo = new THREE.BoxGeometry(FACE_W + 0.5, FACE_H + 0.5, 0.4);
  const faceGeo = new THREE.PlaneGeometry(FACE_W, FACE_H);
  const lampGeo = new THREE.BoxGeometry(0.5, 0.3, 0.9);
  const boards = new Map<string, Board>();
  const lamps: THREE.Mesh[] = [];
  let key = '';
  /** projection × model from the last frame, for picking. */
  const lastMatrix = new THREE.Matrix4();
  let hasFrame = false;

  const build = (data: ToyBillboard): Board => {
    const group = new THREE.Group();
    for (const x of [-FACE_W * 0.3, FACE_W * 0.3]) {
      const post = new THREE.Mesh(postGeo, steel);
      post.position.set(x, POST_H / 2, -0.3);
      group.add(post);
    }
    const frame = new THREE.Mesh(frameGeo, steel);
    frame.position.set(0, POST_H + FACE_H / 2, -0.3);
    group.add(frame);
    const texture = new THREE.CanvasTexture(faceCanvas(data));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    // Unlit, so the printed colours stay true by day and the board glows by night.
    const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: texture }));
    face.position.set(0, POST_H + FACE_H / 2, -0.05);
    group.add(face);
    for (const x of [-FACE_W * 0.3, FACE_W * 0.3]) {
      const lamp = new THREE.Mesh(lampGeo, lampOn);
      lamp.position.set(x, POST_H + FACE_H + 0.4, 0.5);
      lamp.visible = false;
      lamps.push(lamp);
      group.add(lamp);
    }
    group.renderOrder = 6;
    root.add(group);
    return { data, group, face, texture };
  };

  const dispose = (b: Board) => {
    root.remove(b.group);
    b.texture.dispose();
    (b.face.material as THREE.Material).dispose();
    for (const child of b.group.children) {
      const i = lamps.indexOf(child as THREE.Mesh);
      if (i >= 0) lamps.splice(i, 1);
    }
  };

  return {
    root,

    /** Replace the boards (cheap when nothing changed). */
    set(list: ToyBillboard[]) {
      const next = list.map((b) => `${b.id}|${b.title}|${b.line ?? ''}|${b.colour}|${b.chip}|${b.lng},${b.lat}`).join(';');
      if (next === key) return;
      key = next;
      for (const b of boards.values()) dispose(b);
      boards.clear();
      if (typeof document === 'undefined') return;
      for (const b of list) boards.set(b.id, build(b));
    },

    get count() {
      return boards.size;
    },

    /** Place the boards for this frame. */
    update(map: maplibregl.Map, origin: maplibregl.MercatorCoordinate, scale: number, matrix: THREE.Matrix4) {
      lastMatrix.copy(matrix);
      hasFrame = true;
      // Metres per CSS pixel at the centre (MapLibre uses 512 px tiles).
      const mpp = (40_075_016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
      const size = (FACE_PX * mpp) / FACE_W;
      // Face the viewer: the face looks along +z; turn it to point back at the camera.
      const yaw = (-map.getBearing() * Math.PI) / 180;
      for (const b of boards.values()) {
        const m = maplibregl.MercatorCoordinate.fromLngLat([b.data.lng, b.data.lat], 0);
        b.group.position.set((m.x - origin.x) / scale, 0, (m.y - origin.y) / scale);
        b.group.rotation.y = yaw;
        b.group.scale.setScalar(size);
        b.group.updateMatrixWorld(true);
      }
    },

    setDark(dark: number) {
      for (const l of lamps) l.visible = dark > 0.45;
    },

    /** The board under a screen point (CSS px in the map canvas), nearest first. */
    pick(point: { x: number; y: number }, width: number, height: number): string | null {
      if (!hasFrame) return null;
      let best: { id: string; w: number } | null = null;
      const v = new THREE.Vector4();
      for (const b of boards.values()) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let w = 0;
        let behind = false;
        // The face's four corners, then the foot of the posts so a tap on them counts too.
        for (const [x, y] of [[-FACE_W / 2, POST_H + FACE_H], [FACE_W / 2, POST_H + FACE_H], [-FACE_W / 2, 0], [FACE_W / 2, 0]]) {
          const p = new THREE.Vector3(x, y, 0).applyMatrix4(b.group.matrixWorld);
          v.set(p.x, p.y, p.z, 1).applyMatrix4(lastMatrix);
          if (v.w <= 0) {
            behind = true;
            break;
          }
          const sx = ((v.x / v.w + 1) / 2) * width;
          const sy = ((1 - v.y / v.w) / 2) * height;
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
          w = v.w;
        }
        if (behind) continue;
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY && (!best || w < best.w)) {
          best = { id: b.data.id, w };
        }
      }
      return best?.id ?? null;
    },

    dispose() {
      for (const b of boards.values()) dispose(b);
      boards.clear();
      key = '';
      for (const g of [postGeo, frameGeo, faceGeo, lampGeo]) g.dispose();
      for (const m of [steel, lampOn]) m.dispose();
    },
  };
}
