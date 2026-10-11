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
};

/** Without a centre the map fits all of Nigeria; screens pass the person's area (startView). */
export function HuudMap({ center, zoom = 15.5, label = 'Map of your area', className = '', onReady, tilt = true, compass = true, compassPosition = 'top-right' }: HuudMapProps) {
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
        maxPitch: 65,
        // Street views start tilted toward the horizon, like the mockup; calm mode stays flat.
        pitch: center && tilt && !calm ? 55 : 0,
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
