/**
 * NeyborHuud 3D avatars, toy style (owner 2026-10-18: "toy-style 3D now, artist upgrade later").
 * Built from shapes with cel shading and a soft outline, so they match the map's toy world.
 * Every catalogue item id (server: modules/avatar/avatar.catalogue.ts) is drawn here; an
 * artist's models can later replace any part without changing the saved avatars.
 *
 * Units: the figure stands on y = 0 and is about 2.25 tall; it faces +z.
 */

import * as THREE from 'three';

export type AvatarConfig = Record<string, string>;
export type ColorOf = (itemId: string | undefined, fallback: string) => string;

// ── Materials ────────────────────────────────────────────────────────────────

let gradient: THREE.DataTexture | null = null;
function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

type MatOpts = { map?: THREE.Texture; emissive?: string; shiny?: boolean; transparent?: number };
function mat(color: string, o: MatOpts = {}): THREE.Material {
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: toonGradient(), map: o.map ?? null });
  if (o.emissive) {
    m.emissive = new THREE.Color(o.emissive);
    m.emissiveIntensity = 0.6;
  }
  if (o.transparent !== undefined) {
    m.transparent = true;
    m.opacity = o.transparent;
  }
  return m;
}

const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x1d2433, side: THREE.BackSide });

/** A mesh with a thin dark outline (the toy look). */
function part(geo: THREE.BufferGeometry, material: THREE.Material, outline = true): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  g.add(m);
  if (outline) {
    const o = new THREE.Mesh(geo, OUTLINE);
    o.scale.setScalar(1.045);
    g.add(o);
  }
  return g;
}

const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
  o.position.set(x, y, z);
  return o;
};

function shade(hex: string, k: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * k)));
  return `#${c.getHexString()}`;
}

// ── Fabric textures (drawn once per colour) ─────────────────────────────────

const texCache = new Map<string, THREE.Texture>();
function canvasTex(key: string, draw: (g: CanvasRenderingContext2D, s: number) => void): THREE.Texture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  draw(g, s);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const ankaraTex = (base: string) =>
  canvasTex(`ankara-${base}`, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    const accents = ['#F2C230', '#0E7C7B', '#E8742C', '#FFFFFF'];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const x = i * 32 + 16;
        const y = j * 32 + 16;
        g.fillStyle = accents[(i + j) % accents.length];
        g.beginPath();
        g.arc(x, y, 10, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = base;
        g.beginPath();
        g.arc(x, y, 5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = accents[(i + j + 2) % accents.length];
        g.fillRect(x + 12, y - 2, 6, 4);
      }
    }
  });

const laceTex = (base: string) =>
  canvasTex(`lace-${base}`, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = shade(base, 1.35);
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        g.beginPath();
        g.arc(i * 22 + 11, j * 22 + 11, 7, 0, Math.PI * 2);
        g.stroke();
      }
    }
  });

const eaglesTex = () =>
  canvasTex('eagles', (g, s) => {
    g.fillStyle = '#008751';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#0B6B3F';
    for (let x = 0; x < s; x += 16) g.fillRect(x, 0, 6, s);
    g.fillStyle = '#FFFFFF';
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.fillText('10', s / 2, s / 2 + 16);
  });

const jeansTex = (base: string) =>
  canvasTex(`jeans-${base}`, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = shade(base, 1.25);
    g.lineWidth = 1;
    for (let i = -s; i < s; i += 6) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + s, s);
      g.stroke();
    }
  });

// ── Body measurements ───────────────────────────────────────────────────────

type Build = { torsoW: number; hipW: number; legR: number; armR: number };
const BUILDS: Record<string, Build> = {
  body_slim: { torsoW: 0.27, hipW: 0.25, legR: 0.085, armR: 0.065 },
  body_regular: { torsoW: 0.31, hipW: 0.28, legR: 0.095, armR: 0.072 },
  body_broad: { torsoW: 0.37, hipW: 0.32, legR: 0.11, armR: 0.085 },
  body_curvy: { torsoW: 0.3, hipW: 0.36, legR: 0.105, armR: 0.072 },
};

const HEAD_Y = 1.74;
const HEAD_R = 0.42;
const SHOULDER_Y = 1.32;
const WAIST_Y = 0.86;
const HIP_Y = 0.78;
const KNEE_Y = 0.42;

