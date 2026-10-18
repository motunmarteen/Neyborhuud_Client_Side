/**
 * Shows a 3D avatar: drag to turn it, a gentle idle (breathing, blinking, a slow look
 * around), and a head-and-shoulders snapshot for the map and profiles.
 */

import * as THREE from 'three';
import { buildAvatar, disposeAvatar, poseAvatar, type AvatarConfig, type BuiltAvatar, type ColorOf, type PoseId } from './build';

function lights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x9cc9a2, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 3);
  scene.add(sun);
}

/**
 * One shared off-screen renderer for portraits and stickers. Phones (iPhone above all) allow
 * only a few WebGL contexts and silently take one away from the oldest when more are made;
 * a new renderer per sticker (33 of them) used to kill the studio's own view (owner 2026-10-18).
 */
let shared: { renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement } | null = null;
function offscreen(size: number) {
  if (!shared || shared.renderer.getContext().isContextLost()) {
    shared?.renderer.dispose();
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    shared = { renderer, canvas };
  }
  shared.renderer.setPixelRatio(1);
  shared.renderer.setSize(size, size, false);
  shared.renderer.setClearColor(0x000000, 0);
  shared.renderer.clear();
  return shared;
}

export type Stage = {
  setAvatar: (cfg: AvatarConfig) => void;
  setPose: (pose: PoseId) => void;
  dispose: () => void;
};

export function createStage(
  canvas: HTMLCanvasElement,
  color: ColorOf,
  opts: { still?: boolean; /** The phone took the 3D view away (memory, app in background): rebuild it. */ onLost?: () => void } = {},
): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  const lost = (e: Event) => {
    e.preventDefault();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  lights(scene);
  // A soft round shadow under the feet.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), new THREE.MeshBasicMaterial({ color: 0x1d2433, transparent: true, opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  // Room above the head for tall headwear (gele, crown).
  camera.position.set(0, 1.4, 6.3);
  camera.lookAt(0, 1.22, 0);

  let built: BuiltAvatar | null = null;
  let pose: PoseId = 'idle';
  let yaw = 0.35;
  let dragging = false;
  let lastX = 0;
  let raf = 0;
  const t0 = performance.now();
  let nextBlink = t0 + 2500;

  const resize = () => {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 360;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const down = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  };
  const up = () => {
    dragging = false;
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (built) {
      const t = (now - t0) / 1000;
      built.root.rotation.y = yaw + (opts.still || dragging ? 0 : Math.sin(t * 0.4) * 0.12);
      poseAvatar(built, pose, opts.still ? 0.3 : t);
      if (!opts.still) {
        built.chest.scale.y = 1 + Math.sin(t * 2) * 0.012;
        built.head.rotation.y = Math.sin(t * 0.7) * 0.08;
        built.head.position.y += Math.sin(t * 2) * 0.006 - (built.head.userData.lastBob ?? 0);
        built.head.userData.lastBob = Math.sin(t * 2) * 0.006;
        const blinking = now > nextBlink && now < nextBlink + 130;
        for (const e of built.eyes) e.scale.y = blinking ? 0.1 : 1;
        if (now > nextBlink + 130) nextBlink = now + 2500 + Math.random() * 2500;
      }
    }
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    setAvatar(cfg) {
      if (built) {
        scene.remove(built.root);
        disposeAvatar(built.root);
      }
      built = buildAvatar(cfg, color);
      scene.add(built.root);
    },
    setPose(p) {
      pose = p;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('webglcontextlost', lost);
      if (built) disposeAvatar(built.root);
      renderer.dispose();
      // Hand the context back now instead of waiting for garbage collection.
      renderer.forceContextLoss();
    },
  };
}

/** A 256×256 PNG of the head and shoulders on a soft round background (for map pins and profiles). */
export function renderPortrait(cfg: AvatarConfig, color: ColorOf, size = 256, pose: PoseId = 'idle'): string {
  const { renderer, canvas } = offscreen(size);
  const scene = new THREE.Scene();
  lights(scene);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), new THREE.MeshBasicMaterial({ color: 0xe8f7ec }));
  disc.position.set(0, 1.6, -1);
  scene.add(disc);
  const built = buildAvatar(cfg, color);
  built.root.rotation.y = 0.25;
  poseAvatar(built, pose, 0.3);
  scene.add(built.root);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.78, 3.3);
  camera.lookAt(0, 1.62, 0);
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  disposeAvatar(built.root);
  return url;
}

/**
 * A sticker: the avatar in a pose (head to knees) with a bold caption, 512×512 PNG with a
 * transparent background, ready to share or send in a chat.
 */
