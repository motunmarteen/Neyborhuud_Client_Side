/**
 * Shows a 3D avatar: drag to turn it, a gentle idle (breathing, blinking, a slow look
 * around), and a head-and-shoulders snapshot for the map and profiles.
 */

import * as THREE from 'three';
import { buildAvatar, disposeAvatar, type AvatarConfig, type BuiltAvatar, type ColorOf } from './build';

function lights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x9cc9a2, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 3);
  scene.add(sun);
}

export type Stage = {
  setAvatar: (cfg: AvatarConfig) => void;
  dispose: () => void;
};

export function createStage(canvas: HTMLCanvasElement, color: ColorOf, opts: { still?: boolean } = {}): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
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
      if (!opts.still) {
        built.chest.scale.y = 1 + Math.sin(t * 2) * 0.012;
        built.head.rotation.y = Math.sin(t * 0.7) * 0.08;
        built.head.position.y = Math.sin(t * 2) * 0.006;
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
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      if (built) disposeAvatar(built.root);
      renderer.dispose();
    },
  };
}

/** A 256×256 PNG of the head and shoulders on a soft round background (for map pins and profiles). */
export function renderPortrait(cfg: AvatarConfig, color: ColorOf, size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  lights(scene);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), new THREE.MeshBasicMaterial({ color: 0xe8f7ec }));
  disc.position.set(0, 1.6, -1);
  scene.add(disc);
  const built = buildAvatar(cfg, color);
  built.root.rotation.y = 0.25;
  scene.add(built.root);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.78, 3.3);
  camera.lookAt(0, 1.62, 0);
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  disposeAvatar(built.root);
  renderer.dispose();
  return url;
}