// ── Parts ───────────────────────────────────────────────────────────────────

const FACE_SCALE: Record<string, [number, number, number]> = {
  face_round: [1.04, 1, 1],
  face_oval: [0.95, 1.08, 0.98],
  face_square: [1.06, 0.98, 0.98],
  face_heart: [1.02, 1.03, 0.97],
};
/** The head's stretch for its face shape; hair follows it so the scalp never pokes through. */
const faceScale = (cfg: AvatarConfig): [number, number, number] => FACE_SCALE[cfg.face] ?? FACE_SCALE.face_oval;

function buildHead(cfg: AvatarConfig, skin: string, hairCol: string): { head: THREE.Group; eyes: THREE.Object3D[] } {
  const head = new THREE.Group();
  head.position.set(0, HEAD_Y, 0);
  const skinM = mat(skin);
  const face = part(new THREE.SphereGeometry(HEAD_R, 40, 30), skinM);
  face.scale.set(...faceScale(cfg));
  head.add(face);
  if (cfg.face === 'face_square') head.add(at(part(new THREE.BoxGeometry(0.5, 0.18, 0.4), skinM, false), 0, -0.26, 0.02));
  if (cfg.face === 'face_heart') head.add(at(part(new THREE.SphereGeometry(0.16, 16, 12), skinM, false), 0, -0.33, 0.16));

  // Ears and nose
  for (const s of [-1, 1]) head.add(at(part(new THREE.SphereGeometry(0.075, 14, 10), skinM), s * 0.41, -0.02, 0));
  head.add(at(part(new THREE.SphereGeometry(0.055, 14, 10), mat(shade(skin, 0.9)), false), 0, -0.06, 0.41));

  // Eyes (white, iris, highlight) — blink by scaling y.
  const eyes: THREE.Object3D[] = [];
  const spread = cfg.eyes === 'eyes_wide' ? 0.17 : 0.145;
  const size = cfg.eyes === 'eyes_round' || cfg.eyes === 'eyes_wide' ? 0.085 : 0.075;
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * spread, 0.05, 0.36);
    const white = new THREE.Mesh(new THREE.SphereGeometry(size, 18, 14), mat('#FFFFFF'));
    if (cfg.eyes === 'eyes_almond') white.scale.set(1.15, 0.72, 0.6);
    else white.scale.set(1, cfg.eyes === 'eyes_sleepy' ? 0.62 : 1, 0.6);
    eye.add(white);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(size * 0.62, 14, 12), mat('#2A1A12'));
    iris.position.z = size * 0.32;
    iris.scale.set(1, cfg.eyes === 'eyes_sleepy' ? 0.7 : 1, 0.6);
    eye.add(iris);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(size * 0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(size * 0.25, size * 0.25, size * 0.55);
    eye.add(glint);
    if (cfg.eyes === 'eyes_sleepy') {
      const lid = new THREE.Mesh(new THREE.SphereGeometry(size * 1.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), skinM);
      lid.position.y = size * 0.05;
      eye.add(lid);
    }
    head.add(eye);
    eyes.push(eye);
  }

  // Brows
  const browM = mat(shade(hairCol, 0.9));
  for (const s of [-1, 1]) {
    const w = cfg.brows === 'brows_bold' ? 0.04 : 0.024;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.13, w, 0.03), browM);
    b.position.set(s * 0.15, 0.17, 0.38);
    b.rotation.z = cfg.brows === 'brows_arched' ? s * -0.28 : s * -0.08;
    head.add(b);
  }

  // Mouth
  if (cfg.mouth === 'mouth_grin') {
    const grin = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#5A1A1A'));
    grin.scale.set(1.3, 0.75, 0.5);
    grin.position.set(0, -0.18, 0.37);
    head.add(grin);
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.03), mat('#FFFFFF'));
    teeth.position.set(0, -0.185, 0.405);
    head.add(teeth);
  } else if (cfg.mouth === 'mouth_calm') {
    head.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), mat('#5A1A1A')), 0, -0.19, 0.4));
  } else {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 8, 20, Math.PI), mat('#5A1A1A'));
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.15, 0.395);
    head.add(smile);
  }

  // Facial hair
  const fhM = mat(hairCol);
  if (cfg.facialHair === 'fh_beard') {
    const beard = part(new THREE.SphereGeometry(HEAD_R * 1.02, 30, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), fhM);
    head.add(beard);
    head.add(at(part(new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), fhM, false), 0, -0.12, 0.4)).children.at(-1)!.rotation.set(0, 0, Math.PI / 2);
  } else if (cfg.facialHair === 'fh_stubble') {
    head.add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.005, 30, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), mat(hairCol, { transparent: 0.35 })));
  } else if (cfg.facialHair === 'fh_goatee') {
    const goatee = part(new THREE.SphereGeometry(0.06, 14, 10), fhM, false);
    goatee.scale.set(0.9, 1.3, 0.6);
    head.add(at(goatee, 0, -0.36, 0.3));
  }
  if (cfg.facialHair === 'fh_moustache' || cfg.facialHair === 'fh_goatee') {
    const m = part(new THREE.CapsuleGeometry(0.028, 0.13, 4, 8), fhM, false);
    m.rotation.z = Math.PI / 2;
    head.add(at(m, 0, -0.11, 0.405));
  }
  return { head, eyes };
}

