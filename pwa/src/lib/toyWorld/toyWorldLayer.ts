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
 *
 * Where OpenStreetMap has no outlines (much of Nigeria), filler buildings line the real roads
 * (fill.ts, owner 2026-10-16). Real outlines always win.
 *
 * Street life in 3D (owner, 2026-10-16): the living map's figures (same real roads, same
 * time-of-day and weather rules) are drawn as low-poly models: danfos, kekes, okadas, cars,
 * people, kids and the football; palm trees grow on the empty lots. A little larger than life
 * (AGENT_SCALE) so they read on a phone, like a toy world.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as maplibregl from 'maplibre-gl';
import { openings, orientedBox, planBuilding, ringArea, roofTriangles, type Pt } from './shapes';
import { fillAlongRoads, type Road } from './fill';
import { ballModel, brtModel, carModel, danfoModel, kekeModel, okadaModel, palmModel, personModel, VARIANT_COLOURS } from './models';
import { livingAgents } from '@/lib/livingRegistry';
import type { AgentKind } from '@/lib/livingMap';
import { hash01 } from './shapes';
import { createBillboards } from './billboards';
import { TOY_LAYER_ID, toyDarkOf, type ToyBillboard, type ToyWorldLayer } from './constants';

export { TOY_LAYER_ID, type ToyWorldLayer } from './constants';

const MIN_ZOOM = 15;
/** Rebuild when the map centre moves this far from where the scene was built. */
const REBUILD_M = 220;
/** Figures a bit larger than life so they read on a phone. */
const AGENT_SCALE = 3.2;
/** A 12 m bus at full toy scale would be nearly 40 m long, so long models are scaled down. */
const KIND_SCALE: Partial<Record<AgentKind, number>> = { brt: 0.55 };
const CAPACITY: Record<AgentKind, number> = { danfo: 150, keke: 150, okada: 150, car: 250, brt: 30, person: 500, kid: 60, ball: 6 };

/**
 * Where each vehicle's lamps sit, in model metres (front is +x): half its length, how far
 * apart the two headlamps are (0 = one lamp in the middle) and how high.
 */
const LAMPS: Partial<Record<AgentKind, { half: number; apart: number; y: number }>> = {
  danfo: { half: 2.5, apart: 0.75, y: 0.95 },
  car: { half: 2.1, apart: 0.65, y: 0.8 },
  keke: { half: 1.1, apart: 0, y: 0.85 },
  okada: { half: 0.9, apart: 0, y: 0.95 },
  brt: { half: 6, apart: 0.95, y: 1.0 },
};
const LAMP_CAPACITY = Object.entries(LAMPS).reduce((n, [k]) => n + CAPACITY[k as AgentKind], 0);

type Built = { origin: maplibregl.MercatorCoordinate; scale: number; count: number };


/**
 * `lite` (low-end phones, M-16): a smaller circle of models and no antialiasing, so a cheap
 * Android keeps up.
 */
