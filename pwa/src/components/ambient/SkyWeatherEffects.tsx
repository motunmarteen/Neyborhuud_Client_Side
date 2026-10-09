'use client';

import { useMemo } from 'react';
import type { SkyTheme } from '@/components/navigation/AmbientProfileCard';

type EffectSize = 'hero' | 'compact' | 'mini';
type EffectVariant = 'contained' | 'column';

const PARTICLE_COUNTS: Record<EffectSize, { rain: number; snow: number }> = {
  hero: { rain: 46, snow: 32 },
  compact: { rain: 22, snow: 18 },
  mini: { rain: 14, snow: 14 },
};

const COLUMN_PARTICLE_COUNTS = { rain: 30, snow: 20 };

export function SkyRainDrops({
  isDark = false,
  size = 'hero',
  variant = 'contained',
}: {
  isDark?: boolean;
  size?: EffectSize;
  variant?: EffectVariant;
}) {
  const isColumn = variant === 'column';
  const count = isColumn ? COLUMN_PARTICLE_COUNTS.rain : PARTICLE_COUNTS[size].rain;
  const drops = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 13 + 5) % 100,
        height: isColumn
          ? 16 + ((i * 7 + 3) % 22)
          : (size === 'mini' ? 8 : 16) + ((i * 7 + 3) % (size === 'mini' ? 8 : 18)),
        dur: isColumn
          ? 0.85 + ((i * 11) % 8) / 12
          : 0.65 + ((i * 11) % 6) / 10,
        delay: ((i * 7) % (isColumn ? 35 : 22)) / 10,
        angle: -12 + ((i * 3) % 8),
      })),
    [count, isColumn, size],
  );

  return (
    <>
      {drops.map((d) => (
        <div
          key={d.id}
          className={`absolute sky-rain-drop${isColumn ? ' sky-rain-drop--column' : ''}`}
          style={{
            left: `${d.left}%`,
            top: isColumn ? undefined : size === 'mini' ? '-10px' : '-16px',
            width: isColumn ? '1.5px' : size === 'mini' ? '1px' : '1.8px',
            height: `${d.height}px`,
            background: isDark
              ? 'linear-gradient(180deg, transparent, rgba(160, 205, 255, 0.85), rgba(215, 235, 255, 0.6))'
              : isColumn
                ? 'linear-gradient(180deg, transparent, rgba(90, 140, 225, 0.7), rgba(150, 190, 245, 0.4))'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(115, 180, 255, 0.95), rgba(70, 140, 240, 0.75))',
            boxShadow: isDark
              ? '0 0 2px rgba(160, 205, 255, 0.5)'
              : '0 0 2px rgba(90, 160, 255, 0.4)',
            borderRadius: '1px',
            animation: `${isColumn ? 'ambient-rain-sidebar' : 'ambient-rain'} ${d.dur}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function SkySnowflakes({
  isDark = false,
  size = 'hero',
  variant = 'contained',
}: {
  isDark?: boolean;
  size?: EffectSize;
  variant?: EffectVariant;
}) {
  const isColumn = variant === 'column';
  const count = isColumn ? COLUMN_PARTICLE_COUNTS.snow : PARTICLE_COUNTS[size].snow;
  const flakes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 19 + 7) % 100,
        flakeSize: 2 + ((i * 5 + 2) % 4),
        dur: isColumn ? 4.2 + ((i * 9) % 8) / 2 : 2.8 + ((i * 9) % 6) / 2,
        delay: ((i * 11) % (isColumn ? 36 : 28)) / 10,
        drift: -18 + ((i * 13) % 36),
      })),
    [count, isColumn],
  );

  return (
    <>
      {flakes.map((f) => (
        <div
          key={f.id}
          className={`absolute rounded-full bg-white${isColumn ? ' sky-snowflake--column' : ''}`}
          style={{
            left: `${f.left}%`,
            top: isColumn ? undefined : '-10px',
            width: `${f.flakeSize}px`,
            height: `${f.flakeSize}px`,
            opacity: isDark ? 0.82 : 0.94,
            boxShadow: '0 0 4px rgba(255,255,255,0.85)',
            ['--snow-drift' as string]: `${f.drift}px`,
            animation: `${isColumn ? 'ambient-snow-sidebar' : 'ambient-snow'} ${f.dur}s linear infinite`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function SkyFogMist({ isDark = false }: { isDark?: boolean }) {
  return (
    <div
      className={`sky-fog-mist${isDark ? ' sky-fog-mist--dark' : ''}`}
      aria-hidden
    >
      <div className="sky-fog-mist__layer sky-fog-mist__layer--1" />
      <div className="sky-fog-mist__layer sky-fog-mist__layer--2" />
      <div className="sky-fog-mist__layer sky-fog-mist__layer--3" />
    </div>
  );
}

export function SkyWeatherEffects({
  theme,
  isDark,
  size = 'hero',
}: {
  theme: Pick<SkyTheme, 'showRain' | 'showSnow' | 'showFog'>;
  isDark: boolean;
  size?: EffectSize;
}) {
  if (!theme.showRain && !theme.showSnow && !theme.showFog) return null;

  return (
    <div className="sky-weather-effects" aria-hidden>
      {theme.showFog ? <SkyFogMist isDark={isDark} /> : null}
      {theme.showRain ? <SkyRainDrops isDark={isDark} size={size} /> : null}
      {theme.showSnow ? <SkySnowflakes isDark={isDark} size={size} /> : null}
    </div>
  );
}
