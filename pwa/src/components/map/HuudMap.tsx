'use client';

/**
 * HuudMap — the base of the map home (tracker Phase 3, M-01).
 *
 * MapLibre with the NeyborHuud style (real OpenStreetMap streets from OpenFreeMap, Home
 * Concept colours) and 3D buildings you can tilt and turn (M-02). Calm mode (reduced motion,
 * Data Saver, "Save data") keeps it flat. Later steps add the sky (M-03..M-06) and pins
 * (M-07..M-09); screens get the map through onReady.
 */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HUUD_MAP_STYLE } from '@/lib/huudMapStyle';
import { ensureMaplibreWorker } from '@/lib/maplibreWorker';
import { NIGERIA_BOUNDS } from '@/lib/nigeriaView';
import { isCalm } from '@/lib/calmMode';

export type LngLat = { lat: number; lng: number };


type HuudMapProps = {
  center?: LngLat;
  zoom?: number;
  /** Accessible name for the map region. */
  label?: string;
  className?: string;
  /** Called once the map and its style have loaded. */
  onReady?: (map: maplibregl.Map) => void;
  /** Start tilted toward the horizon (street views). Ignored in calm mode. */
  tilt?: boolean;
  /** Small compass to reset north and tilt. */
  compass?: boolean;
  /** Where the compass sits (the sky scene keeps the top clear). */
  compassPosition?: 'top-right' | 'bottom-right';
  /**
   * Map home only (owner, 2026-10-15, "immersive"): once per visit the camera swoops down from
   * the sky onto the street, then slowly circles until the person touches the map.
   * Never in calm mode.
   */
  cinematic?: boolean;
};

const INTRO_KEY = 'nh_map_intro_done';
/** Slow circling speed after the swoop, degrees per second. */
const ORBIT_DEG_PER_S = 2.2;

/** Without a centre the map fits all of Nigeria; screens pass the person's area (startView). */
export function HuudMap({ center, zoom = 15.5, label = 'Map of your area', className = '', onReady, tilt = true, compass = true, compassPosition = 'top-right', cinematic = false }: HuudMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: maplibregl.Map;
    const calm = isCalm();
    try {
      ensureMaplibreWorker();
      map = new maplibregl.Map({
        container: containerRef.current,
        style: HUUD_MAP_STYLE,
        ...(center
          ? { center: [center.lng, center.lat] as [number, number], zoom }
          : { bounds: NIGERIA_BOUNDS, fitBoundsOptions: { padding: 16 } }),
        minZoom: 4,
        maxZoom: 19,
        maxPitch: 70,
        // Street views start tilted toward the horizon, like the mockup; calm mode stays flat.
        pitch: center && tilt && !calm ? 60 : 0,
        bearing: center && tilt && !calm ? -12 : 0,
        attributionControl: { compact: true },
        // Two fingers: pinch to zoom, twist to turn, drag up/down to tilt.
        dragRotate: !calm,
        pitchWithRotate: !calm,
        touchPitch: !calm,
      });
    } catch {
      // WebGL missing (very old phones): show a plain message instead of a blank box.
      setFailed(true);
      return;
    }
    if (calm) map.touchZoomRotate.disableRotation();
    if (compass && !calm) {
      map.addControl(new maplibregl.NavigationControl({ showZoom: false, showCompass: true, visualizePitch: true }), compassPosition);
    }
    mapRef.current = map;
    map.on('load', () => {
      // Calm mode: flat footprints only (lighter on old phones and data).
      if (calm && map.getLayer('building-3d')) map.setLayoutProperty('building-3d', 'visibility', 'none');
      onReady?.(map);
      if (cinematic && center && tilt && !calm) startCinematic(map, zoom);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; centre and zoom changes go through the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div role="img" aria-label={label} className={`grid place-items-center bg-[#B9D99B] p-6 text-center text-sm font-bold text-navy ${className}`}>
        This phone cannot draw the map. Your area&apos;s updates are still in the feed.
      </div>
    );
  }

  return <div ref={containerRef} role="region" aria-label={label} className={`relative ${className}`} />;
}

/** Swoop down from the sky once per visit, then circle slowly until the person touches the map. */
function startCinematic(map: maplibregl.Map, zoom: number) {
  let firstTime = true;
  try {
    firstTime = sessionStorage.getItem(INTRO_KEY) !== '1';
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* storage blocked: play it */
  }
  let raf = 0;
  let stopped = false;
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    for (const ev of ['mousedown', 'touchstart', 'wheel', 'dragstart'] as const) map.off(ev, stop);
  };
  for (const ev of ['mousedown', 'touchstart', 'wheel', 'dragstart'] as const) map.on(ev, stop);

  const orbit = () => {
    let last = performance.now();
    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      map.setBearing(map.getBearing() + ORBIT_DEG_PER_S * dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  if (!firstTime) {
    orbit();
    return;
  }
  const target = map.getCenter();
  map.jumpTo({ zoom: Math.max(zoom - 4, 9), pitch: 0, bearing: -70 });
  map.flyTo({ center: target, zoom, pitch: 60, bearing: -12, duration: 4200, curve: 1.4, essential: true });
  map.once('moveend', () => {
    if (!stopped) orbit();
  });
}
