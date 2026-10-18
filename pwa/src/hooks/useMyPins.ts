'use client';

/**
 * Your own pins on the map home (owner, 2026-10-17: "the pin of where I live or where I am
 * is missing").
 *
 *  - 🏠 Your home: the home you registered. Drawn on your own phone only; nothing is sent
 *    or shown to anyone else (other people's homes never appear on the map).
 *  - You: your avatar's face (or your initial) at the phone's position, following you while
 *    the map is open; until we know where you are, it stands at your home (owner 2026-10-18:
 *    "I should also appear as avatar on the map"). The map never asks for location by itself: it starts when
 *    you tap "Me", or straight away if you already allowed location for NeyborHuud.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { mapPinHtml, personPinHtml } from '@/components/map/Pins';

type LatLng = { lat: number; lng: number };

/** The pin's own markup carries its label for screen readers. */
function pinMarker(html: string, z: string) {
  const el = document.createElement('div');
  el.innerHTML = html;
  el.style.zIndex = z;
  return el;
}

export function useMyPins(map: maplibregl.Map | null, { home, name, avatarUrl }: { home: LatLng | null; name: string; avatarUrl?: string }) {
  const [here, setHere] = useState<LatLng | null>(null);
  const watchId = useRef<number | null>(null);

  // Follow the phone once we may (never prompts by itself).
  const follow = useCallback(() => {
    if (watchId.current != null || !('geolocation' in navigator)) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
  }, []);

  useEffect(() => {
    let alive = true;
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        if (alive && s.state === 'granted') follow();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [follow]);

  useEffect(() => {
    if (!map || !home) return;
    const marker = new maplibregl.Marker({
      element: pinMarker(mapPinHtml({ emoji: '🏠', label: 'Your home. Only you see this', ring: 'green', size: 'sm' }), '2'),
    })
      .setLngLat([home.lng, home.lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, home?.lat, home?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const meMarker = useRef<maplibregl.Marker | null>(null);
  const at = here ?? home;
  // A new look (name or avatar) needs a new pin; moving only moves it.
  useEffect(() => {
    meMarker.current?.remove();
    meMarker.current = null;
  }, [map, name, avatarUrl]);
  useEffect(() => {
    if (!map || !at) return;
    if (!meMarker.current) {
      meMarker.current = new maplibregl.Marker({ element: pinMarker(personPinHtml({ name, me: true, avatarUrl }), '3'), anchor: 'bottom' })
        .setLngLat([at.lng, at.lat])
        .addTo(map);
    } else {
      meMarker.current.setLngLat([at.lng, at.lat]);
    }
  }, [map, at?.lat, at?.lng, name, avatarUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      meMarker.current?.remove();
      meMarker.current = null;
    },
    [map],
  );

  /** From the "Me" button: show the pin now and keep it up to date. */
  const showHere = useCallback(
    (at: LatLng) => {
      setHere(at);
      follow();
    },
    [follow],
  );

  return { here, showHere };
}
