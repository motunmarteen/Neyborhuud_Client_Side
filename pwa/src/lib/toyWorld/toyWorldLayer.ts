/**
 * Toy-world 3D layer (owner, 2026-10-16: buildings "like WareTrack ... or something better").
 *
 * A three.js scene drawn inside MapLibre (custom layer, same WebGL context). Around the map's
 * centre it turns every real OpenStreetMap building footprint into a styled low-poly model:
 * kiosks, bungalows with zinc / terracotta hip or gable roofs, houses, storey buildings,
 * plazas with shop fronts, warehouses with sawtooth roofs and taller blocks where OSM knows
 * the height. Windows and doors on the long sides, soft shadows on the ground, lit windows at
 * night. Only near the centre (RADIUS) and only from street zoom, so cheap phones cope; calm
 * mode never adds this layer (HuudMap).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as maplibregl from 'maplibre-gl';
import { openings, orientedBox, planBuilding, ringArea, roofTriangles, type Pt } from './shapes';

export const TOY_LAYER_ID = 'toy-world';
const RADIUS_M = 450;
const MAX_BUILDINGS = 700;
const MIN_ZOOM = 15;
/** Rebuild when the map centre moves this far from where the scene was built. */
const REBUILD_M = 220;

type Built = { origin: maplibregl.MercatorCoordinate; scale: number; count: number };

export type ToyWorldLayer = maplibregl.CustomLayerInterface & { setDark: (dark: number) => void };