function hairShell(r = HEAD_R * 1.04, cut = 0.5): THREE.SphereGeometry {
  return new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, 0, Math.PI * cut);
}

/**
 * A close cap of hair: a skullcap whose edge sits just above the brows all round, plus the
 * back of the head down to the nape (no tilt, so the crown is always covered).
 */
function hairCap(m: THREE.Material): THREE.Group {
  const cap = new THREE.Group();
  const r = HEAD_R * 1.035;
  cap.add(part(new THREE.SphereGeometry(r, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.35), m));
  // Back half (z < 0): three.js puts phi = π…2π behind the head.
  cap.add(part(new THREE.SphereGeometry(r * 0.995, 36, 20, Math.PI, Math.PI, 0, Math.PI * 0.62), m));
  return cap;
}

function buildHair(cfg: AvatarConfig, hairCol: string): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, HEAD_Y, 0);
  const m = mat(hairCol);
  const hair = cfg.hair;
  if (hair === 'hair_bald') return g;
  if (hair === 'hair_afro') {
    const afro = part(new THREE.SphereGeometry(0.62, 32, 24), m);
    afro.position.set(0, 0.2, -0.1);
    afro.scale.set(1, 0.9, 0.92);
    g.add(afro);
    return g;
  }
  // Every other style starts from a close cap of hair.
  g.add(hairCap(m));
  // Ridges and rings: a visible lighter tone even on black hair.
  const lc = new THREE.Color(hairCol).lerp(new THREE.Color('#8A7466'), 0.45);
  const light = mat(`#${lc.getHexString()}`);
  if (hair === 'hair_waves') {
    for (let i = 1; i <= 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1 * i, 0.012, 6, 32), light);
      ring.rotation.x = -Math.PI / 2 - 0.18;
      ring.position.set(0, 0.42 - i * 0.025, -0.05);
      g.add(ring);
    }
  } else if (hair === 'hair_cornrows') {
    // Rows running from the hairline over the top to the nape.
    for (let i = -3; i <= 3; i++) {
      const geo = new THREE.TorusGeometry(HEAD_R * 1.075, 0.026, 6, 30, Math.PI * 0.78);
      geo.rotateZ(-Math.PI * 0.1);
      const row = new THREE.Mesh(geo, light);
      row.rotation.y = Math.PI / 2;
      row.position.x = i * 0.085;
      row.scale.set(1, 1 - Math.abs(i) * 0.05, 1 - Math.abs(i) * 0.05);
      g.add(row);
    }
  } else if (hair === 'hair_braids' || hair === 'hair_locs') {
    const n = hair === 'hair_braids' ? 18 : 12;
    const len = hair === 'hair_braids' ? 0.95 : 0.55;
    const r = hair === 'hair_braids' ? 0.028 : 0.042;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 0.2 + (i / (n - 1)) * Math.PI * 1.6;
      const strand = part(new THREE.CapsuleGeometry(r, len, 4, 8), m, false);
      strand.position.set(Math.cos(a) * HEAD_R * 0.98, -len / 2 + 0.05, -Math.abs(Math.sin(a)) * HEAD_R * 0.9 - 0.02);
      if (Math.sin(a) < 0) strand.position.z = Math.sin(a) * HEAD_R * 0.98;
      g.add(strand);
    }
  } else if (hair === 'hair_bantu') {
    // Knots sitting on the surface of the cap, in a ring around the crown plus one on top.
    const spots = [...Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), -1];
    for (const a of spots) {
      const dir = a < 0 ? new THREE.Vector3(0, 1, -0.15) : new THREE.Vector3(Math.cos(a) * 0.62, 0.72, Math.sin(a) * 0.62 - 0.1);
      dir.normalize().multiplyScalar(HEAD_R * 1.08);
      g.add(at(part(new THREE.SphereGeometry(0.085, 14, 10), m), dir.x, dir.y, dir.z));
    }
  } else if (hair === 'hair_puff') {
    g.add(at(part(new THREE.SphereGeometry(0.26, 24, 18), m), 0, 0.42, -0.18));
  } else if (hair === 'hair_frontal') {
    for (const s of [-1, 1]) {
      const side = part(new THREE.BoxGeometry(0.12, 0.85, 0.32), mat(shade(hairCol, 1.1)));
      side.position.set(s * 0.39, -0.3, -0.04);
      g.add(side);
    }
    g.add(at(part(new THREE.BoxGeometry(0.72, 0.9, 0.12), m), 0, -0.3, -0.36));
  } else if (hair === 'hair_mohawk') {
    for (let i = 0; i < 5; i++) {
      const spike = part(new THREE.SphereGeometry(0.09, 12, 10), m);
      spike.scale.set(0.6, 1.4, 1);
      spike.position.set(0, 0.44 - Math.abs(i - 1.5) * 0.04, 0.22 - i * 0.13);
      g.add(spike);
    }
  }
  return g;
}

