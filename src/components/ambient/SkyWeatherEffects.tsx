'use client';

import { useMemo } from 'react';
import type { SkyTheme } from '@/components/navigation/AmbientProfileCard';

type EffectSize = 'hero' | 'compact' | 'mini';

const PARTICLE_COUNTS: Record<EffectSize, { rain: number; snow: number }> = {
  hero: { rain: 25, snow: 32 },
  compact: { rain: 14, snow: 18 },
  mini: { rain: 10, snow: 14 },
};

export function SkyRainDrops({
  isDark = false,
  size = 'hero',
}: {
  isDark?: boolean;
  size?: EffectSize;
}) {
  const count = PARTICLE_COUNTS[size].rain;
  const drops = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 13 + 5) % 100,
        height: (size === 'mini' ? 6 : 10) + (i * 7 + 3) % (size === 'mini' ? 10 : 18),
        dur: 0.35 + ((i * 11) % 4) / 15,
        delay: ((i * 7) % 25) / 10,
        angle: -10 + ((i * 3) % 8),
      })),
    [count, size],
  );

  return (
    <>
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: size === 'mini' ? '-8px' : '-12px',
            width: size === 'mini' ? '1px' : '1.5px',
            height: `${d.height}px`,
            transform: `rotate(${d.angle}deg)`,
            background: isDark
              ? 'linear-gradient(180deg, transparent, rgba(150,180,255,0.55), transparent)'
              : 'linear-gradient(180deg, transparent, rgba(255,255,255,0.55), transparent)',
            borderRadius: '1px',
            animation: `ambient-rain ${d.dur}s linear infinite`,
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
}: {
  isDark?: boolean;
  size?: EffectSize;
}) {
  const count = PARTICLE_COUNTS[size].snow;
  const flakes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 19 + 7) % 100,
        flakeSize: 2 + ((i * 5 + 2) % 4),
        dur: 2.8 + ((i * 9) % 6) / 2,
        delay: ((i * 11) % 28) / 10,
        drift: -18 + ((i * 13) % 36),
      })),
    [count],
  );

  return (
    <>
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: `${f.flakeSize}px`,
            height: `${f.flakeSize}px`,
            opacity: isDark ? 0.82 : 0.94,
            boxShadow: '0 0 4px rgba(255,255,255,0.85)',
            ['--snow-drift' as string]: `${f.drift}px`,
            animation: `ambient-snow ${f.dur}s linear infinite`,
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