export function createToyWorldLayer(): ToyWorldLayer {
  let map: maplibregl.Map | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const group = new THREE.Group();
  scene.add(group);

  const ambient = new THREE.AmbientLight('#FFFFFF', 0.62);
  const sun = new THREE.DirectionalLight('#FFF3DC', 0.95);
  sun.position.set(-60, 120, 80);
  const fill = new THREE.DirectionalLight('#DCE8FF', 0.25);
  fill.position.set(80, 60, -60);
  scene.add(ambient, sun, fill);

  const solid = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#1D2433', transparent: true, opacity: 0.13, depthWrite: false });
  const windowMat = new THREE.MeshLambertMaterial({ color: '#2B3A55', emissive: '#000000' });
  const doorMat = new THREE.MeshLambertMaterial({ color: '#7A5233' });

  let built: Built | null = null;
  let dark = 0;
  let timer = 0;

  const clear = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
    }
  };

  const colourise = (geo: THREE.BufferGeometry, hex: string, shadeBottom = false) => {
    const col = new THREE.Color(hex);
    const pos = geo.getAttribute('position');
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // A touch darker at street level: reads like soft ambient shade.
      const k = shadeBottom && pos.getY(i) < 0.01 ? 0.86 : 1;
      colors[i * 3] = col.r * k;
      colors[i * 3 + 1] = col.g * k;
      colors[i * 3 + 2] = col.b * k;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  };

  const build = () => {
    if (!map) return;
    const centre = map.getCenter();
    const origin = maplibregl.MercatorCoordinate.fromLngLat(centre, 0);
    const scale = origin.meterInMercatorCoordinateUnits();
    const toLocal = (lng: number, lat: number): Pt => {
      const m = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
      return { x: (m.x - origin.x) / scale, z: (m.y - origin.y) / scale };
    };

    // Footprints near the centre; tiles cut buildings at their edges, so keep the biggest piece.
    const feats = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' });
    const byId = new Map<string, { ring: Pt[]; area: number; height: number | null }>();
    for (const f of feats) {
      const g = f.geometry;
      const outer =
        g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : null;
      if (!outer || outer.length < 4) continue;
      const ring = outer.slice(0, -1).map(([lng, lat]) => toLocal(lng as number, lat as number));
      const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length;
      const cz = ring.reduce((s, p) => s + p.z, 0) / ring.length;
      if (Math.hypot(cx, cz) > RADIUS_M) continue;
      const area = ringArea(ring);
      if (area < 8) continue;
      const id = String(f.id ?? `${cx.toFixed(1)}:${cz.toFixed(1)}`);
      const rh = Number((f.properties as { render_height?: number } | null)?.render_height);
      const prev = byId.get(id);
      if (!prev || area > prev.area) byId.set(id, { ring, area, height: Number.isFinite(rh) && rh > 9 ? rh : null });
    }

    clear();
    const walls: THREE.BufferGeometry[] = [];
    const roofs: THREE.BufferGeometry[] = [];
    const shadows: THREE.BufferGeometry[] = [];
    const wins: ReturnType<typeof openings> = [];
    let n = 0;
    for (const [id, b] of byId) {
      if (n++ >= MAX_BUILDINGS) break;
      const box = orientedBox(b.ring);
      const rect = b.area / Math.max(1, 4 * box.halfLong * box.halfShort);
      const plan = planBuilding(id, b.area, b.height, rect);

      // Walls: the real footprint pushed up (shape in x / north, then stood upright).
      const shape = new THREE.Shape(b.ring.map((p) => new THREE.Vector2(p.x, -p.z)));
      const wall = new THREE.ExtrudeGeometry(shape, { depth: plan.height, bevelEnabled: false });
      wall.rotateX(-Math.PI / 2);
      wall.deleteAttribute('uv');
      walls.push(colourise(wall, plan.wall, true));

      // Roof over the footprint's box.
      const roof = new THREE.BufferGeometry();
      roof.setAttribute('position', new THREE.Float32BufferAttribute(roofTriangles(box, plan), 3));
      roof.computeVertexNormals();
      roofs.push(colourise(roof, plan.roofColour));

      // Soft shadow on the ground, cast away from the afternoon sun.
      const sh = plan.height * 0.45;
      const shadowShape = new THREE.Shape(b.ring.map((p) => new THREE.Vector2(p.x + sh * 0.6, -(p.z + sh * 0.35))));
      const shadow = new THREE.ShapeGeometry(shadowShape);
      shadow.rotateX(-Math.PI / 2);
      shadow.translate(0, 0.05, 0);
      shadow.deleteAttribute('uv');
      shadows.push(shadow);

      if (rect > 0.82 && plan.kind !== 'kiosk') wins.push(...openings(box, plan, id));
    }

    const add = (geos: THREE.BufferGeometry[], mat: THREE.Material, order: number) => {
      if (!geos.length) return;
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.renderOrder = order;
      group.add(mesh);
    };
    add(shadows, shadowMat, 0);
    add(walls, solid, 1);
    add(roofs, solid, 2);

    // Windows and doors as instanced boxes (one draw each).
    const box = new THREE.BoxGeometry(1, 1, 0.16);
    const winList = wins.filter((w) => !w.door);
    const doorList = wins.filter((w) => w.door);
    const place = (list: typeof wins, mat: THREE.Material) => {
      if (!list.length) return;
      const inst = new THREE.InstancedMesh(box, mat, list.length);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      list.forEach((o, i) => {
        q.setFromAxisAngle(up, -o.angle);
        m.compose(new THREE.Vector3(o.x, o.y, o.z), q, new THREE.Vector3(o.w, o.h, 1));
        inst.setMatrixAt(i, m);
      });
      inst.renderOrder = 3;
      group.add(inst);
    };
    place(winList, windowMat);
    place(doorList, doorMat);

    built = { origin, scale, count: feats.length };
    // How many buildings were modelled (read by tests and handy when checking an area's map data).
    document.documentElement.dataset.toyBuildings = String(Math.min(n, MAX_BUILDINGS));
    applyDark();
    map.triggerRepaint();
  };

  const applyDark = () => {
    ambient.intensity = 0.62 - 0.4 * dark;
    sun.intensity = 0.95 * (1 - dark) + 0.08;
    sun.color.set(dark > 0.5 ? '#9DB4FF' : '#FFF3DC');
    // Lit windows at night.
    windowMat.color.set(dark > 0.5 ? '#FFD27A' : '#2B3A55');
    windowMat.emissive.set(dark > 0.5 ? '#B8860B' : '#000000');
  };

  const onIdle = () => {
    if (!map) return;
    if (map.getZoom() < MIN_ZOOM) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const count = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' }).length;
    if (!built) return build();
    const c = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter(), 0);
    const moved = Math.hypot(c.x - built.origin.x, c.y - built.origin.y) / built.scale;
    if (moved > REBUILD_M || count !== built.count) build();
  };

  return {
    id: TOY_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      map = m;
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
      // The plain extruded blocks are replaced by the models.
      if (m.getLayer('building-3d')) m.setLayoutProperty('building-3d', 'visibility', 'none');
      m.on('idle', onIdle);
      // The opening orbit keeps the camera moving, so the map may never go idle: check often too.
      timer = window.setInterval(onIdle, 1500);
    },
    onRemove(m) {
      m.off('idle', onIdle);
      window.clearInterval(timer);
      clear();
      if (m.getLayer('building-3d')) m.setLayoutProperty('building-3d', 'visibility', 'visible');
      renderer?.dispose();
      renderer = null;
      map = null;
    },
    render(_gl, args) {
      if (!renderer || !built || !group.visible) return;
      const { origin, scale } = built;
      const proj = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix as unknown as number[]);
      const model = new THREE.Matrix4()
        .makeTranslation(origin.x, origin.y, origin.z)
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      camera.projectionMatrix = proj.multiply(model);
      renderer.resetState();
      renderer.render(scene, camera);
    },
    setDark(d: number) {
      dark = d;
      applyDark();
      map?.triggerRepaint();
    },
  };
}
