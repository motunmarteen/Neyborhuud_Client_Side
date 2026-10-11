import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';

/**
 * The NeyborHuud map style (tracker M-01; owner chose OpenFreeMap, 2026-10-11).
 *
 * Real OpenStreetMap streets, water, parks and buildings from OpenFreeMap's vector tiles
 * (free, no key, OpenMapTiles schema), drawn in the Home Concept mockup's exact palette:
 * green ground, soft built-up blocks, grey roads with white edges, teal lagoon, cream buildings.
 * Labels in Noto Sans (draws Yoruba, Igbo and Hausa letters), English name first.
 *
 * Moving to our own copy later (S3 + CloudFront) only changes TILES_URL and GLYPHS_URL.
 */

const TILES_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Home Concept map palette (from the mockup's illustrated map). */
export const HUUD_MAP_COLORS = {
  ground: '#B9D99B',
  block: '#D3E6BE',
  park: '#7DC266',
  wood: '#66AE53',
  sand: '#EDE3CF',
  water: '#4FA3A5',
  roadMajor: '#8E98A7',
  roadMid: '#9AA3B1',
  roadMinor: '#B4BCC7',
  roadEdge: '#F4F9EE',
  path: '#EDE3CF',
  building: '#F1EBDD',
  buildingLine: '#D9CFB8',
  label: '#1D2433',
  labelMuted: '#3E4757',
  halo: 'rgba(244,249,238,0.95)',
  boundary: '#5B6478',
} as const;

const C = HUUD_MAP_COLORS;
const name: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
const REGULAR = ['Noto Sans Regular'];
const BOLD = ['Noto Sans Bold'];
const ITALIC = ['Noto Sans Italic'];

const roadClass = (classes: string[]): ExpressionSpecification => ['match', ['get', 'class'], classes, true, false];
const MAJOR = ['motorway', 'trunk', 'primary'];
const MID = ['secondary', 'tertiary'];
const MINOR = ['minor', 'service', 'track', 'raceway'];

/** Road width by zoom, scaled for the class. */
const width = (base: number): ExpressionSpecification => [
  'interpolate', ['exponential', 1.5], ['zoom'],
  10, base * 0.25,
  14, base * 1.2,
  17, base * 4.5,
  20, base * 16,
];

export const HUUD_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'NeyborHuud',
  glyphs: GLYPHS_URL,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: TILES_URL,
      attribution:
        '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': C.ground } },

    // Land use: built-up blocks, sand, parks, woods
    {
      id: 'landuse-built',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['match', ['get', 'class'], ['residential', 'suburb', 'neighbourhood', 'commercial', 'retail', 'industrial', 'school', 'university', 'hospital', 'railway'], true, false],
      paint: { 'fill-color': C.block },
    },
    {
      id: 'landcover-sand',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['sand', 'beach'], true, false],
      paint: { 'fill-color': C.sand },
    },
    {
      id: 'landcover-green',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['grass', 'wood', 'farmland', 'wetland'], true, false],
      paint: { 'fill-color': ['match', ['get', 'class'], 'wood', C.wood, C.park], 'fill-opacity': 0.7 },
    },
    { id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.8 } },

    // Water: lagoon, creeks, canals
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': C.water } },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': C.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 16, 3] },
    },

    // Buildings (flat here; 3D extrusion is M-02)
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: { 'fill-color': C.building, 'fill-outline-color': C.buildingLine },
    },

    // Roads: casing (edge) under the fill, so streets read clearly on green
    {
      id: 'path',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 15,
      filter: roadClass(['path']),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.path, 'line-width': width(0.8), 'line-dasharray': [2, 1] },
    },
    {
      id: 'road-minor-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 13,
      filter: roadClass(MINOR),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadEdge, 'line-width': width(1.5), 'line-gap-width': 0 },
    },
    {
      id: 'road-mid-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: roadClass(MID),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadEdge, 'line-width': width(2.6) },
    },
    {
      id: 'road-major-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: roadClass(MAJOR),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadEdge, 'line-width': width(3.6) },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 13,
      filter: roadClass(MINOR),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadMinor, 'line-width': width(1.1) },
    },
    {
      id: 'road-mid',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: roadClass(MID),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadMid, 'line-width': width(2.1) },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: roadClass(MAJOR),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadMajor, 'line-width': width(3) },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: roadClass(['rail', 'transit']),
      paint: { 'line-color': C.roadMajor, 'line-width': 1.5, 'line-dasharray': [3, 2] },
    },

    // State and LGA boundaries, faint
    {
      id: 'boundary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['<=', ['get', 'admin_level'], 6],
      paint: { 'line-color': C.boundary, 'line-width': 1, 'line-dasharray': [4, 3], 'line-opacity': 0.5 },
    },

    // Labels
    {
      id: 'water-name',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      layout: { 'text-field': name, 'text-font': ITALIC, 'text-size': 12 },
      paint: { 'text-color': '#2F6F70', 'text-halo-color': C.halo, 'text-halo-width': 1.2 },
    },
    {
      id: 'road-name',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      minzoom: 14,
      layout: {
        'symbol-placement': 'line',
        'text-field': name,
        'text-font': REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 13],
        'text-max-angle': 30,
      },
      paint: { 'text-color': C.labelMuted, 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
    },
    {
      id: 'poi',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 16,
      filter: ['<=', ['get', 'rank'], 20],
      layout: { 'text-field': name, 'text-font': REGULAR, 'text-size': 11, 'text-max-width': 8, 'text-optional': true },
      paint: { 'text-color': C.labelMuted, 'text-halo-color': C.halo, 'text-halo-width': 1.2 },
    },
    {
      id: 'place-neighbourhood',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 12,
      filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
      layout: {
        'text-field': name,
        'text-font': BOLD,
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 14],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.08,
        'text-max-width': 8,
      },
      paint: { 'text-color': C.labelMuted, 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
    },
    {
      id: 'place-town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['match', ['get', 'class'], ['city', 'town', 'village'], true, false],
      layout: { 'text-field': name, 'text-font': BOLD, 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 12, 14, 18], 'text-max-width': 8 },
      paint: { 'text-color': C.label, 'text-halo-color': C.halo, 'text-halo-width': 2 },
    },
  ],
};
