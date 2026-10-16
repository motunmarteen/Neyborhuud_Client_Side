'use client';

/**
 * Billboards and sponsored pins on a MapLibre map (owner, 2026-10-12). Fetches the live ads
 * for the area on screen when the map stops moving and keeps one marker per ad. Billboards
 * glow at night (`dark` from the sky). Each ad counts one view per visit when it first shows,
 * and a tap when opened. `sample` shows given ads instead of fetching (the design kit).
 *
 * On the toy-world map (street zoom), billboards also stand in 3D (lib/toyWorld/billboards):
 * the 2D board is then hidden from sight by CSS but kept for screen readers, and a tap on
 * the 3D board opens the ad.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { billboardHtml, billboardLabel, boardInk, sponsoredPinHtml } from '@/components/map/AdBoard';
import { TOY_LAYER_ID, type ToyWorldLayer } from '@/lib/toyWorld/toyWorldLayer';
import { countAd, fetchMapAds, type Ad } from '@/lib/adsApi';
import { MAX_SPAN_DEG } from '@/lib/mapPins';

type Options = {
  /** 0 (day) to 1 (night), from the sky. Billboards light up after dusk. */
  dark?: number;
  sample?: Ad[];
  onOpen?: (ad: Ad) => void;
  /** Shown only when no real ads are on screen (NeyborHuud's own "Your ad here"). */
  fallback?: Ad[];
  /** Always shown, e.g. sample ads for the owner's preview (marked "Sample"). */
  extra?: Ad[];
};

const seenThisVisit = new Set<string>();

function toyLayer(map: maplibregl.Map): ToyWorldLayer | undefined {
  if (!map.getStyle()) return undefined;
  return (map.getLayer(TOY_LAYER_ID) as unknown as { implementation?: ToyWorldLayer } | undefined)?.implementation;
}

function markup(ad: Ad, night: boolean) {
  return ad.kind === 'billboard' ? billboardHtml(ad, night) : sponsoredPinHtml(ad);
}

export function useMapAds(map: maplibregl.Map | null, { dark = 0, sample, onOpen, fallback, extra }: Options = {}) {
  const [fetched, setAds] = useState<Ad[]>([]);
  const fallbackKey = (fallback ?? []).map((a) => a._id).join(',');
  const extraKey = (extra ?? []).map((a) => a._id).join(',');
  const ads = useMemo(
    () => [...fetched, ...(fetched.length === 0 ? fallback ?? [] : []), ...(extra ?? [])],
    // keys stand for the arrays' contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetched, fallbackKey, extraKey],
  );
  const markers = useRef(new Map<string, { marker: maplibregl.Marker; html: string; ad: Ad }>());
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);
  const night = dark >= 0.5;

  useEffect(() => {
    if (!map) return;
    let alive = true;
    let timer: number | undefined;
    const load = async () => {
      if (sample) {
        setAds(sample);
        return;
      }
      const b = map.getBounds();
      const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      if (bbox[2] - bbox[0] > MAX_SPAN_DEG || bbox[3] - bbox[1] > MAX_SPAN_DEG) {
        setAds([]);
        return;
      }
      try {
        const next = await fetchMapAds(bbox);
        if (alive) setAds(next);
      } catch {
        // Ads are extra: on failure the map simply shows none.
      }
    };
    const onMove = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 500);
    };
    void load();
    map.on('moveend', onMove);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      map.off('moveend', onMove);
    };
  }, [map, sample]);

  useEffect(() => {
    if (!map) return;
    const seen = new Set<string>();
    for (const ad of ads) {
      if (!ad.location) continue;
      seen.add(ad._id);
      const html = markup(ad, night);
      const existing = markers.current.get(ad._id);
      if (existing) {
        existing.ad = ad;
        if (existing.html !== html) {
          const btn = existing.marker.getElement().firstElementChild as HTMLButtonElement | null;
          if (btn) {
            btn.innerHTML = html;
            btn.firstElementChild?.setAttribute('aria-hidden', 'true');
          }
          existing.html = html;
        }
        continue;
      }
      const wrap = document.createElement('div');
      wrap.className = 'nh-ad-marker';
      wrap.dataset.kind = ad.kind;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nh-pin-btn';
      btn.setAttribute('aria-label', ad.kind === 'billboard' ? billboardLabel(ad) : `Ad: ${ad.title}`);
      btn.innerHTML = html;
      btn.firstElementChild?.setAttribute('aria-hidden', 'true');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cur = markers.current.get(ad._id)?.ad ?? ad;
        if (!sample) void countAd(cur._id, 'tap');
        openRef.current?.(cur);
      });
      wrap.appendChild(btn);
      // A billboard stands on the spot (posts at the bottom); a pin is centred like other pins.
      const marker = new maplibregl.Marker({ element: wrap, anchor: ad.kind === 'billboard' ? 'bottom' : 'center' })
        .setLngLat([ad.location.lng, ad.location.lat])
        .addTo(map);
      // Under every pin: an ad never covers a safety alert or a neighbour's post.
      marker.getElement().style.zIndex = '1';
      markers.current.set(ad._id, { marker, html, ad });
      if (!sample && !seenThisVisit.has(ad._id)) {
        seenThisVisit.add(ad._id);
        void countAd(ad._id, 'view');
      }
    }
    for (const [id, m] of markers.current) {
      if (!seen.has(id)) {
        m.marker.remove();
        markers.current.delete(id);
      }
    }
  }, [map, ads, night, sample]);

  // 3D billboards: hand them to the toy-world layer (again when the layer appears later).
  useEffect(() => {
    if (!map) return;
    const boards = ads
      .filter((ad) => ad.kind === 'billboard' && ad.location)
      .map((ad) => ({
        id: ad._id,
        lng: ad.location!.lng,
        lat: ad.location!.lat,
        title: ad.title,
        line: ad.line,
        colour: ad.colour,
        ink: boardInk(ad.colour),
        chip: ad._id.startsWith('sample-') ? 'Sample' : 'Ad',
      }));
    const push = () => toyLayer(map)?.setBillboards(boards);
    push();
    map.on('idle', push);
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const id = toyLayer(map)?.pickBillboard(e.point);
      const cur = id ? markers.current.get(id)?.ad : undefined;
      if (!cur) return;
      if (!sample) void countAd(cur._id, 'tap');
      openRef.current?.(cur);
    };
    map.on('click', onClick);
    return () => {
      map.off('idle', push);
      map.off('click', onClick);
    };
  }, [map, ads, sample]);

  useEffect(() => {
    const all = markers.current;
    return () => {
      for (const m of all.values()) m.marker.remove();
      all.clear();
    };
  }, [map]);

  return { ads };
}
