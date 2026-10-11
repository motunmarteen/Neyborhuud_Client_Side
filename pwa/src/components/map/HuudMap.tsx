'use client';

/**
 * HuudMap — the base of the map home (tracker Phase 3, M-01).
 *
 * MapLibre with the NeyborHuud style (real OpenStreetMap streets from OpenFreeMap, Home
 * Concept colours). Later steps add 3D buildings (M-02), the sky (M-03..M-06) and pins
 * (M-07..M-09) on top; screens get the map through onReady.
 */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HUUD_MAP_STYLE } from '@/lib/huudMapStyle';
import { ensureMaplibreWorker } from '@/lib/maplibreWorker';
import { NIGERIA_BOUNDS } from '@/lib/nigeriaView';

export type LngLat = { lat: number; lng: number };


type HuudMapProps = {
  center?: LngLat;
  zoom?: number;
  /** Accessible name for the map region. */
  label?: string;
  className?: string;
  /** Called once the map and its style have loaded. */
  onReady?: (map: maplibregl.Map) => void;
};

/** Without a centre the map fits all of Nigeria; screens pass the person's area (startView). */
export function HuudMap({ center, zoom = 15.5, label = 'Map of your area', className = '', onReady }: HuudMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: maplibregl.Map;
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
        attributionControl: { compact: true },
        // No rotation or tilt until M-02 adds 3D buildings.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
    } catch {
      // WebGL missing (very old phones): show a plain message instead of a blank box.
      setFailed(true);
      return;
    }
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    map.on('load', () => onReady?.(map));
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
