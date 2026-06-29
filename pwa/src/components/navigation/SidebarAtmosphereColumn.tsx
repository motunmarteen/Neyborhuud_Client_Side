'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTimePeriod, getSkyTheme } from '@/components/navigation/AmbientProfileCard';
import { SkyRainDrops, SkySnowflakes } from '@/components/ambient/SkyWeatherEffects';
import { useAmbientWeather } from '@/hooks/useAmbientWeather';
import { wmoToAmbient } from '@/lib/weatherClient';

export function useSidebarAtmosphereActive() {
  const { weather } = useAmbientWeather();
  const [currentHour, setCurrentHour] = useState(12);

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const timePeriod = getTimePeriod(currentHour);
  const ambientWeather = weather ? wmoToAmbient(weather.wmoCode) : 'clear';
  const theme = useMemo(
    () => getSkyTheme(timePeriod, ambientWeather),
    [timePeriod, ambientWeather],
  );

  return {
    active: theme.showRain || theme.showSnow,
    theme,
    timePeriod,
    ambientWeather,
    sceneDark: timePeriod === 'night' || timePeriod === 'evening',
  };
}

/**
 * Full-height rain/snow column for the left sidebar — particles fall from the sky
 * header through the nav list and onto the city silhouette at the bottom.
 */
export function SidebarAtmosphereColumn() {
  const { active, theme, timePeriod, ambientWeather, sceneDark } = useSidebarAtmosphereActive();

  if (!active) return null;

  return (
    <div
      className="left-sidebar__atmosphere"
      aria-hidden
      data-weather={ambientWeather}
      data-time-period={timePeriod}
    >
      {theme.showRain ? <SkyRainDrops isDark={sceneDark} variant="column" /> : null}
      {theme.showSnow ? <SkySnowflakes isDark={sceneDark} variant="column" /> : null}
    </div>
  );
}