function buildHeadwear(cfg: AvatarConfig, topCol: string): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, HEAD_Y, 0);
  const hw = cfg.headwear;
  if (hw === 'hw_fila') {
    const m = mat(topCol);
    // Abeti-aja style: a soft round cap whose top folds over to one side.
    const cap = part(new THREE.CylinderGeometry(0.42, 0.45, 0.2, 28), m);
    cap.position.set(0, 0.3, -0.02);
    g.add(cap);
    const fold = part(new THREE.SphereGeometry(0.3, 20, 14), mat(shade(topCol, 0.88)));
    fold.scale.set(1.25, 0.42, 1);
    fold.position.set(0.12, 0.42, -0.02);
    fold.rotation.z = -0.35;
    g.add(fold);
    const ear = part(new THREE.SphereGeometry(0.14, 14, 10), mat(shade(topCol, 0.8)));
    ear.scale.set(0.5, 1, 0.9);
    ear.position.set(0.44, 0.32, 0);
    g.add(ear);
  } else if (hw === 'hw_cap') {
    const m = mat(topCol);
    g.add(at(part(hairShell(HEAD_R * 1.08, 0.48), m), 0, 0.02, 0));
    const brim = part(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24, 1, false, -Math.PI / 2, Math.PI), m);
    brim.position.set(0, 0.16, 0.3);
    brim.scale.set(1, 1, 0.9);
    g.add(brim);
  } else if (hw === 'hw_hijab') {
    const m = mat(topCol);
    const shell = new THREE.SphereGeometry(HEAD_R * 1.12, 36, 24, Math.PI * 0.25, Math.PI * 1.5);
    const h = part(shell, m);
    h.rotation.y = Math.PI;
    g.add(h);
    const drape = part(new THREE.CylinderGeometry(0.34, 0.5, 0.42, 28, 1, true), m);
    drape.position.set(0, -0.42, -0.02);
    g.add(drape);
  } else if (hw === 'hw_gele' || hw === 'hw_gele_gold') {
    const gold = hw === 'hw_gele_gold';
    const color = gold ? '#D4A017' : topCol;
    const m = mat(color, gold ? { emissive: '#5A4300' } : {});
    g.add(at(part(new THREE.TorusGeometry(HEAD_R * 0.98, 0.07, 10, 32), m), 0, 0.18, -0.02)).children.at(-1)!.rotation.set(Math.PI / 2 - 0.2, 0, 0);
    // The folds fanning up and back.
    for (let i = 0; i < 7; i++) {
      const fold = part(new THREE.SphereGeometry(0.26, 18, 12), mat(shade(color, 0.85 + (i % 2) * 0.25), gold ? { emissive: '#3A2C00' } : {}));
      const a = -0.9 + i * 0.3;
      fold.scale.set(0.35, 1, 0.75);
      fold.position.set(Math.sin(a) * 0.32, 0.42 + Math.cos(a) * 0.12, -0.1 - Math.cos(a) * 0.05);
      fold.rotation.z = -a;
      g.add(fold);
    }
  } else if (hw === 'hw_crown') {
    const coral = mat('#C8323A');
    const goldM = mat('#D4A017', { emissive: '#4A3500' });
    g.add(at(part(new THREE.CylinderGeometry(0.22, 0.4, 0.5, 24), coral), 0, 0.5, -0.02));
    g.add(at(part(new THREE.SphereGeometry(0.09, 12, 10), goldM), 0, 0.8, -0.02));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), goldM), Math.cos(a) * 0.31, 0.38 + (i % 2) * 0.12, Math.sin(a) * 0.31 - 0.02));
    }
    for (let i = -3; i <= 3; i++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), coral);
      strand.position.set(i * 0.07, 0.12, 0.36);
      g.add(strand);
    }
  }
  return g;
}

