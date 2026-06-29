/**
 * SidebarWeatherWidget — Compact ambient sky weather card for RightSidebar
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getTimePeriod,
  getSkyTheme,
  type SkyTheme,
} from '@/components/navigation/AmbientProfileCard';
import { wmoToAmbient } from '@/lib/weatherClient';

import { SkyWeatherEffects } from '@/components/ambient/SkyWeatherEffects';
import { useAmbientWeather } from '@/hooks/useAmbientWeather';

/* ── Sky scene elements (compact for sidebar) ── */

function SidebarStars() {
  const stars = useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      w: 1 + (i * 7 + 3) % 2,
      top: (i * 17 + 5) % 75,
      left: (i * 23 + 11) % 95,
      opacity: 0.3 + ((i * 13) % 6) / 10,
      dur: 2 + ((i * 11) % 4),
      delay: ((i * 7) % 30) / 10,
    })), []);

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${s.w}px`, height: `${s.w}px`,
            top: `${s.top}%`, left: `${s.left}%`,
            opacity: s.opacity,
            animation: `ambient-twinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function SidebarCelestial({ theme }: { theme: SkyTheme }) {
  const size = Math.round(theme.celestialSize * 0.55);

  if (theme.isMoon) {
    return (
      <div className="absolute transition-all duration-[2000ms]" style={{ top: theme.celestialTop, right: theme.celestialRight }}>
        <div
          className="absolute rounded-full"
          style={{
            width: size * 2.2, height: size * 2.2,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
            animation: 'ambient-pulse 6s ease-in-out infinite',
          }}
        />
        <div
          className="relative rounded-full"
          style={{
            width: size, height: size,
            background: `radial-gradient(circle at 35% 35%, ${theme.celestialColor} 0%, #c8cce0 100%)`,
            boxShadow: `0 0 10px ${theme.celestialGlow}, 0 0 25px ${theme.celestialGlow}`,
          }}
        >
          <div className="absolute rounded-full" style={{ width: 3, height: 3, top: '25%', left: '55%', background: 'rgba(0,0,0,0.08)' }} />
          <div className="absolute rounded-full" style={{ width: 2, height: 2, top: '55%', left: '30%', background: 'rgba(0,0,0,0.06)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute transition-all duration-[2000ms]" style={{ top: theme.celestialTop, right: theme.celestialRight }}>
      <div
        className="absolute rounded-full"
        style={{
          width: size * 3, height: size * 3,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
          animation: 'ambient-pulse 5s ease-in-out infinite',
        }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 40% 40%, #fff8e8 0%, ${theme.celestialColor} 60%, ${theme.celestialGlow} 100%)`,
          boxShadow: `0 0 12px ${theme.celestialGlow}, 0 0 35px ${theme.celestialGlow}`,
        }}
      />
    </div>
  );
}

function SidebarCloud({ x, y, scale, color, speed }: { x: number; y: number; scale: number; color: string; speed: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`, top: `${y}%`, transform: `scale(${scale})`,
        animation: `ambient-float ${speed}s ease-in-out infinite`,
        animationDelay: `${speed * 0.3}s`,
      }}
    >
      <div className="relative" style={{ width: 50, height: 20 }}>
        <div className="absolute rounded-full" style={{ width: 20, height: 14, bottom: 0, left: 3, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 18, height: 18, bottom: 3, left: 12, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 24, height: 18, bottom: 1, left: 20, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 16, height: 12, bottom: 0, left: 34, background: color, filter: 'blur(1px)' }} />
      </div>
    </div>
  );
}

function SidebarClouds({ color }: { color: string }) {
  return (
    <>
      <SidebarCloud x={-5} y={12} scale={0.9} color={color} speed={14} />
      <SidebarCloud x={55} y={6} scale={0.65} color={color} speed={18} />
      <SidebarCloud x={25} y={25} scale={0.5} color={color} speed={10} />
    </>
  );
}

function SidebarSilhouette({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full"
      viewBox="0 0 300 45"
      preserveAspectRatio="none"
      style={{ height: '24px' }}
    >
      <path
        d={`M0,45 L0,30 L8,30 L8,24 L12,24 L12,30 L18,30 L18,20 L22,20 L22,16 L26,16 L26,20 L30,20 L30,30 
            L38,30 L38,26 L42,26 L42,30 L50,30 L50,22 L54,22 L54,18 L58,18 L58,14 L62,14 L62,18 L66,18 L66,22 L70,22 L70,30 
            L78,30 L78,24 L82,24 L82,30 L90,30 L90,12 L93,12 L93,9 L97,9 L97,12 L100,12 L100,30 
            L108,30 L108,26 L112,26 L112,22 L116,22 L116,30 L124,30 L124,28 L128,28 L128,30 
            L136,30 L136,16 L138,16 L138,11 L142,11 L142,7 L146,7 L146,11 L148,11 L148,16 L150,16 L150,30 
            L158,30 L158,24 L162,24 L162,20 L166,20 L166,24 L170,24 L170,30 
            L178,30 L178,22 L182,22 L182,30 L190,30 L190,18 L194,18 L194,14 L198,14 L198,18 L202,18 L202,30 
            L210,30 L210,26 L214,26 L214,30 L222,30 L222,20 L225,20 L225,15 L228,15 L228,11 L232,11 L232,15 L235,15 L235,20 L238,20 L238,30 
            L246,30 L246,24 L250,24 L250,30 L258,30 L258,28 L262,28 L262,30 
            L270,30 L270,22 L274,22 L274,18 L278,18 L278,22 L282,22 L282,30 L290,30 L290,26 L294,26 L294,30 L300,30 L300,45 Z`}
        fill={color}
      />
      <rect x="93" y="11" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3" />
      <rect x="143" y="9" width="2" height="2" fill="rgba(255,220,100,0.8)" rx="0.3">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
      </rect>
      <rect x="229" y="13" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3" />
      <rect x="60" y="16" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="195" y="16" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="5s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ── Main Widget ── */

export default function SidebarWeatherWidget() {
  const { weather, loading: weatherLoading } = useAmbientWeather();


  // SSR-safe hour
  const [currentHour, setCurrentHour] = useState(12);
  useEffect(() => {
    setCurrentHour(new Date().getHours());
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const timePeriod = getTimePeriod(currentHour);
  const ambientWeather = weather ? wmoToAmbient(weather.wmoCode) : 'clear';
  const theme = useMemo(() => getSkyTheme(timePeriod, ambientWeather), [timePeriod, ambientWeather]);
  const isDark = timePeriod === 'night' || timePeriod === 'evening';

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-[2000ms]"
      style={{ background: theme.skyGradient, minHeight: 148 }}
    >
      {/* Horizon glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-[2000ms]" style={{ background: theme.horizonGlow }} />

      {/* Stars */}
      {theme.showStars && <SidebarStars />}

      {/* Celestial body */}
      <SidebarCelestial theme={theme} />

      {/* Clouds */}
      {theme.showClouds && <SidebarClouds color={theme.cloudColor} />}

      {/* Weather particles */}
      <SkyWeatherEffects theme={theme} isDark={isDark} size="compact" />

      {/* City silhouette */}
      <SidebarSilhouette color={theme.silhouetteColor} />

      {/* Content overlay */}
      <div className="relative z-10 p-4 flex flex-col justify-between gap-3" style={{ minHeight: 148 }}>
        {weatherLoading ? (
          <div className="animate-pulse flex flex-col gap-2 flex-1 justify-center">
            <div className="h-3 rounded-full w-16 bg-white/15" />
            <div className="h-8 rounded-full w-14 bg-white/15" />
            <div className="h-3 rounded-full w-28 bg-white/15" />
          </div>
        ) : weather ? (
          <>
            <div className="flex items-baseline gap-2 min-w-0">
              <p
                className="text-2xl font-extrabold leading-none shrink-0"
                style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
              >
                {weather.temp}°
              </p>
              <p
                className="text-[11px] font-medium leading-tight line-clamp-2"
                style={{ color: theme.mutedColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                {weather.condition}
                {weather.city ? ` · ${weather.city}` : ''}
              </p>
            </div>


          </>
        ) : null}
      </div>
    </div>
  );
}
