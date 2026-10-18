'use client';

/**
 * Map lenses (owner 2026-10-18): extra things to switch on over the map with one tap —
 * Friends, Birthdays today, Businesses — without crowding it. All off by default; at most
 * two at once (turning on a third switches off the oldest); the server sends at most 25 per
 * lens, nearest first. Friends are mutual follows who chose "Show me to friends", at an
 * approximate spot; strangers are never shown.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import apiClient from '@/lib/api-client';
import { mapPinHtml, personPinHtml } from '@/components/map/Pins';
import { avatarPortraitUrl } from '@/hooks/useAvatar';

export type LensKey = 'friends' | 'birthdays' | 'businesses';
export type LensItem = { id: string; lat: number; lng: number; title: string; sub?: string; emoji?: string; avatarUrl?: string; avatarPortrait?: string; username?: string; href?: string };

export const LENSES: { key: LensKey; label: string; emoji: string; note: string }[] = [
  { key: 'friends', label: 'Friends', emoji: '👥', note: 'Friends who follow you back and chose to show themselves, near where they are' },
  { key: 'birthdays', label: 'Birthdays today', emoji: '🎂', note: 'Friends celebrating today' },
  { key: 'businesses', label: 'Businesses', emoji: '🏪', note: 'Local services and shops near you' },
];
export const MAX_LENSES = 2;
const KEY = 'nh_map_lenses';
const MAX_SIDE = 1;
const SPOT_EVERY_MS = 5 * 60_000;

function readSaved(): LensKey[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => LENSES.some((l) => l.key === x)).slice(0, MAX_LENSES) : [];
  } catch {
    return [];
  }
}

export function useLensChoice() {
  const [on, setOn] = useState<LensKey[]>([]);
  useEffect(() => setOn(readSaved()), []);
  const toggle = useCallback((k: LensKey) => {
    setOn((cur) => {
      const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k].slice(-MAX_LENSES);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);
  return { on, toggle };
}

function markerFor(lens: LensKey, it: LensItem, onOpen: (it: LensItem, lens: LensKey) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = `nh-lens nh-lens--${lens}`;
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  const label = lens === 'businesses' ? it.title : `${it.title}${lens === 'birthdays' ? ', birthday today' : ''}`;
  el.setAttribute('aria-label', label);
  el.innerHTML =
    lens === 'businesses'
      ? mapPinHtml({ emoji: '🏪', label, ring: 'amber', size: 'sm' })
      : personPinHtml({ name: it.title, avatarUrl: avatarPortraitUrl(it.avatarPortrait) ?? it.avatarUrl, label }) + (lens === 'birthdays' ? '<span class="nh-lens__badge" aria-hidden="true">🎂</span>' : '') + '<span class="nh-lens__tag" aria-hidden="true"></span>';
  const tag = el.querySelector('.nh-lens__tag');
  if (tag) tag.textContent = it.title;
  const open = (e: Event) => {
    e.stopPropagation();
    onOpen(it, lens);
  };
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e);
  });
  return el;
}

/** Draws the chosen lenses on the map; reloads when the map moves. */
export function useMapLenses(map: maplibregl.Map | null, on: LensKey[], onOpen: (it: LensItem, lens: LensKey) => void) {
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);
  const key = on.join(',');
  useEffect(() => {
    if (!map || !on.length) return;
    let alive = true;
    let markers: maplibregl.Marker[] = [];
    let timer: number | undefined;
    const clear = () => {
      for (const m of markers) m.remove();
      markers = [];
    };
    const load = async () => {
      const b = map.getBounds();
      const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      if (bbox[2] - bbox[0] > MAX_SIDE || bbox[3] - bbox[1] > MAX_SIDE) {
        clear();
        return;
      }
      const results = await Promise.all(
        on.map(async (lens) => {
          try {
            const res = await apiClient.get<{ items: LensItem[] }>(`/geo/lenses/${lens}`, { params: { bbox: bbox.map((n) => n.toFixed(4)).join(',') } });
            return { lens, items: (res as { data?: { items?: LensItem[] } })?.data?.items ?? [] };
          } catch {
            return { lens, items: [] as LensItem[] };
          }
        }),
      );
      if (!alive) return;
      clear();
      for (const r of results) {
        for (const it of r.items) {
          markers.push(new maplibregl.Marker({ element: markerFor(r.lens, it, (x, l) => openRef.current(x, l)), anchor: 'bottom' }).setLngLat([it.lng, it.lat]).addTo(map));
        }
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 700);
    };
    void load();
    map.on('moveend', onMove);
    const every = window.setInterval(load, 2 * 60_000);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearInterval(every);
      map.off('moveend', onMove);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
}

/** "Show me to friends": the switch, and sending my approximate spot while the map is open. */
export function useFriendsSharing(enabled: boolean) {
  const [on, setOnState] = useState<boolean | null>(null);
  useEffect(() => {
    if (!enabled) return;
    apiClient
      .get<{ on: boolean }>('/geo/me/friends-sharing')
      .then((r) => setOnState(!!(r as { data?: { on?: boolean } })?.data?.on))
      .catch(() => setOnState(false));
  }, [enabled]);
  const setOn = useCallback(async (v: boolean) => {
    setOnState(v);
    try {
      await apiClient.put('/geo/me/friends-sharing', { on: v });
    } catch {
      setOnState(!v);
    }
  }, []);
  useEffect(() => {
    if (!enabled || !on || !('geolocation' in navigator)) return;
    const send = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.geolocation.getCurrentPosition(
        (p) => void apiClient.post('/geo/me/friends-spot', { lat: p.coords.latitude, lng: p.coords.longitude }).catch(() => undefined),
        () => undefined,
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    };
    send();
    const t = window.setInterval(send, SPOT_EVERY_MS);
    return () => window.clearInterval(t);
  }, [enabled, on]);
  return { on, setOn };
}
