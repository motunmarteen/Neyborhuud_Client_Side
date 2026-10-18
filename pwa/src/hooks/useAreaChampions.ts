'use client';

/**
 * 👑 Area Champion of the Week on the map home (tracker M-14, Phase 7 G-10). Last week's
 * champion of each area stands at the centre of their LGA, never at their home. Tap opens who
 * they are and why. Visitors see the first name and initial only (the server decides).
 */

import { useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import apiClient from '@/lib/api-client';
import { personPinHtml } from '@/components/map/Pins';

export type AreaChampion = {
  week: string;
  lga: string;
  state: string;
  lat: number;
  lng: number;
  name: string;
  avatarUrl?: string;
  username?: string;
  impact: number;
  isMe: boolean;
};

/** The server allows up to 3 degrees a side; LGAs are big, so look a little past the edges. */
const MAX_SIDE = 3;
const PAD = 0.15;

export async function fetchAreaChampions(bbox: [number, number, number, number]): Promise<AreaChampion[]> {
  const res = await apiClient.get<{ champions: AreaChampion[] }>('/geo/area-champions', {
    params: { bbox: bbox.map((n) => n.toFixed(4)).join(',') },
  });
  return (res as { data?: { champions?: AreaChampion[] } })?.data?.champions ?? [];
}

function crownElement(c: AreaChampion, onOpen: (c: AreaChampion) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nh-champion';
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  const label = `${c.isMe ? 'You are' : `${c.name} is`} ${c.lga}'s Area Champion of the Week`;
  el.setAttribute('aria-label', label);
  el.innerHTML =
    personPinHtml({ name: c.name, avatarUrl: c.avatarUrl, champion: true, label }) +
    `<span class="nh-champion__tag" aria-hidden="true"></span>`;
  (el.querySelector('.nh-champion__tag') as HTMLElement).textContent = c.isMe ? 'You' : c.name;
  const open = (e: Event) => {
    e.stopPropagation();
    onOpen(c);
  };
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e);
  });
  return el;
}

export function useAreaChampions(map: maplibregl.Map | null, onOpen: (c: AreaChampion) => void, enabled = true) {
  useEffect(() => {
    if (!map || !enabled) return;
    let alive = true;
    let markers: maplibregl.Marker[] = [];
    let timer: number | undefined;
    let lastKey = '';
    const clear = () => {
      for (const m of markers) m.remove();
      markers = [];
      lastKey = '';
    };
    const load = async () => {
      const b = map.getBounds();
      const bbox: [number, number, number, number] = [b.getWest() - PAD, b.getSouth() - PAD, b.getEast() + PAD, b.getNorth() + PAD];
      if (bbox[2] - bbox[0] > MAX_SIDE || bbox[3] - bbox[1] > MAX_SIDE) {
        clear();
        return;
      }
      try {
        const champions = await fetchAreaChampions(bbox);
        if (!alive) return;
        const key = champions.map((c) => `${c.lga}|${c.name}`).join(',');
        if (key === lastKey) return; // same crowns: keep the markers, no flicker
        clear();
        lastKey = key;
        markers = champions.map((c) =>
          new maplibregl.Marker({ element: crownElement(c, onOpen), anchor: 'bottom' }).setLngLat([c.lng, c.lat]).addTo(map),
        );
      } catch {
        // Decoration: on failure the map simply shows no crowns.
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 700);
    };
    void load();
    map.on('moveend', onMove);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      map.off('moveend', onMove);
      clear();
    };
    // onOpen is a state setter from the page; it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, enabled]);
}
