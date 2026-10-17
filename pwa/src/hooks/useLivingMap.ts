'use client';

/**
 * Runs the living map (M-17) on a MapLibre map: reads the real roads, paths, pitches and
 * markets in view from the map's own data, fills them with life for the moment (hour,
 * weather), and moves everyone ~20 times a second. Rebuilt when the map stops moving.
 *
 * Off in calm mode and when zoomed out (street life is only readable up close). Paused
 * while the tab is hidden. Vehicles sit under the 3D buildings in the drawing order, so
 * a building in front hides the car behind it.
 */

import { useEffect, useRef } from 'react';
import type * as maplibregl from 'maplibre-gl';
import { populate, rng, step, type Agent, type Jam, type LngLat, type Scene } from '@/lib/livingMap';
import { ensureLivingSprites } from '@/lib/livingSprites';
import { registerLiving, unregisterLiving } from '@/lib/livingRegistry';

/** The toy-world 3D layer draws the figures as models when it is on (see toyWorldLayer). */
const TOY_LAYER = 'toy-world';

const SOURCE = 'living';
const MIN_ZOOM = 15;
const FRAME_MS = 50;
const VEHICLES = new Set(['car', 'danfo', 'keke', 'okada', 'brt']);

type Options = {
  hour: number;
  weather: string | null | undefined;
  dark: number;
  enabled: boolean;
  /** Reported go-slows (M-10): traffic crawls and queues there. */
  jams?: Jam[];
};

type Feature = GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString | GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.Point>;

function lines(f: Feature): LngLat[][] {
  const g = f.geometry;
  if (g.type === 'LineString') return [g.coordinates as LngLat[]];
  if (g.type === 'MultiLineString') return g.coordinates as LngLat[][];
  return [];
}

function polygonCentre(f: Feature): { centre: LngLat; radius: number } | null {
  const g = f.geometry;
  const ring = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : null;
  if (!ring?.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const centre: LngLat = [(minX + maxX) / 2, (minY + maxY) / 2];
  const radius = (Math.max(maxX - minX, maxY - minY) * 111_320) / 2;
  return { centre, radius };
}

/** The real street around the view, from the map's own vector tiles. */
function readScene(map: maplibregl.Map): Scene {
  const b = map.getBounds();
  const inView = (p: LngLat) => p[0] >= b.getWest() && p[0] <= b.getEast() && p[1] >= b.getSouth() && p[1] <= b.getNorth();
  const touches = (path: LngLat[]) => path.some(inView);

  const tr = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' }) as unknown as Feature[];
  const roads: LngLat[][] = [];
  const walkways: LngLat[][] = [];
  const busways: LngLat[][] = [];
  for (const f of tr) {
    const cls = String(f.properties?.class ?? '');
    for (const path of lines(f)) {
      if (!touches(path)) continue;
      // Expressways too: that is where most Lagos go-slows are.
      if (['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'].includes(cls)) roads.push(path);
      if (['minor', 'service', 'path', 'track'].includes(cls)) walkways.push(path);
      if (cls === 'busway' || cls === 'bus_guideway') busways.push(path);
    }
  }

  const pitches: Scene['pitches'] = [];
  const lu = map.querySourceFeatures('openmaptiles', { sourceLayer: 'landuse' }) as unknown as Feature[];
  for (const f of lu) {
    const cls = String(f.properties?.class ?? '');
    if (!['pitch', 'playground', 'stadium'].includes(cls)) continue;
    const c = polygonCentre(f);
    if (c && inView(c.centre)) pitches.push(c);
  }
  const parks = map.querySourceFeatures('openmaptiles', { sourceLayer: 'park' }) as unknown as Feature[];
  for (const f of parks) {
    const c = polygonCentre(f);
    if (c && inView(c.centre) && c.radius > 25 && pitches.length < 2) pitches.push(c);
  }

  const markets: LngLat[] = [];
  const poi = map.querySourceFeatures('openmaptiles', { sourceLayer: 'poi' }) as unknown as Feature[];
  for (const f of poi) {
    const sub = String(f.properties?.subclass ?? '');
    const name = String(f.properties?.name ?? '').toLowerCase();
    if (f.geometry.type !== 'Point') continue;
    if (sub === 'marketplace' || /\bmarket\b|\boja\b|\bkasuwa\b|\bahia\b/.test(name)) {
      const p = f.geometry.coordinates as LngLat;
      if (inView(p)) markets.push(p);
    }
  }
  return { roads, busways, walkways, pitches, markets };
}

function toGeoJSON(agents: Agent[], night: boolean): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: agents.map((a) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: a.pos },
      properties: {
        icon: `${a.kind}-${a.variant}${night && VEHICLES.has(a.kind) ? '-night' : ''}`,
        bearing: a.bearing,
        vehicle: VEHICLES.has(a.kind),
      },
    })),
  };
}

