/**
 * FeedSkyHero — Full-width ambient sky scene hero with Category shortcuts row.
 * Refined for a premium, sleek hybrid aesthetic (Facebook + Instagram style).
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { CreatePostModal } from './CreatePostModal';
import { AutoScrollCarousel } from './FeedDiscoveryBlock';
import { useRouter, useSearchParams } from 'next/navigation';
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

import { CitySilhouette } from '@/components/ambient/CitySilhouette';
import { SkyWeatherEffects } from '@/components/ambient/SkyWeatherEffects';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

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

  const router = useRouter();
  const searchParams = useSearchParams();

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
  const avatarUrl = useMemo(() => resolveUserAvatarUrl(authUser), [authUser]);

  // ── Typewriter effect for the composer placeholder ──
  const COMPOSER_PROMPTS = useMemo(() => [
    composerPrompt,
    'What do you have in mind?',
    'Anything to sell or give away?',
    'Is there an upcoming event?',
    'Looking for work or hiring?',
    'Need help from your Huud?',
    'Spotted something to report?',
    'Share a local FYI with the Huud',
  ], [composerPrompt]);

  const [displayText, setDisplayText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cursor blink
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    const currentPrompt = COMPOSER_PROMPTS[promptIndex % COMPOSER_PROMPTS.length];
    const TYPING_SPEED = 45;
    const DELETING_SPEED = 22;
    const PAUSE_AFTER_FULL = 2200;
    const PAUSE_AFTER_EMPTY = 300;

    if (!isDeleting && displayText === currentPrompt) {
      // Fully typed — pause then start deleting
      typewriterRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_FULL);
    } else if (isDeleting && displayText === '') {
      // Fully deleted — move to next prompt
      typewriterRef.current = setTimeout(() => {
        setIsDeleting(false);
        setPromptIndex((p) => (p + 1) % COMPOSER_PROMPTS.length);
      }, PAUSE_AFTER_EMPTY);
    } else {
      typewriterRef.current = setTimeout(() => {
        setDisplayText(isDeleting
          ? currentPrompt.substring(0, displayText.length - 1)
          : currentPrompt.substring(0, displayText.length + 1)
        );
      }, isDeleting ? DELETING_SPEED : TYPING_SPEED);
    }
    return () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); };
  }, [displayText, isDeleting, promptIndex, COMPOSER_PROMPTS]);

  const openComposer = () => {
    window.dispatchEvent(new CustomEvent('open-create-post'));
  };

  const expressiveWeather = weather
    ? getExpressiveWeatherLine({
        condition: weather.condition,
        temp: weather.temp,
        huudName,
        ambientWeather,
      })
    : '';

  const handleShortcutClick = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('type') === type) {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    router.replace(`/feed?${params.toString()}`);
  };

  const shortcuts = [
    { type: 'marketplace', label: 'Marketplace', imgSrc: '/illustration_marketplace.png', gradient: 'linear-gradient(135deg, #1a4a28 0%, #0d8a3e 50%, #00c431 100%)' },
    { type: 'services', label: 'Services', imgSrc: '/illustration_services.png', gradient: 'linear-gradient(135deg, #1a3a2a 0%, #2a6a4a 50%, #00a555 100%)' },
    { type: 'job', label: 'Jobs', imgSrc: '/illustration_jobs.png', gradient: 'linear-gradient(135deg, #2a1a4a 0%, #6a3a9a 50%, #9a5acf 100%)' },
    { type: 'event', label: 'Events', imgSrc: '/illustration_events.png', gradient: 'linear-gradient(135deg, #1a2a4a 0%, #2a4a8a 50%, #1a56ff 100%)' },
    { type: 'fyi', label: 'FYI', imgSrc: '/illustration_fyi.png', gradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #3a6a9a 100%)' },
    { type: 'help_request', label: 'Help', imgSrc: '/illustration_help.png', gradient: 'linear-gradient(135deg, #4a1a1a 0%, #8a2a2a 50%, #cc3333 100%)' },
    { type: 'community_alert', label: 'Alerts', imgSrc: '/illustration_community_alert.png', gradient: 'linear-gradient(135deg, #5a2010 0%, #9a3f20 50%, #d45a00 100%)' },
    { type: 'incident_report', label: 'Safety', imgSrc: '/illustration_safety.png', gradient: 'linear-gradient(135deg, #300a0a 0%, #601a1a 50%, #a82020 100%)' },
  ];

  const activeType = searchParams.get('type') || '';

  const categoryRow = (
    <AutoScrollCarousel 
      className="category-shortcuts-row w-full px-4 flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none items-start snap-x snap-mandatory"
      interval={4000}
    >
      {shortcuts.map((s) => {
        const isActive = activeType === s.type;
        return (
          <button
            key={s.type}
            onClick={() => handleShortcutClick(s.type)}
            className={`flex-shrink-0 relative w-[100px] aspect-[4/5] rounded-[18px] overflow-hidden group/card shadow-sm cursor-pointer select-none transition-all duration-300 block ${
              isActive 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#121b14] scale-102 opacity-100 shadow-md' 
                : 'opacity-85 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98]'
            }`}
            style={{ background: s.gradient }}
            type="button"
          >
            {/* Full-bleed category photo */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={s.imgSrc}
                alt={s.label}
                fill
                sizes="100px"
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 ${
                  isActive ? 'scale-105' : ''
                }`}
              />
            </div>

            {/* Gradient overlay for text readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Bottom overlaid content */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-2 space-y-0.5 flex flex-col justify-end min-h-[50%]">
              <h4 className="text-[10px] font-black text-white leading-tight uppercase tracking-wider text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {s.label}
              </h4>
              {isActive && (
                <span className="mx-auto px-2 py-0.5 bg-primary text-black text-[8px] font-black rounded-md leading-none uppercase select-none">
                  Active
                </span>
              )}
            </div>
          </button>
        );
      })}
    </AutoScrollCarousel>
  );

  return (
    <section className="feed-sky-hero flex flex-col">
      {/* Sky Scene (Atmospheric gradient backgrounds and weather greeting card) */}
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

        {/* Content overlaid inside the sky scene */}
        <div className="feed-sky-scene__content">
          {/* Centered Glassmorphic Weather Panel */}
          <div 
            className="feed-sky-scene__weather"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {weatherLoading ? (
              <div className="feed-sky-scene__weather-skeleton animate-pulse" aria-hidden>
                <div className="feed-sky-scene__weather-skeleton-label" />
                <div className="feed-sky-scene__weather-skeleton-temp" />
                <div className="feed-sky-scene__weather-skeleton-condition" />
              </div>
            ) : weather ? (
              <>
                <p
                  className="feed-sky-scene__label text-[10px] uppercase tracking-wider font-extrabold text-white/90"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
                >
                  {greeting}
                </p>

                <p
                  className="feed-sky-scene__temp text-4xl font-black text-white"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  {weather.temp}°
                </p>

                <p
                  className="feed-sky-scene__condition font-bold text-xs text-white/95 mt-0.5"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
                >
                  {expressiveWeather}
                </p>
              </>
            ) : null}
          </div>

          {/* Composer: Full-width glass pill with typewriter placeholder + plus button */}
          <div className="feed-sky-scene__composer z-30 w-full">
            {/* Full-width glass pill */}
            <div
              className="feed-sky-scene__composer-pill group flex-1"
              style={{ color: theme.textColor, padding: '0.4rem 0.45rem' }}
            >
              {/* Profile Avatar — on the left */}
              <button
                type="button"
                className="feed-sky-scene__composer-media mr-2 overflow-hidden flex items-center justify-center relative bg-white/95 rounded-full"
                onClick={() => router.push(authUser?.username ? `/profile/${authUser.username}` : '/settings')}
                aria-label="View Profile"
              >
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : authUser?.username ? (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: 'linear-gradient(135deg, #00c431, #009924)' }}>
                    {authUser.username.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--brand-green-dark)' }}>person</span>
                )}
              </button>

              <button
                type="button"
                className="feed-sky-scene__composer-text flex-1 text-left px-1"
                onClick={openComposer}
                aria-label="Create a post"
              >
                {activeType
                  ? `Filtering: ${shortcuts.find((s) => s.type === activeType)?.label ?? activeType}`
                  : <span aria-hidden="true">{displayText}<span style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 80ms' }}>|</span></span>
                }
              </button>

              {/* Plus / create icon — on the right */}
              <button
                type="button"
                className="feed-sky-scene__composer-media ml-2"
                onClick={openComposer}
                aria-label="Create a post"
              >
                <span className="material-symbols-outlined" aria-hidden="true"
                  style={{ fontSize: '1.15rem', fontWeight: 700 }}>add</span>
              </button>
            </div>
          </div>
        </div>

        <CitySilhouette color={theme.silhouetteColor} />
      </div>

      {/* Category Shortcuts wrapper seamlessly blending into the feed */}
      <div className="category-shortcuts-wrapper pt-1 pb-0 relative z-10">
        {categoryRow}
      </div>
    </section>
  );
}
