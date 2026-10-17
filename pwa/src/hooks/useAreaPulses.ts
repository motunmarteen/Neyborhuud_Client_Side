'use client';

/**
 * Area pulses on the map home (tracker M-11, mockup: "live neighbour activity, approximate,
 * never exact homes"). Soft green circles that grow and fade where neighbours have posted
 * or reported in the last two hours. The server only sends ~440 m cells with at least two
 * different people, at the cell's centre, so a pulse never points at a person or a home.
 * Brighter and wider where more people were active. Calm view: a still, faint dot.
 */

import { useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import apiClient from '@/lib/api-client';
import { MAX_SPAN_DEG } from '@/lib/mapPins';

export type AreaPulse = { lat: number; lng: number; level: 1 | 2 | 3 };

/** Refresh while the map is open, as well as when it moves. */
const REFRESH_MS = 2 * 60_000;

export async function fetchAreaPulses(bbox: [number, number, number, number]): Promise<AreaPulse[]> {
  const res = await apiClient.get<{ pulses: AreaPulse[] }>('/geo/area-pulses', {
    params: { bbox: bbox.map((n) => n.toFixed(5)).join(',') },
  });
  return (res as { data?: { pulses?: AreaPulse[] } })?.data?.pulses ?? [];
}

function pulseElement(p: AreaPulse, i: number): HTMLElement {
  // MapLibre moves the marker element with its own transform, so the circle inside animates.
  const el = document.createElement('div');
  el.className = 'nh-area-pulse';
  el.dataset.level = String(p.level);
  el.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  dot.className = 'nh-area-pulse__dot';
  // Out of step with each other, like the mockup (2.4 s to 3.4 s).
  dot.style.setProperty('--pulse-s', `${2.4 + ((i * 0.37) % 1)}s`);
  el.appendChild(dot);
  return el;
}

export function useAreaPulses(map: maplibregl.Map | null, enabled = true) {
  useEffect(() => {
    if (!map || !enabled) return;
    let alive = true;
    let markers: maplibregl.Marker[] = [];
    let timer: number | undefined;
    const clear = () => {
      for (const m of markers) m.remove();
      markers = [];
    };
    const load = async () => {
      const b = map.getBounds();
      const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      if (bbox[2] - bbox[0] > MAX_SPAN_DEG || bbox[3] - bbox[1] > MAX_SPAN_DEG) {
        clear();
        return;
      }
      try {
        const pulses = await fetchAreaPulses(bbox);
        if (!alive) return;
        clear();
        markers = pulses.map((p, i) =>
          new maplibregl.Marker({ element: pulseElement(p, i) }).setLngLat([p.lng, p.lat]).addTo(map),
        );
      } catch {
        // Pulses are decoration: on failure the map simply shows none.
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 600);
    };
    void load();
    map.on('moveend', onMove);
    const every = window.setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearInterval(every);
      map.off('moveend', onMove);
      clear();
    };
  }, [map, enabled]);
}