function limb(r: number, len: number, m: THREE.Material, outline = true): THREE.Group {
  return part(new THREE.CapsuleGeometry(r, len, 6, 12), m, outline);
}

function buildBody(cfg: AvatarConfig, color: ColorOf): { body: THREE.Group; chest: THREE.Object3D } {
  const g = new THREE.Group();
  const skin = color(cfg.skin, '#8D5E42');
  const skinM = mat(skin);
  const b = BUILDS[cfg.body] ?? BUILDS.body_regular;
  const topCol = color(cfg.topColor, '#0E8A3E');
  const botCol = color(cfg.bottomColor, '#1F3A8A');
  const top = cfg.top;
  const bottom = cfg.bottom;

  const topMap =
    top === 'top_ankara' ? ankaraTex(topCol) : top === 'top_lace' ? laceTex(topCol) : top === 'top_eagles' ? eaglesTex() : undefined;
  const topM = mat(top === 'top_eagles' ? '#FFFFFF' : topCol, topMap ? { map: topMap } : {});
  const botM = mat(botCol, bottom === 'bottom_jeans' ? { map: jeansTex(botCol) } : {});

  // Legs
  const legsCovered = bottom === 'bottom_trousers' || bottom === 'bottom_jeans';
  for (const s of [-1, 1]) {
    const x = s * (b.hipW * 0.45);
    const upper = limb(b.legR, KNEE_Y - 0.12, legsCovered || bottom === 'bottom_shorts' ? botM : skinM);
    upper.position.set(x, (HIP_Y + KNEE_Y) / 2, 0);
    g.add(upper);
    const lower = limb(b.legR * 0.92, KNEE_Y - 0.18, legsCovered ? botM : skinM);
    lower.position.set(x, KNEE_Y / 2 + 0.06, 0);
    g.add(lower);
  }
  if (bottom === 'bottom_wrapper' || bottom === 'bottom_skirt') {
    const long = bottom === 'bottom_wrapper';
    const skirt = part(new THREE.CylinderGeometry(b.hipW * 0.95, b.hipW * (long ? 1.25 : 1.35), long ? 0.72 : 0.42, 28), botM);
    skirt.position.set(0, long ? 0.48 : 0.66, 0);
    g.add(skirt);
  }

  // Shoes
  const shoeCol = cfg.shoes === 'shoes_loafers' ? '#3A2418' : cfg.shoes === 'shoes_slippers' ? shade(topCol, 0.8) : '#F4F4F4';
  for (const s of [-1, 1]) {
    const x = s * (b.hipW * 0.45);
    const shoe = part(new THREE.SphereGeometry(0.11, 18, 12), mat(shoeCol));
    shoe.scale.set(0.95, cfg.shoes === 'shoes_slippers' ? 0.35 : 0.6, 1.5);
    shoe.position.set(x, 0.06, 0.05);
    g.add(shoe);
    if (cfg.shoes === 'shoes_sneakers' || cfg.shoes === 'shoes_glow') {
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.3), mat(cfg.shoes === 'shoes_glow' ? '#3DF2E0' : topCol, cfg.shoes === 'shoes_glow' ? { emissive: '#3DF2E0' } : {}));
      sole.position.set(x, 0.02, 0.05);
      g.add(sole);
    }
    if (cfg.shoes === 'shoes_slippers') g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 16, Math.PI), mat(topCol)), x, 0.06, 0.08));
  }

  // Torso
  const torsoLen = SHOULDER_Y - WAIST_Y - 0.12;
  const torso = part(new THREE.CapsuleGeometry(b.torsoW, torsoLen, 8, 20), topM);
  torso.scale.set(1, 1, 0.72);
  torso.position.set(0, (SHOULDER_Y + WAIST_Y) / 2 + 0.02, 0);
  g.add(torso);
  // Hips
  const hips = part(new THREE.SphereGeometry(b.hipW, 22, 16), legsCovered || bottom === 'bottom_shorts' ? botM : bottom.startsWith('bottom_') ? botM : topM);
  hips.scale.set(1, 0.5, 0.72);
  hips.position.set(0, HIP_Y + 0.02, 0);
  g.add(hips);

  // Long garments over the legs
  if (top === 'top_kaftan' || top === 'top_senator' || top === 'top_agbada') {
    const len = top === 'top_senator' ? 0.55 : 0.85;
    const robe = part(new THREE.CylinderGeometry(b.torsoW * 1.02, b.torsoW * (top === 'top_agbada' ? 1.9 : 1.25), len, 30), topM);
    robe.scale.z = 0.8;
    robe.position.set(0, WAIST_Y + 0.15 - len / 2, 0);
    g.add(robe);
    const trim = mat('#D4A017');
    if (top === 'top_senator') {
      for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.02), trim), s * 0.07, 1.05, b.torsoW * 0.73));
    }
    if (top === 'top_agbada' || top === 'top_kaftan') {
      const neckTrim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 20), trim);
      neckTrim.rotation.x = Math.PI / 2 - 0.4;
      neckTrim.position.set(0, SHOULDER_Y - 0.02, 0.12);
      g.add(neckTrim);
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.02), trim), 0, 1.07, b.torsoW * 0.74));
    }
  }
  if (top === 'top_blouse') {
    const peplum = part(new THREE.CylinderGeometry(b.torsoW * 0.95, b.torsoW * 1.35, 0.14, 26), topM);
    peplum.scale.z = 0.78;
    peplum.position.set(0, WAIST_Y - 0.02, 0);
    g.add(peplum);
  }
  if (top === 'top_hoodie') {
    const hood = part(new THREE.TorusGeometry(0.2, 0.07, 10, 22, Math.PI), topM);
    hood.position.set(0, SHOULDER_Y + 0.02, -0.12);
    hood.rotation.x = -Math.PI / 2 + 0.3;
    g.add(hood);
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.02), mat(shade(topCol, 0.85))), 0, 0.98, b.torsoW * 0.73));
  }
  if (top === 'top_shirt') {
    for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat('#FFFFFF')), 0, 1.24 - i * 0.1, b.torsoW * 0.73));
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 18), topM);
    collar.rotation.x = Math.PI / 2 - 0.3;
    collar.position.set(0, SHOULDER_Y + 0.01, 0.08);
    g.add(collar);
  }
  if (top === 'top_eagles') {
    const v = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 18, Math.PI), mat('#FFFFFF'));
    v.rotation.set(Math.PI / 2 - 0.4, 0, Math.PI);
    v.position.set(0, SHOULDER_Y - 0.02, 0.12);
    g.add(v);
  }

  // Neck
  g.add(at(part(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 16), skinM, false), 0, SHOULDER_Y + 0.08, 0));

  // Arms: sleeves in the top's material, hands in skin.
  const longSleeve = ['top_shirt', 'top_kaftan', 'top_hoodie', 'top_senator', 'top_agbada', 'top_lace'].includes(top);
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * (b.torsoW + b.armR * 0.6), SHOULDER_Y - 0.06, 0);
    arm.rotation.z = s * 0.14;
    const upper = limb(b.armR, 0.22, top === 'top_agbada' ? topM : longSleeve || top !== 'top_blouse' ? topM : skinM);
    upper.position.y = -0.16;
    arm.add(upper);
    const fore = limb(b.armR * 0.9, 0.2, longSleeve ? topM : skinM);
    fore.position.y = -0.42;
    arm.add(fore);
    arm.add(at(part(new THREE.SphereGeometry(b.armR * 1.15, 14, 10), skinM), 0, -0.6, 0.01));
    if (top === 'top_agbada') {
      // The wide flowing sleeves.
      const wing = part(new THREE.BoxGeometry(0.34, 0.62, 0.05), topM);
      wing.position.set(s * 0.12, -0.32, 0);
      wing.rotation.z = s * 0.12;
      arm.add(wing);
    }
    g.add(arm);
  }

  // Neckwear
  if (cfg.neck === 'neck_beads') {
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 0.1 + (i / 13) * Math.PI * 0.8;
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), mat('#C8323A')), Math.cos(a) * 0.15, SHOULDER_Y - 0.02 - Math.sin(a) * 0.05, Math.sin(a) * 0.14 + 0.02));
    }
  } else if (cfg.neck === 'neck_chain') {
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 30, Math.PI), mat('#D4A017', { emissive: '#4A3500' }));
    chain.rotation.set(Math.PI / 2 - 0.5, 0, Math.PI);
    chain.position.set(0, SHOULDER_Y - 0.02, 0.06);
    g.add(chain);
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat('#D4A017', { emissive: '#4A3500' })), 0, SHOULDER_Y - 0.17, b.torsoW * 0.72));
  }

  return { body: g, chest: torso };
}