function ensureLayers(map: maplibregl.Map) {
  if (map.getSource(SOURCE)) return;
  ensureLivingSprites(map);
  map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const before = map.getLayer('building-3d') ? 'building-3d' : undefined;
  // Vehicles lie on the road and turn with it.
  map.addLayer(
    {
      id: 'living-vehicles',
      type: 'symbol',
      source: SOURCE,
      filter: ['==', ['get', 'vehicle'], true],
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        // Bold enough to see on a phone (owner: like Lagos Life's lively street).
        'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 1.2, 16, 1.6, 17, 2.2, 19, 3.6],
      },
    },
    before,
  );
  // People stand up and face you.
  map.addLayer(
    {
      id: 'living-people',
      type: 'symbol',
      source: SOURCE,
      filter: ['==', ['get', 'vehicle'], false],
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 1.1, 16, 1.5, 17, 2, 19, 3.2],
      },
    },
    before,
  );
}

export function useLivingMap(map: maplibregl.Map | null, { hour, weather, dark, enabled, jams }: Options) {
  const agents = useRef<Agent[]>([]);
  const mood = useRef({ hour, weather, dark, jams });
  mood.current = { hour, weather, dark, jams };

  useEffect(() => {
    if (!map) return;
    const clear = () => {
      agents.current = [];
      const src = map.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
      src?.setData({ type: 'FeatureCollection', features: [] });
    };
    if (!enabled) {
      clear();
      return;
    }
    ensureLayers(map);
    registerLiving(map, () => agents.current);
    let showingIcons = true;

    const rebuild = () => {
      if (map.getZoom() < MIN_ZOOM) {
        clear();
        return;
      }
      const scene = readScene(map);
      const c = map.getCenter();
      const seed = Math.floor(c.lng * 1000) * 31 + Math.floor(c.lat * 1000);
      // Fewer figures when zoomed in on a small patch, so it never looks crowded.
      const density = Math.min(1, Math.max(0.35, (map.getZoom() < 16.5 ? 1 : 0.7)));
      agents.current = populate(scene, { hour: mood.current.hour, weather: mood.current.weather, density, jams: mood.current.jams }, seed);
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const r = rng(7);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.visibilityState !== 'visible') {
        last = now;
        return;
      }
      acc += now - last;
      last = now;
      if (acc < FRAME_MS) return;
      const dt = Math.min(acc, 250) / 1000;
      acc = 0;
      if (!agents.current.length) return;
      step(agents.current, dt, r, mood.current.jams);
      // With the 3D scene on, the figures are 3D models: hide the flat icons, just redraw.
      const toy = !!map.getLayer(TOY_LAYER);
      if (toy === showingIcons) {
        showingIcons = !toy;
        for (const id of ['living-vehicles', 'living-people']) {
          if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', toy ? 'none' : 'visible');
        }
      }
      if (toy) {
        map.triggerRepaint();
        return;
      }
      const src = map.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
      src?.setData(toGeoJSON(agents.current, mood.current.dark > 0.55));
    };

    // Tiles arrive after the first idle; build once the street is drawn, then on each move.
    const onIdle = () => {
      if (!agents.current.length) rebuild();
    };
    let timer: number | undefined;
    const onMoveEnd = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(rebuild, 300);
    };
    map.on('idle', onIdle);
    map.on('moveend', onMoveEnd);
    rebuild();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      map.off('idle', onIdle);
      map.off('moveend', onMoveEnd);
      unregisterLiving(map);
      clear();
    };
  }, [map, enabled]);

  // A new hour, the weather or a new go-slow report changes how busy the street is.
  const hourBucket = Math.floor(hour * 2) / 2;
  const jamKey = (jams ?? []).map((j) => `${j.centre.join(',')}:${j.strength.toFixed(1)}`).join(';');
  useEffect(() => {
    if (!map || !enabled || map.getZoom() < MIN_ZOOM) return;
    map.fire('moveend');
  }, [map, enabled, hourBucket, weather, jamKey]);
}
