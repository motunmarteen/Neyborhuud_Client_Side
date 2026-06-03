/**
 * FeedSkyHero — Full-width ambient sky scene hero
 * Spans from below TopNav to just before the first post card.
 * Contains weather overlay + city silhouette.
 */

'use client';

import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import {
  getTimePeriod,
  getSkyTheme,
  getGreeting,
  type SkyTheme,
} from '@/components/navigation/AmbientProfileCard';
import { wmoToAmbient } from '@/lib/weatherClient';
import { useAmbientWeather } from '@/hooks/useAmbientWeather';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import {
  getExpressiveWeatherLine,
  getHuudComposerPrompt,
} from '@/lib/feedSkyHeroCopy';
import {
  resolveProfileAvatarInitial,
  resolveUserAvatarUrl,
} from '@/lib/userAvatar';

import { CitySilhouette } from '@/components/ambient/CitySilhouette';
import { SkyWeatherEffects } from '@/components/ambient/SkyWeatherEffects';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';

/* ── Sky scene elements ── */

function Stars() {
  const stars = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      w: 1 + (i * 7 + 3) % 3,
      top: (i * 17 + 5) % 75,
      left: (i * 23 + 11) % 100,
      opacity: 0.2 + ((i * 13) % 8) / 10,
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

function CelestialBody({ theme }: { theme: SkyTheme }) {
  const glowSize = theme.isMoon ? theme.celestialSize * 2.5 : theme.celestialSize * 3.5;
  const innerGlowSize = theme.isMoon ? 0 : theme.celestialSize * 2;

  return (
    <div className="feed-sky-celestial pointer-events-none" aria-hidden>
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
      {!theme.isMoon && (
        <div
          className="absolute rounded-full"
          style={{
            width: innerGlowSize,
            height: innerGlowSize,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            animation: 'ambient-pulse 3s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
      )}
      <div
        className="relative rounded-full"
        style={{
          width: theme.celestialSize,
          height: theme.celestialSize,
          background: theme.isMoon
            ? `radial-gradient(circle at 35% 35%, ${theme.celestialColor} 0%, #c8cce0 100%)`
            : `radial-gradient(circle at 40% 40%, #fff8e8 0%, ${theme.celestialColor} 60%, ${theme.celestialGlow} 100%)`,
          boxShadow: theme.isMoon
            ? `0 0 15px ${theme.celestialGlow}, 0 0 40px ${theme.celestialGlow}`
            : `0 0 20px ${theme.celestialGlow}, 0 0 60px ${theme.celestialGlow}`,
        }}
      >
        {theme.isMoon && (
          <>
            <div className="absolute rounded-full" style={{ width: 5, height: 5, top: '25%', left: '55%', background: 'rgba(0,0,0,0.08)' }} />
            <div className="absolute rounded-full" style={{ width: 3, height: 3, top: '55%', left: '30%', background: 'rgba(0,0,0,0.06)' }} />
            <div className="absolute rounded-full" style={{ width: 4, height: 4, top: '45%', left: '60%', background: 'rgba(0,0,0,0.05)' }} />
          </>
        )}
      </div>
    </div>
  );
}

function CloudShape({ x, y, scale, color, speed }: { x: number; y: number; scale: number; color: string; speed: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`, top: `${y}%`, transform: `scale(${scale})`,
        animation: `ambient-float ${speed}s ease-in-out infinite`,
        animationDelay: `${speed * 0.3}s`,
      }}
    >
      <div className="relative" style={{ width: 70, height: 28 }}>
        <div className="absolute rounded-full" style={{ width: 28, height: 20, bottom: 0, left: 4, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 24, height: 24, bottom: 4, left: 16, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 32, height: 26, bottom: 2, left: 26, background: color, filter: 'blur(1px)' }} />
        <div className="absolute rounded-full" style={{ width: 22, height: 18, bottom: 0, left: 44, background: color, filter: 'blur(1px)' }} />
      </div>
    </div>
  );
}

function AnimatedClouds({ color }: { color: string }) {
  return (
    <>
      <CloudShape x={-8} y={15} scale={1} color={color} speed={14} />
      <CloudShape x={50} y={8} scale={0.75} color={color} speed={18} />
      <CloudShape x={20} y={28} scale={0.6} color={color} speed={10} />
    </>
  );
}

/* ── Main Component ── */

export function FeedSkyHero() {
  const { weather, loading: weatherLoading } = useAmbientWeather();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const authUser = mounted ? user : null;
  const huudName = useHuudDisplayName(authUser);

  // SSR-safe hour
  const [currentHour, setCurrentHour] = useState(12);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setCurrentHour(new Date().getHours());
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const timePeriod = getTimePeriod(currentHour);
  const ambientWeather = weather ? wmoToAmbient(weather.wmoCode) : 'clear';
  const theme = useMemo(() => getSkyTheme(timePeriod, ambientWeather), [timePeriod, ambientWeather]);
  const isDark = timePeriod === 'night' || timePeriod === 'evening';
  const greeting = getGreeting(timePeriod, authUser?.firstName, authUser?.username);
  const composerPrompt = getHuudComposerPrompt(timePeriod);
  const avatarUrl = resolveUserAvatarUrl(authUser);
  const avatarInitial = resolveProfileAvatarInitial(authUser, authUser?.username);

  const openComposer = () => {
    window.dispatchEvent(new CustomEvent('open-create-post'));
  };

  const openComposerWithMedia = (e: MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-create-post', { detail: { focusMedia: true } }));
  };

  const expressiveWeather = weather
    ? getExpressiveWeatherLine({
        condition: weather.condition,
        temp: weather.temp,
        huudName,
        ambientWeather,
      })
    : '';

  return (
    <section className="feed-sky-hero">
      <div className="feed-sky-scene relative transition-all duration-[2000ms]">
        <div className="feed-sky-scene__atmosphere" aria-hidden>
          <div
            className="feed-sky-scene__layer feed-sky-scene__layer--gradient"
            style={{ background: theme.skyGradient }}
          />
          <div
            className="feed-sky-scene__layer feed-sky-scene__layer--horizon"
            style={{ background: theme.horizonGlow }}
          />
          <div className="feed-sky-brand-glow pointer-events-none" />

          {theme.showStars && <Stars />}
          <CelestialBody theme={theme} />
          {theme.showClouds && <AnimatedClouds color={theme.cloudColor} />}
          <SkyWeatherEffects theme={theme} isDark={isDark} size="hero" />
        </div>

        <div className="feed-sky-scene__content">
          <div className="feed-sky-scene__weather">
            {weatherLoading ? (
              <div className="feed-sky-scene__weather-skeleton animate-pulse" aria-hidden>
                <div className="feed-sky-scene__weather-skeleton-label" />
                <div className="feed-sky-scene__weather-skeleton-temp" />
                <div className="feed-sky-scene__weather-skeleton-condition" />
              </div>
            ) : weather ? (
              <>
                <p
                  className="feed-sky-scene__label"
                  style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.22)' }}
                >
                  {greeting}
                </p>

                <p
                  className="feed-sky-scene__temp"
                  style={{
                    color: theme.textColor,
                    textShadow: '0 4px 24px rgba(0,0,0,0.38), 0 1px 4px rgba(0,0,0,0.25)',
                  }}
                >
                  {weather.temp}°
                </p>

                <p
                  className="feed-sky-scene__condition"
                  style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.22)' }}
                >
                  {expressiveWeather}
                </p>
              </>
            ) : null}
          </div>

          <div className="feed-sky-scene__composer">
            <BrandPinAvatar
              src={avatarUrl}
              alt={authUser?.firstName || authUser?.username || 'You'}
              fallbackInitial={avatarInitial}
              size="md"
              className="feed-sky-scene__composer-pin"
            />
            <div
              className="feed-sky-scene__composer-pill"
              style={{ color: theme.textColor }}
            >
              <button
                type="button"
                className="feed-sky-scene__composer-text"
                onClick={openComposer}
              >
                {composerPrompt}
              </button>
              <button
                type="button"
                className="feed-sky-scene__composer-media"
                onClick={openComposerWithMedia}
                aria-label="Add photo or video"
              >
                <span className="material-symbols-outlined" aria-hidden="true">perm_media</span>
              </button>
            </div>
          </div>
        </div>

        <CitySilhouette color={theme.silhouetteColor} />
      </div>
    </section>
  );
}