function buildGlasses(cfg: AvatarConfig): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, HEAD_Y, 0);
  if (cfg.glasses === 'gl_round') {
    const m = mat('#2A2A2A');
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 24), m), s * 0.145, 0.05, 0.42));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.012), m), 0, 0.07, 0.43));
  } else if (cfg.glasses === 'gl_shades') {
    const lens = mat('#111111', { emissive: '#1B2A44' });
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), lens);
      l.scale.set(1.15, 0.75, 0.3);
      l.position.set(s * 0.145, 0.05, 0.42);
      g.add(l);
    }
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.02), mat('#111111')), 0, 0.09, 0.42));
  }
  return g;
}

export type BuiltAvatar = { root: THREE.Group; eyes: THREE.Object3D[]; chest: THREE.Object3D; head: THREE.Group };

/** The whole figure for a config. `color` turns item ids into colours (from the catalogue). */
export function buildAvatar(cfg: AvatarConfig, color: ColorOf): BuiltAvatar {
  const root = new THREE.Group();
  const skin = color(cfg.skin, '#8D5E42');
  const hairCol = color(cfg.hairColor, '#15110F');
  const topCol = color(cfg.topColor, '#0E8A3E');
  const { body, chest } = buildBody(cfg, color);
  root.add(body);
  const headGroup = new THREE.Group();
  const { head, eyes } = buildHead(cfg, skin, hairCol);
  headGroup.add(head);
  const coversHair = cfg.headwear === 'hw_hijab' || cfg.headwear === 'hw_crown' || cfg.headwear === 'hw_gele' || cfg.headwear === 'hw_gele_gold';
  if (!coversHair || cfg.headwear === 'hw_gele' || cfg.headwear === 'hw_gele_gold') {
    // Gele sits on top of short hair; hijab and crown hide it.
    if (!coversHair) {
      const hair = buildHair(cfg, hairCol);
      // Stretch the close cap like the head, but keep long styles (braids, locs) their length.
      const [sx, sy, sz] = faceScale(cfg);
      hair.children[0]?.scale.set(sx, sy, sz);
      headGroup.add(hair);
    }
  }
  headGroup.add(buildHeadwear(cfg, topCol));
  headGroup.add(buildGlasses(cfg));
  root.add(headGroup);
  return { root, eyes, chest, head: headGroup };
}

/** Free GPU memory for a figure that is no longer shown (shared textures are kept). */
export function disposeAvatar(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const x of mats) if (x !== OUTLINE) x.dispose();
  });
}