export function renderSticker(cfg: AvatarConfig, color: ColorOf, pose: PoseId, caption: string, size = 512, ribbon = '#00B82E'): string {
  const { renderer, canvas: gl } = offscreen(size);
  const scene = new THREE.Scene();
  lights(scene);
  const built = buildAvatar(cfg, color);
  built.root.rotation.y = 0.2;
  poseAvatar(built, pose, 0.35);
  scene.add(built.root);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.5, 4.1);
  camera.lookAt(0, 1.38, 0);
  renderer.render(scene, camera);

  // Compose: soft white outline around the figure, then the caption on a ribbon.
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const g = out.getContext('2d')!;
  g.filter = 'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 2px #ffffff) drop-shadow(0 4px 10px rgba(29,36,51,0.25))';
  g.drawImage(gl, 0, -size * 0.04);
  g.filter = 'none';
  if (caption) {
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    let fs = size * 0.11;
    g.font = `900 ${fs}px ${font}`;
    while (g.measureText(caption).width > size * 0.86 && fs > size * 0.06) {
      fs -= 2;
      g.font = `900 ${fs}px ${font}`;
    }
    const w = g.measureText(caption).width + size * 0.08;
    const h = fs * 1.45;
    const x = (size - w) / 2;
    const y = size - h - size * 0.03;
    g.save();
    g.translate(size / 2, y + h / 2);
    g.rotate(-0.05);
    g.translate(-size / 2, -(y + h / 2));
    g.fillStyle = ribbon;
    g.strokeStyle = '#FFFFFF';
    g.lineWidth = size * 0.014;
    g.beginPath();
    g.roundRect(x, y, w, h, h / 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#FFFFFF';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(caption, size / 2, y + h / 2 + fs * 0.04);
    g.restore();
  }
  const url = out.toDataURL('image/png');
  disposeAvatar(built.root);
  return url;
}

export type DuoMode = 'none' | 'i_wave' | 'they_wave' | 'hug' | 'close_wave';

/** Where each avatar stands, which way it faces and what it does, per mode (me on the left). */
const DUO: Record<DuoMode, { gap: number; me: PoseId; them: PoseId; face: number }> = {
  none: { gap: 1.3, me: 'idle', them: 'idle', face: 0.5 },
  i_wave: { gap: 1.3, me: 'wave', them: 'idle', face: 0.65 },
  they_wave: { gap: 1.3, me: 'idle', them: 'waveL', face: 0.65 },
  close_wave: { gap: 0.62, me: 'wave', them: 'waveL', face: 0.85 },
  hug: { gap: 0.34, me: 'hug', them: 'hug', face: 1.25 },
};

export type DuoStage = {
  set: (me: AvatarConfig, them: AvatarConfig, mode: DuoMode) => void;
  dispose: () => void;
};

/**
 * Two avatars on one stage (owner 2026-10-18): follow someone and your avatar waves at them
 * from afar; they follow you and theirs waves at you; follow each other and they walk over
 * and hug (two men or two women) or come close and wave. One WebGL context for both.
 */
export function createDuoStage(canvas: HTMLCanvasElement, color: ColorOf, opts: { still?: boolean; onLost?: () => void } = {}): DuoStage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const lost = (e: Event) => {
    e.preventDefault();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);
  const scene = new THREE.Scene();
  lights(scene);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0x1d2433, transparent: true, opacity: 0.07 }));
  floor.rotation.x = -Math.PI / 2;
  floor.scale.y = 0.35;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(28, 2, 0.1, 50);
  camera.position.set(0, 1.35, 7.2);
  camera.lookAt(0, 1.1, 0);

  let me: BuiltAvatar | null = null;
  let them: BuiltAvatar | null = null;
  let mode: DuoMode = 'none';
  let gap = DUO.none.gap; // current half-distance, eased towards the mode's
  let raf = 0;
  const t0 = performance.now();
  let last = t0;

  const resize = () => {
    const w = canvas.clientWidth || 340;
    const h = canvas.clientHeight || 170;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const place = (b: BuiltAvatar, x: number, face: number, pose: PoseId, t: number) => {
    b.root.position.x = x;
    b.root.rotation.y = face;
    poseAvatar(b, pose, t);
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const t = opts.still ? 0.3 : (now - t0) / 1000;
    const d = DUO[mode];
    // Walk at a steady pace (same on a fast or slow phone), about a second across.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const step = opts.still ? Infinity : 0.9 * dt;
    const diff = d.gap - gap;
    gap = Math.abs(diff) <= step ? d.gap : gap + Math.sign(diff) * step;
    const walking = gap !== d.gap;
    if (me) place(me, -gap, d.face, walking ? 'walk' : d.me, t);
    if (them) place(them, gap, -d.face, walking ? 'walk' : d.them, t + 0.4);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  const swap = (old: BuiltAvatar | null, cfg: AvatarConfig) => {
    if (old) {
      scene.remove(old.root);
      disposeAvatar(old.root);
    }
    const b = buildAvatar(cfg, color);
    scene.add(b.root);
    return b;
  };
  let lastMe = '';
  let lastThem = '';

  return {
    set(meCfg, themCfg, m) {
      const a = JSON.stringify(meCfg);
      const b = JSON.stringify(themCfg);
      if (a !== lastMe) {
        me = swap(me, meCfg);
        lastMe = a;
      }
      if (b !== lastThem) {
        them = swap(them, themCfg);
        lastThem = b;
      }
      mode = m;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      if (me) disposeAvatar(me.root);
      if (them) disposeAvatar(them.root);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
