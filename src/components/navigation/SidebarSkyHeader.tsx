'use client';

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  getTimePeriod,
  getSkyTheme,
  type SkyTheme,
} from '@/components/navigation/AmbientProfileCard';
import { wmoToAmbient } from '@/lib/weatherClient';
import { useAmbientWeather } from '@/hooks/useAmbientWeather';
import { SkyWeatherEffects } from '@/components/ambient/SkyWeatherEffects';

function SkyStars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        w: 1 + ((i * 7 + 3) % 2),
        top: (i * 17 + 5) % 70,
        left: (i * 23 + 11) % 95,
        opacity: 0.25 + ((i * 13) % 6) / 10,
        dur: 2 + ((i * 11) % 4),
        delay: ((i * 7) % 30) / 10,
      })),
    [],
  );

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${s.w}px`,
            height: `${s.w}px`,
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: s.opacity,
            animation: `ambient-twinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function SkyCelestial({ theme }: { theme: SkyTheme }) {
  const size = Math.round(theme.celestialSize * 0.45);
  const glowSize = theme.isMoon ? size * 2.2 : size * 3;

  return (
    <div className="left-sidebar__sky-celestial pointer-events-none" aria-hidden>
      <div
        className="absolute rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
          animation: `ambient-pulse ${theme.isMoon ? 6 : 5}s ease-in-out infinite`,
        }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: theme.isMoon
            ? `radial-gradient(circle at 35% 35%, ${theme.celestialColor} 0%, #c8cce0 100%)`
            : `radial-gradient(circle at 40% 40%, #fff8e8 0%, ${theme.celestialColor} 60%, ${theme.celestialGlow} 100%)`,
          boxShadow: theme.isMoon
            ? `0 0 10px ${theme.celestialGlow}, 0 0 24px ${theme.celestialGlow}`
            : `0 0 14px ${theme.celestialGlow}, 0 0 36px ${theme.celestialGlow}`,
        }}
      />
    </div>
  );
}

function SkyCloud({ x, y, scale, color, speed }: { x: number; y: number; scale: number; color: string; speed: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${scale})`,
        animation: `ambient-float ${speed}s ease-in-out infinite`,
        animationDelay: `${speed * 0.3}s`,
      }}
    >
      <div className="relative" style={{ width: 50, height: 20 }}>
        <div className="absolute rounded-full" style={{ width: 20, height: 14, bottom: 0, left: 3, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 18, height: 18, bottom: 3, left: 12, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 24, height: 18, bottom: 1, left: 20, background: color, filter: 'blur(1px)' }} />
      </div>
    </div>
  );
}

/** Sky backdrop for sidebar header — logo, profile, and FX sit on top as children. */
export function SidebarSkyHeaderPanel({
  children,
  isDrawer = false,
}: {
  children: ReactNode;
  isDrawer?: boolean;
}) {
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
  const sceneDark = timePeriod === 'night' || timePeriod === 'evening';

  return (
    <div
      className="left-sidebar__header-panel"
      data-time-period={timePeriod}
      style={
        {
          '--sidebar-sky-text': theme.textColor,
          '--sidebar-sky-muted': theme.mutedColor,
        } as CSSProperties
      }
    >
      <div
        className="left-sidebar__sky-header-scene transition-all duration-[2000ms]"
        style={{ background: theme.skyGradient }}
        aria-hidden
      >
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-[2000ms]"
          style={{ background: theme.horizonGlow }}
        />
        {theme.showStars && <SkyStars />}
        <SkyCelestial theme={theme} />
        {theme.showClouds && (
          <>
            <SkyCloud x={-5} y={8} scale={0.85} color={theme.cloudColor} speed={14} />
            <SkyCloud x={55} y={2} scale={0.6} color={theme.cloudColor} speed={18} />
          </>
        )}
        <SkyWeatherEffects theme={theme} isDark={sceneDark} size="compact" />
        <div className="left-sidebar__sky-header-fade" />
      </div>

      <div className={`left-sidebar__header-content${isDrawer ? ' left-sidebar__header-content--drawer' : ''}`}>
        {children}
      </div>
    </div>
  );
}
