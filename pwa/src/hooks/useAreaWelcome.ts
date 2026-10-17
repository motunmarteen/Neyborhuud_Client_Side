'use client';

/** The area under the map and how many members live there (visitor welcome card). */

import { useEffect, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';
import apiClient from '@/lib/api-client';

export type AreaWelcome = { lga: string | null; state: string | null; neighbours: number };

/** From this zoom the map is on one area (below it, a city or Nigeria). */
const AREA_ZOOM = 13;

export function useAreaWelcome(map: maplibregl.Map | null, enabled: boolean): AreaWelcome | null {
  const [area, setArea] = useState<AreaWelcome | null>(null);
  useEffect(() => {
    if (!map || !enabled) return;
    let alive = true;
    let timer: number | undefined;
    const load = async () => {
      if (map.getZoom() < AREA_ZOOM) {
        setArea(null);
        return;
      }
      const c = map.getCenter();
      try {
        const res = await apiClient.get<AreaWelcome>('/geo/area-welcome', {
          params: { lat: c.lat.toFixed(3), lng: c.lng.toFixed(3) },
        });
        const data = (res as { data?: AreaWelcome })?.data;
        if (alive && data) setArea(data);
      } catch {
        /* the card falls back to a general welcome */
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 900);
    };
    void load();
    map.on('moveend', onMove);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      map.off('moveend', onMove);
    };
  }, [map, enabled]);
  return area;
}
