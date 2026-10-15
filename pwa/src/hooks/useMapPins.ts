'use client';

/**
 * Live pins on a MapLibre map (tracker M-07). Fetches the pins for the area on screen when
 * the map stops moving, and keeps the markers in step (adds, updates, removes only what
 * changed). Each pin is a real button with a spoken label. `sample` shows given pins instead
 * of fetching (the public design kit, which has no signed-in neighbour to ask for).
 */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { mapPinHtml } from '@/components/map/Pins';
import { fetchMapPins, LAYER_META, MAX_SPAN_DEG, pinLabel, shortNaira, type BBox, type MapLayer, type MapPin } from '@/lib/mapPins';

export type MapPinsStatus = 'idle' | 'loading' | 'ready' | 'zoom-in' | 'error';

type Options = {
  sample?: MapPin[];
  onOpen?: (pin: MapPin) => void;
};

function pinMarkup(p: MapPin): string {
  const meta = LAYER_META[p.layer];
  return mapPinHtml({
    emoji: meta.emoji,
    label: pinLabel(p),
    ring: meta.ring,
    ripple: p.layer === 'safety' && p.live,
    count: p.count,
    tag: p.layer === 'market' ? shortNaira(p.top.price) : undefined,
  });
}

export function useMapPins(map: maplibregl.Map | null, layers: MapLayer[], { sample, onOpen }: Options = {}) {
  const [status, setStatus] = useState<MapPinsStatus>('idle');
  const [pins, setPins] = useState<MapPin[]>([]);
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
      setStatus('loading');
      try {
        const next = await fetchMapPins(bbox, layers);
        if (alive) {
          setPins(next);
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
    // layers is represented by layerKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerKey, sample]);

  // Keep the markers in step with the pins.
  useEffect(() => {
    if (!map) return;
    const seen = new Set<string>();
    for (const p of pins) {
      seen.add(p.id);
      const html = pinMarkup(p);
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
  }, [map, pins]);

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
