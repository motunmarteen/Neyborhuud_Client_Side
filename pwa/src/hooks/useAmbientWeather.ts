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

const DEFAULT_COORDS = { lat: 6.5244, lng: 3.3792 }; // Lagos centroid fallback

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
        publish(await fetchCurrentWeather(latitude, longitude));
      } catch {
        const fallbackCity = resolveHuudDisplayName(user);
        publish({
          temp: 28,
          condition: 'Rain Showers',
          city: fallbackCity !== 'Your Huud' ? fallbackCity : 'Your Area',
          wmoCode: 80,
          forecast: [
            { dayName: getWeekdayName(-1), temp: 28, isToday: false },
            { dayName: getWeekdayName(0), temp: 28, isToday: true },
            { dayName: getWeekdayName(1), temp: 29, isToday: false },
          ],
        });
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
        void updateWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, true);
      }
      return;
    }

    const watchId = geo.watchPosition(
      (pos) => updateWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        if (!tryProfileCoords()) {
          void updateWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, true);
        }
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
