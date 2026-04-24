'use client';

/**
 * GeofenceMap — Leaflet-based interactive map for geofence management.
 *
 * Features:
 *  — Displays all user geofences as labelled circles
 *  — Color-coded by zone type (green / amber / red)
 *  — Clicking the map fires onMapClick(lat, lng) to prefill the creation form
 *  — Shows a "pending" circle preview while the user is editing radius / position
 *  — Tooltips show geofence name + status on hover
 *
 * Must be loaded via next/dynamic({ ssr: false }) to avoid SSR window errors.
 */

import { useEffect, useRef } from 'react';
import type { Geofence, GeofenceType } from '@/services/safety.service';

// Leaflet is loaded at runtime — we avoid the "window is not defined" SSR error
// by importing dynamically inside useEffect.

const TYPE_COLORS: Record<GeofenceType, string> = {
  safe_zone: '#22c55e',
  alert_zone: '#f59e0b',
  restricted_zone: '#ef4444',
};

const TYPE_FILL: Record<GeofenceType, string> = {
  safe_zone: '#22c55e',
  alert_zone: '#f59e0b',
  restricted_zone: '#ef4444',
};

interface Props {
  geofences: Geofence[];
  onMapClick?: (lat: number, lng: number) => void;
  pendingPin?: { lat: number; lng: number } | null;
  pendingRadius?: number;
  pendingType?: GeofenceType;
}

export default function GeofenceMap({
  geofences,
  onMapClick,
  pendingPin,
  pendingRadius = 200,
  pendingType = 'safe_zone',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pendingCircleRef = useRef<any>(null);
  const pendingMarkerRef = useRef<any>(null);
  const fenceLayersRef = useRef<any[]>([]);

  // ── Initial map setup ────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import — prevents SSR crash
    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapRef.current) return; // Already initialised

      // Default centre: Lagos, Nigeria
      const map = L.map(containerRef.current!, {
        center: [6.5244, 3.3792],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw geofences ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Remove old fence layers
      fenceLayersRef.current.forEach((layer) => layer.remove());
      fenceLayersRef.current = [];

      for (const fence of geofences) {
        const color = TYPE_COLORS[fence.type] ?? '#6b7280';
        const fill = TYPE_FILL[fence.type] ?? '#6b7280';

        const circle = L.circle([fence.latitude, fence.longitude], {
          radius: fence.radiusMeters,
          color,
          fillColor: fill,
          fillOpacity: 0.15,
          weight: 2,
        })
          .addTo(mapRef.current)
          .bindTooltip(
            `<strong>${fence.label}</strong><br/>${(fence.type ?? 'unknown').replace(/_/g, ' ')} · ${fence.radiusMeters}m<br/>Status: ${fence.lastStatus ?? 'unknown'}`,
            { sticky: true },
          );

        // Small pin at centre
        const marker = L.circleMarker([fence.latitude, fence.longitude], {
          radius: 5,
          color,
          fillColor: color,
          fillOpacity: 1,
          weight: 1,
        }).addTo(mapRef.current);

        fenceLayersRef.current.push(circle, marker);
      }
    });
  }, [geofences]);

  // ── Pending preview circle ────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Remove old pending layers
      if (pendingCircleRef.current) {
        pendingCircleRef.current.remove();
        pendingCircleRef.current = null;
      }
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }

      if (!pendingPin) return;

      const color = TYPE_COLORS[pendingType] ?? '#6b7280';

      pendingCircleRef.current = L.circle([pendingPin.lat, pendingPin.lng], {
        radius: pendingRadius,
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '6 4',
      }).addTo(mapRef.current);

      pendingMarkerRef.current = L.circleMarker([pendingPin.lat, pendingPin.lng], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 1,
        weight: 2,
      }).addTo(mapRef.current);

      // Pan map to the pending pin
      mapRef.current.panTo([pendingPin.lat, pendingPin.lng]);
    });
  }, [pendingPin, pendingRadius, pendingType]);

  return (
    <>
      {/* Leaflet CSS loaded inline to avoid FOUC */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={containerRef}
        className="h-80 w-full bg-gray-800"
      />
    </>
  );
}
