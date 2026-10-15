'use client';

/**
 * Live pins on a MapLibre map (tracker M-07). Fetches the pins for the area on screen when
 * the map stops moving, and keeps the markers in step (adds, updates, removes only what
 * changed). Each pin is a real button with a spoken label. `sample` shows given pins instead
 * of fetching (the public design kit, which has no signed-in neighbour to ask for).
 *
 * Live (M-08): with `live`, the map tells the server which area is on screen ("map:watch");
 * when something new is saved there the server sends "map:changed" (no content), the pins
 * reload, and pins that were not there before ripple for a few seconds.
 */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { mapPinHtml } from '@/components/map/Pins';
import socketService from '@/lib/socket';
import { fetchMapPins, LAYER_META, MAX_SPAN_DEG, pinLabel, shortNaira, type BBox, type MapLayer, type MapPin } from '@/lib/mapPins';

export type MapPinsStatus = 'idle' | 'loading' | 'ready' | 'zoom-in' | 'error';

type Options = {
  sample?: MapPin[];
  onOpen?: (pin: MapPin) => void;
  /** Refresh at once when neighbours post something new in the area on screen (M-08). */
  live?: boolean;
};

/** How long a newly arrived pin ripples. */
const FRESH_MS = 10_000;
/** Wait after a nudge before reloading (several posts at once become one reload). */
const LIVE_RELOAD_MS = 1_200;

function pinMarkup(p: MapPin, fresh = false): string {
  const meta = LAYER_META[p.layer];
  return mapPinHtml({
    emoji: meta.emoji,
    label: pinLabel(p),
    ring: meta.ring ?? (fresh ? 'green' : undefined),
    ripple: (p.layer === 'safety' && p.live) || fresh,
    count: p.count,
    tag: p.layer === 'market' ? shortNaira(p.top.price) : undefined,
  });
}

export function useMapPins(map: maplibregl.Map | null, layers: MapLayer[], { sample, onOpen, live = false }: Options = {}) {
  const [status, setStatus] = useState<MapPinsStatus>('idle');
  const [pins, setPins] = useState<MapPin[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const [liveTick, setLiveTick] = useState(0);
  const lastLive = useRef(0);
  const markers = useRef(new Map<string, { marker: maplibregl.Marker; html: string; pin: MapPin }>());
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const layerKey = layers.join(',');

  // Fetch for the area on screen.
  useEffect(() => {
    if (!map) return;
    let alive = true;
    let timer: number | undefined;
    const load = async () => {
      if (sample) {
        setPins(sample.filter((p) => layers.includes(p.layer)));
        setStatus('ready');
        return;
      }
      const b = map.getBounds();
      const bbox: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      if (bbox[2] - bbox[0] > MAX_SPAN_DEG || bbox[3] - bbox[1] > MAX_SPAN_DEG || layers.length === 0) {
        setPins([]);
        setStatus(layers.length === 0 ? 'ready' : 'zoom-in');
        return;
      }
      const fromLive = lastLive.current;
      lastLive.current = 0;
      if (!fromLive) setStatus('loading');
      try {
        const next = await fetchMapPins(bbox, layers);
        if (alive) {
          if (fromLive) {
            // Ripple only what arrived with this nudge (not what a pan brought into view).
            setPins((prev) => {
              const had = new Set(prev.map((p) => `${p.id}|${p.count}|${p.top.id}`));
              const arrived = next.filter((p) => !had.has(`${p.id}|${p.count}|${p.top.id}`)).map((p) => p.id);
              if (arrived.length) setFresh(new Set(arrived));
              return next;
            });
          } else {
            setPins(next);
          }
          setStatus('ready');
        }
      } catch {
        if (alive) setStatus('error');
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 400);
    };
    void load();
    map.on('moveend', onMove);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      map.off('moveend', onMove);
    };
    // layers is represented by layerKey; liveTick reloads after a live nudge
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerKey, sample, liveTick]);

  // Live: watch the area on screen, reload on "map:changed".
  useEffect(() => {
    if (!map || sample || !live) return;
    const socket = socketService.connect() ?? socketService.getSocket();
    if (!socket) return;
    let reloadTimer: number | undefined;
    const watch = () => {
      const b = map.getBounds();
      const box = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(5)).join(',');
      socket.emit('map:watch', { bbox: box });
    };
    const onChanged = () => {
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => {
        lastLive.current = Date.now();
        setLiveTick((t) => t + 1);
      }, LIVE_RELOAD_MS);
    };
    watch();
    map.on('moveend', watch);
    socket.on('authenticated', watch);
    socket.on('connect', watch);
    socket.on('map:changed', onChanged);
    return () => {
      window.clearTimeout(reloadTimer);
      map.off('moveend', watch);
      socket.off('authenticated', watch);
      socket.off('connect', watch);
      socket.off('map:changed', onChanged);
      socket.emit('map:unwatch');
    };
  }, [map, sample, live]);

  // New pins stop rippling after a while.
  useEffect(() => {
    if (fresh.size === 0) return;
    const id = window.setTimeout(() => setFresh(new Set()), FRESH_MS);
    return () => window.clearTimeout(id);
  }, [fresh]);

  // Keep the markers in step with the pins.
  useEffect(() => {
    if (!map) return;
    const seen = new Set<string>();
    for (const p of pins) {
      seen.add(p.id);
      const html = pinMarkup(p, fresh.has(p.id));
      const existing = markers.current.get(p.id);
      if (existing) {
        existing.pin = p;
        if (existing.html !== html) {
          const btn = existing.marker.getElement().firstElementChild as HTMLButtonElement | null;
          if (btn) {
            btn.innerHTML = html;
            btn.firstElementChild?.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-label', pinLabel(p));
          }
          existing.html = html;
        }
        continue;
      }
      const wrap = document.createElement('div');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nh-pin-btn';
      btn.setAttribute('aria-label', pinLabel(p));
      btn.innerHTML = html;
      // The button carries the label; the pin drawing inside is not read out again.
      btn.firstElementChild?.setAttribute('aria-hidden', 'true');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRef.current?.(markers.current.get(p.id)?.pin ?? p);
      });
      wrap.appendChild(btn);
      const marker = new maplibregl.Marker({ element: wrap, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
      // Pins stay above map ads; safety pins above everything (an ad never hides an alert).
      marker.getElement().style.zIndex = p.layer === 'safety' ? '3' : '2';
      markers.current.set(p.id, { marker, html, pin: p });
    }
    for (const [id, m] of markers.current) {
      if (!seen.has(id)) {
        m.marker.remove();
        markers.current.delete(id);
      }
    }
  }, [map, pins, fresh]);

  // Remove every marker when the map goes away.
  useEffect(() => {
    const all = markers.current;
    return () => {
      for (const m of all.values()) m.marker.remove();
      all.clear();
    };
  }, [map]);

  return { status, pins };
}
