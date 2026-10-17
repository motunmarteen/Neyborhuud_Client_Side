'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentWeather } from '@/lib/weatherClient';
import { mapWeatherFromWmo, type MapWeather } from '@/lib/mapWeather';

/** Let the map load before asking for the weather (M-16). */
const FIRST_DELAY_MS = 3000;

/**
 * Real weather for the place on the map (M-05), refreshed every 15 minutes.
 * null = unknown (no place, or the weather service failed): the map shows no weather
 * effects rather than a made-up one.
 */
export function useMapWeather(place?: { lat: number; lng: number } | null): MapWeather | null {
  const [wx, setWx] = useState<MapWeather | null>(null);
  const lat = place?.lat;
  const lng = place?.lng;
  useEffect(() => {
    if (lat == null || lng == null) {
      setWx(null);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const w = await fetchCurrentWeather(lat, lng);
        if (alive) setWx(w.real ? mapWeatherFromWmo(w.wmoCode, new Date().getMonth()) : null);
      } catch {
        if (alive) setWx(null);
      }
    };
    // Wait a moment first (M-16): on 3G the map's own downloads go first; weather can follow.
    const first = window.setTimeout(load, FIRST_DELAY_MS);
    const id = window.setInterval(load, 15 * 60_000);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [lat, lng]);
  return wx;
}