export function createToyWorldLayer({ lite = false }: { lite?: boolean } = {}): ToyWorldLayer {
  const RADIUS_M = lite ? 300 : 450;
  const MAX_BUILDINGS = lite ? 350 : 700;
  let map: maplibregl.Map | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const group = new THREE.Group();
  scene.add(group);

  // Bright and clean, like the owner's reference: strong ambient, warm sun, cool fill.
  const ambient = new THREE.AmbientLight('#FFFFFF', 0.95);
  const sun = new THREE.DirectionalLight('#FFF6E6', 1.15);
  sun.position.set(-60, 120, 80);
  const fill = new THREE.DirectionalLight('#DCE8FF', 0.4);
  fill.position.set(80, 60, -60);
  scene.add(ambient, sun, fill);

  const solid = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#1D2433', transparent: true, opacity: 0.13, depthWrite: false });
  const windowMat = new THREE.MeshLambertMaterial({ color: '#2B3A55', emissive: '#000000' });
  const doorMat = new THREE.MeshLambertMaterial({ color: '#7A5233' });

  let built: Built | null = null;
  let dark = 0;
  let timer = 0;

  // Moving figures: one instanced mesh per kind, filled every frame from the living map.
  const lifeMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const lifeGroup = new THREE.Group();
  scene.add(lifeGroup);
  const geoms: Record<AgentKind, THREE.BufferGeometry> = {
    danfo: danfoModel(),
    keke: kekeModel(),
    okada: okadaModel(),
    car: carModel(),
    brt: brtModel(),
    person: personModel(1.7),
    kid: personModel(1.25),
    ball: ballModel(),
  };
  const life = {} as Record<AgentKind, THREE.InstancedMesh>;
  for (const kind of Object.keys(geoms) as AgentKind[]) {
    const mesh = new THREE.InstancedMesh(geoms[kind], lifeMat, CAPACITY[kind]);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    const palette = VARIANT_COLOURS[kind] ?? ['#FFFFFF'];
    for (let i = 0; i < CAPACITY[kind]; i++) mesh.setColorAt(i, new THREE.Color(palette[0]));
    life[kind] = mesh;
    lifeGroup.add(mesh);
  }
  // Night lights: unlit (always bright) head and tail lamps, and a soft pool of light on
  // the road ahead. Shown from dusk with the sky (setDark), like the 2D street life.
  const headMat = new THREE.MeshBasicMaterial({ color: '#FFF4C8' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#FF2A2A' });
  const beamMat = new THREE.MeshBasicMaterial({
    color: '#FFE7A0',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const lampGeo = new THREE.BoxGeometry(0.12, 0.2, 0.32);
  const beamGeo = new THREE.BufferGeometry();
  // A widening wedge on the ground, starting at the bumper (x = 0) and reaching 4 m ahead.
  beamGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0.04, -0.6, 4, 0.04, -1.6, 4, 0.04, 1.6, 0, 0.04, -0.6, 4, 0.04, 1.6, 0, 0.04, 0.6], 3),
  );
  const lampMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, cap: number) => {
    const mesh = new THREE.InstancedMesh(geo, mat, cap);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    lifeGroup.add(mesh);
    return mesh;
  };
  const heads = lampMesh(lampGeo, headMat, LAMP_CAPACITY * 2);
  const tails = lampMesh(lampGeo, tailMat, LAMP_CAPACITY * 2);
  const beams = lampMesh(beamGeo, beamMat, LAMP_CAPACITY);
  const tmpL = new THREE.Matrix4();
  const tmpO = new THREE.Matrix4();

  const billboards = createBillboards();
  scene.add(billboards.root);

  const palmGeo = palmModel();
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpP = new THREE.Vector3();
  const tmpS = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const UP = new THREE.Vector3(0, 1, 0);

  const updateLife = () => {
    if (!map || !built) return;
    const counts = {} as Record<AgentKind, number>;
    for (const k of Object.keys(life) as AgentKind[]) counts[k] = 0;
    const { origin, scale } = built;
    const lightsOn = dark > 0.4;
    let nHead = 0;
    let nTail = 0;
    let nBeam = 0;
    const lamp = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number) => {
      tmpL.multiplyMatrices(tmpM, tmpO.makeTranslation(x, y, z));
      mesh.setMatrixAt(i, tmpL);
    };
    for (const a of livingAgents(map)) {
      const mesh = life[a.kind];
      if (!mesh || counts[a.kind] >= CAPACITY[a.kind]) continue;
      const m = maplibregl.MercatorCoordinate.fromLngLat(a.pos, 0);
      const x = (m.x - origin.x) / scale;
      const z = (m.y - origin.y) / scale;
      if (Math.hypot(x, z) > RADIUS_M + 150) continue;
      // Map bearing (clockwise from north) to a turn about "up"; models face +x.
      tmpQ.setFromAxisAngle(UP, Math.PI / 2 - (a.bearing * Math.PI) / 180);
      tmpP.set(x, 0, z);
      tmpS.setScalar(AGENT_SCALE * (KIND_SCALE[a.kind] ?? 1));
      tmpM.compose(tmpP, tmpQ, tmpS);
      const i = counts[a.kind]++;
      mesh.setMatrixAt(i, tmpM);
      const palette = VARIANT_COLOURS[a.kind] ?? ['#FFFFFF'];
      mesh.setColorAt(i, tmpC.set(palette[a.variant % palette.length]));

      const spec = lightsOn ? LAMPS[a.kind] : undefined;
      if (spec) {
        const sides = spec.apart ? [-spec.apart, spec.apart] : [0];
        for (const zOff of sides) {
          lamp(heads, nHead++, spec.half + 0.04, spec.y, zOff);
          lamp(tails, nTail++, -spec.half - 0.04, spec.y, zOff);
        }
        lamp(beams, nBeam++, spec.half, 0, 0);
      }
    }
    for (const [mesh, n] of [[heads, nHead], [tails, nTail], [beams, nBeam]] as const) {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const k of Object.keys(life) as AgentKind[]) {
      const mesh = life[k];
      mesh.count = counts[k];
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  };

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

    // Fill empty streets: real roads, kept clear of real buildings, water, parks and pitches.
    const lineOf = (coords: number[][]) => coords.map(([lng, lat]) => toLocal(lng, lat));
    const near = (pts: Pt[]) => pts.some((p) => Math.hypot(p.x, p.z) < RADIUS_M + 60);
    const roads: Road[] = [];
    for (const f of map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' })) {
      const cls = String((f.properties as { class?: string } | null)?.class ?? '');
      const g = f.geometry;
      const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      for (const l of lines) {
        const pts = lineOf(l as number[][]);
        if (pts.length > 1 && near(pts)) roads.push({ pts, cls });
      }
    }
    const open: Pt[][] = [];
    const addPolys = (layer: string, keep: (cls: string) => boolean) => {
      for (const f of map!.querySourceFeatures('openmaptiles', { sourceLayer: layer })) {
        if (!keep(String((f.properties as { class?: string } | null)?.class ?? ''))) continue;
        const g = f.geometry;
        const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const poly of polys) {
          const ring = lineOf(poly[0] as number[][]);
          if (ring.length > 2 && near(ring)) open.push(ring);
        }
      }
    };
    addPolys('water', () => true);
    addPolys('park', () => true);
    addPolys('landuse', (c) => ['pitch', 'playground', 'stadium', 'cemetery', 'grass', 'school'].includes(c));
    const realRings = [...byId.values()].map((b) => b.ring);
    const trees: Pt[] = [];
    const fillers = fillAlongRoads(roads, realRings, open, RADIUS_M, Math.max(0, MAX_BUILDINGS - byId.size), trees);
    for (const f of fillers) byId.set(f.id, { ring: f.ring, area: ringArea(f.ring), height: null });

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

    // Palm trees on the empty lots.
    if (trees.length) {
      const palms = new THREE.InstancedMesh(palmGeo, solid, trees.length);
      trees.forEach((t, i) => {
        const r = hash01(`${Math.round(t.x)}:${Math.round(t.z)}`);
        tmpQ.setFromAxisAngle(UP, r * Math.PI * 2);
        tmpM.compose(tmpP.set(t.x, 0, t.z), tmpQ, tmpS.setScalar(1.2 + r * 0.6));
        palms.setMatrixAt(i, tmpM);
      });
      palms.renderOrder = 2;
      group.add(palms);
    }

    built = { origin, scale, count: feats.length };
    // How many buildings were modelled (read by tests and handy when checking an area's map data).
    document.documentElement.dataset.toyBuildings = String(Math.min(n, MAX_BUILDINGS));
    applyDark();
    map.triggerRepaint();
  };

  const applyDark = () => {
    ambient.intensity = 0.95 - 0.6 * dark;
    sun.intensity = 1.15 * (1 - dark) + 0.08;
    sun.color.set(dark > 0.5 ? '#9DB4FF' : '#FFF3DC');
    beamMat.opacity = Math.min(0.32, Math.max(0, (dark - 0.4) * 0.8));
    billboards.setDark(dark);
    // Lit windows at night.
    windowMat.color.set(dark > 0.5 ? '#FFD27A' : '#2B3A55');
    windowMat.emissive.set(dark > 0.5 ? '#B8860B' : '#000000');
  };

  const onIdle = () => {
    if (!map) return;
    // Tells the page's CSS to hide the 2D billboards while the 3D ones stand in their place.
    const show = map.getZoom() >= MIN_ZOOM;
    map.getContainer().dataset.toy3d = show ? 'on' : 'off';
    if (!show) {
      group.visible = false;
      lifeGroup.visible = false;
      billboards.root.visible = false;
      return;
    }
    group.visible = true;
    lifeGroup.visible = true;
    billboards.root.visible = true;
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
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: !lite });
      // Lighting as the sky says now (the layer may load after the sky has set it).
      dark = toyDarkOf(m);
      applyDark();
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
      for (const mesh of Object.values(life)) mesh.geometry.dispose();
      lampGeo.dispose();
      beamGeo.dispose();
      billboards.dispose();
      delete m.getContainer().dataset.toy3d;
      palmGeo.dispose();
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
      if (map) billboards.update(map, origin, scale, camera.projectionMatrix);
      updateLife();
      renderer.resetState();
      renderer.render(scene, camera);
    },
    setBillboards(list: ToyBillboard[]) {
      billboards.set(list);
      map?.triggerRepaint();
    },
    pickBillboard(point) {
      if (!map || !billboards.root.visible) return null;
      const c = map.getCanvas();
      return billboards.pick(point, c.clientWidth, c.clientHeight);
    },
    setDark(d: number) {
      dark = d;
      applyDark();
      map?.triggerRepaint();
    },
  };
}
