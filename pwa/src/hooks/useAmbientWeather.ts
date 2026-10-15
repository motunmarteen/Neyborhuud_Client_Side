'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchCurrentWeather, getWeekdayName, type CurrentWeather } from '@/lib/weatherClient';
import { resolveHuudDisplayName } from '@/lib/huudName';
import { getGeolocation } from '@/lib/nativeGeolocation';

import { extractUserMapCoords } from '@/lib/mapUserLocation';

function withHuudCity(
  weather: CurrentWeather,
  user: ReturnType<typeof useAuth>['user'],
): CurrentWeather {
  const huudName = resolveHuudDisplayName(user);
  if (huudName !== 'Your Huud') {
    return { ...weather, city: huudName };
  }

  const loc = user?.location;
  if (!loc) return weather;

  const hint =
    loc.neighborhood?.trim()
    || loc.ward?.trim()
    || loc.lga?.trim()
    || loc.formattedAddress?.split(',')[0]?.trim()
    || loc.state?.trim()
    || null;

  if (hint && (!weather.city || weather.city === 'Your Area')) {
    return { ...weather, city: hint };
  }

  return weather;
}


export function useAmbientWeather() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const lastCoords = useRef({ lat: 0, lon: 0 });

  useEffect(() => {
    const publish = (next: CurrentWeather) => {
      setWeather(withHuudCity(next, user));
      setLoading(false);
    };

    const updateWeather = async (latitude: number, longitude: number, force = false) => {
      const moved =
        Math.abs(latitude - lastCoords.current.lat) > 0.005
        || Math.abs(longitude - lastCoords.current.lon) > 0.005;
      if (!force && lastCoords.current.lat !== 0 && !moved) return;

      lastCoords.current = { lat: latitude, lon: longitude };

      try {
        const w = await fetchCurrentWeather(latitude, longitude);
        // Placeholder (every service failed) is never shown as weather.
        if (w.real) publish(w);
        else {
          setWeather(null);
          setLoading(false);
        }
      } catch {
        // Weather service failed: show none rather than an invented reading.
        setWeather(null);
        setLoading(false);
      }
    };

    const tryProfileCoords = () => {
      const coords = user ? extractUserMapCoords(user as unknown as Parameters<typeof extractUserMapCoords>[0]) : null;
      if (coords && coords.lat && coords.lng) {
        void updateWeather(coords.lat, coords.lng, true);
        return true;
      }
      return false;
    };

    const geo = getGeolocation();
    if (!geo) {
      if (!tryProfileCoords()) {
        setLoading(false); // no location: no weather rather than another city's
      }
      return;
    }

    const watchId = geo.watchPosition(
      (pos) => updateWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        if (!tryProfileCoords()) setLoading(false); // no location: no weather rather than another city's
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
    );

    const refreshInterval = setInterval(() => {
      if (lastCoords.current.lat !== 0) {
        void updateWeather(lastCoords.current.lat, lastCoords.current.lon, true);
      }
    }, 10 * 60_000);

    return () => {
      geo.clearWatch(watchId);
      clearInterval(refreshInterval);
    };
  }, [
    user,
    user?.location?.latitude,
    user?.location?.longitude,
    user?.location?.neighborhood,
    user?.location?.lga,
    user?.location?.ward,
    user?.location?.formattedAddress,
    user?.location?.state,
  ]);

  return { weather, loading };
}
