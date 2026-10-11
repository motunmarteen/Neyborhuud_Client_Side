import type * as maplibregl from 'maplibre-gl';
import { HUUD_MAP_COLORS as DAY } from '@/lib/huudMapStyle';

/**
 * Night on the map (tracker M-06). As the sky darkens (SkyState.dark, 0 day … 1 night) the
 * map's own colours move to a night palette inside MapLibre, so lights can glow on top:
 * windows light up in the 3D buildings and street lamps glow along the roads.
 * (A dark wash over the whole map would dim the lights too.)
 */

const NIGHT = {
  ground: '#1D2840',
  block: '#243049',
  park: '#1F3734',
  wood: '#1A302C',
  sand: '#363846',
  water: '#13304A',
  roadMajor: '#56607C',
  roadMid: '#4C5674',
  roadMinor: '#424C69',
  roadEdge: '#2B3450',
  path: '#363F58',
  building: '#2D3552',
  buildingLine: '#232A43',
  label: '#E8ECF5',
  labelMuted: '#B4BDD0',
  halo: '#141A2D',
  water_label: '#9FC4D8',
};

/** Buildings darken toward night; after dark their walls show windows (some lit). */
const WALL_NIGHT = '#2F3655';
const WINDOWS = 'nh-windows';

/** A small tile of windows, about two in five lit warm yellow, drawn once on a canvas. */
function ensureWindows(map: maplibregl.Map) {
  if (map.hasImage(WINDOWS) || typeof document === 'undefined') return;
  const size = 32;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return;
  g.fillStyle = WALL_NIGHT;
  g.fillRect(0, 0, size, size);
  // 4 x 4 windows; a fixed lit/dark layout so the pattern does not flicker.
  const lit = [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1];
  for (let i = 0; i < 16; i++) {
    const x = (i % 4) * 8 + 2;
    const y = Math.floor(i / 4) * 8 + 2;
    g.fillStyle = lit[i] ? '#F7CB72' : '#3B4268';
    g.fillRect(x, y, 4, 5);
  }
  map.addImage(WINDOWS, g.getImageData(0, 0, size, size), { pixelRatio: 2 });
}

function mix(a: string, b: string, t: number): string {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const x = p(a);
  const y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Layer → [paint property, palette key]. Only the base colours; widths and filters stay. */
const PAINT: [string, string, keyof typeof NIGHT][] = [
  ['background', 'background-color', 'ground'],
  ['landuse-built', 'fill-color', 'block'],
  ['landcover-sand', 'fill-color', 'sand'],
  ['park', 'fill-color', 'park'],
  ['water', 'fill-color', 'water'],
  ['waterway', 'line-color', 'water'],
  ['building', 'fill-color', 'building'],
  ['building', 'fill-outline-color', 'buildingLine'],
  ['path', 'line-color', 'path'],
  ['road-minor-casing', 'line-color', 'roadEdge'],
  ['road-mid-casing', 'line-color', 'roadEdge'],
  ['road-major-casing', 'line-color', 'roadEdge'],
  ['road-minor', 'line-color', 'roadMinor'],
  ['road-mid', 'line-color', 'roadMid'],
  ['road-major', 'line-color', 'roadMajor'],
  ['road-name', 'text-color', 'labelMuted'],
  ['road-name', 'text-halo-color', 'halo'],
  ['poi', 'text-color', 'labelMuted'],
  ['poi', 'text-halo-color', 'halo'],
  ['place-neighbourhood', 'text-color', 'labelMuted'],
  ['place-neighbourhood', 'text-halo-color', 'halo'],
  ['place-town', 'text-color', 'label'],
  ['place-town', 'text-halo-color', 'halo'],
  ['water-name', 'text-color', 'water_label'],
  ['water-name', 'text-halo-color', 'halo'],
];

const DAY_OF: Record<keyof typeof NIGHT, string> = {
  ground: DAY.ground,
  block: DAY.block,
  park: DAY.park,
  wood: DAY.wood,
  sand: DAY.sand,
  water: DAY.water,
  roadMajor: DAY.roadMajor,
  roadMid: DAY.roadMid,
  roadMinor: DAY.roadMinor,
  roadEdge: DAY.roadEdge,
  path: DAY.path,
  building: DAY.building,
  buildingLine: DAY.buildingLine,
  label: DAY.label,
  labelMuted: DAY.labelMuted,
  halo: '#F4F9EE',
  water_label: '#2F6F70',
};

/** Street lamps: warm glows at the points along streets (circle layer on road vertices). */
function ensureLamps(map: maplibregl.Map) {
  if (map.getLayer('street-lamps')) return;
  const before = map.getLayer('building-3d') ? 'building-3d' : undefined;
  map.addLayer(
    {
      id: 'street-lamps',
      type: 'circle',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 15,
      filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'minor', 'trunk'], true, false],
      paint: {
        'circle-color': '#FFD27A',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 2.5, 17, 6, 19, 12],
        'circle-blur': 1,
        'circle-opacity': 0,
      },
    },
    before,
  );
}

/** Apply the light of the hour to the map. Cheap enough to call every minute. */
export function applyMapLight(map: maplibregl.Map, dark: number) {
  const t = Math.min(1, Math.max(0, dark));
  for (const [layer, prop, key] of PAINT) {
    if (!map.getLayer(layer)) continue;
    map.setPaintProperty(layer, prop as Parameters<maplibregl.Map['setPaintProperty']>[1], mix(DAY_OF[key], NIGHT[key], t));
  }
  if (map.getLayer('landcover-green')) {
    map.setPaintProperty('landcover-green', 'fill-color', ['match', ['get', 'class'], 'wood', mix(DAY.wood, NIGHT.wood, t), mix(DAY.park, NIGHT.park, t)]);
  }
  // Buildings: roofs darken through dusk; after dark the walls show windows, some lit.
  if (map.getLayer('building-3d')) {
    const roof = (day: string) => mix(day, WALL_NIGHT, t);
    map.setPaintProperty('building-3d', 'fill-extrusion-color', [
      'match', ['%', ['to-number', ['id'], 0], 3],
      0, roof(DAY.roofZinc),
      1, roof(DAY.roofTerracotta),
      roof(DAY.roofCream),
    ]);
    if (t >= 0.55) {
      ensureWindows(map);
      if (map.hasImage(WINDOWS)) map.setPaintProperty('building-3d', 'fill-extrusion-pattern', WINDOWS);
    } else {
      map.setPaintProperty('building-3d', 'fill-extrusion-pattern', undefined);
    }
  }
  // Street lamps come on from dusk.
  ensureLamps(map);
  const lamps = Math.max(0, (t - 0.3) / 0.7);
  map.setPaintProperty('street-lamps', 'circle-opacity', lamps * 0.85);
  map.setLayoutProperty('street-lamps', 'visibility', lamps > 0 ? 'visible' : 'none');
}
