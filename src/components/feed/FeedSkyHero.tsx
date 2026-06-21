/**
 * FeedSkyHero — Full-width ambient sky scene hero with Category shortcuts row.
 * Refined for a premium, sleek hybrid aesthetic (Facebook + Instagram style).
 */

'use client';

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { CreatePostModal } from './CreatePostModal';
import { useSearchParams } from 'next/navigation';
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

/* ── Weather Text Marquee ── */
function WeatherText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [text]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden px-1 whitespace-nowrap mt-0.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
      {isOverflowing ? (
        /* eslint-disable-next-line jsx-a11y/no-distracting-elements */
        <marquee scrollamount="2" className="feed-sky-scene__condition font-bold text-xs text-white/95 w-full">
          {text}
        </marquee>
      ) : (
        <p ref={textRef} className="feed-sky-scene__condition font-bold text-xs text-white/95 inline-block w-auto mx-auto text-center">
          {text}
        </p>
      )}
    </div>
  );
}

/* ── Main Component ── */

export function FeedSkyHero({ below }: { below?: ReactNode }) {
  const { weather, loading: weatherLoading } = useAmbientWeather();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const authUser = mounted ? user : null;
  const huudName = useHuudDisplayName(authUser);

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
  const COMPOSER_PROMPTS = useMemo(() => {
    const name = authUser?.firstName ? `, ${authUser.firstName}` : '';
    const huud = huudName !== 'your neighborhood' && huudName ? huudName : 'your neighborhood';
    
    return [
      `What's happening in ${huud} today${name}?`,
      `Any updates for ${huud}${name}?`,
      'Anything to sell or give away?',
      'Is there an upcoming event?',
      'Looking for work or hiring?',
      'Need help from your Huud?',
      'Spotted something to report?',
      'Share a local FYI with the Huud',
    ];
  }, [authUser?.firstName, huudName]);

  const [displayText, setDisplayText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textContainerRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the text container so the cursor is always visible
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollLeft = textContainerRef.current.scrollWidth;
    }
  }, [displayText]);

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

  // Category labels — used only for the composer "Filtering: X" placeholder.
  // The category navigation itself now lives in the radial dial (FeedRadialCategories).
  const shortcuts = [
    { type: 'marketplace', label: 'Marketplace' },
    { type: 'services', label: 'Services' },
    { type: 'job', label: 'Jobs' },
    { type: 'event', label: 'Events' },
    { type: 'fyi', label: 'FYI' },
    { type: 'help_request', label: 'Help' },
    { type: 'community_alert', label: 'Alerts' },
    { type: 'incident_report', label: 'Safety' },
  ];

  const activeType = searchParams.get('type') || '';

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

                <WeatherText text={expressiveWeather} />
              </>
            ) : null}
          </div>

          {/* Composer: Full-width glass pill with typewriter placeholder + plus button */}
          <div className="feed-sky-scene__composer z-30 w-full flex flex-col px-1">
            <div
              className="feed-sky-scene__composer-pill group w-full"
              style={{ color: theme.textColor, padding: '0.4rem 0.45rem' }}
            >
              {/* Plus / create icon — on the far left */}
              <button
                type="button"
                className="mr-2 flex items-center justify-center relative cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={openComposer}
                aria-label="Create a post"
                style={{ width: 'auto', padding: '0 4px 0 8px', color: 'inherit' }}
              >
                <span className="material-symbols-outlined" aria-hidden="true"
                  style={{ fontSize: '1.4rem', fontWeight: 300 }}>add</span>
              </button>

              <button
                ref={textContainerRef}
                type="button"
                className="feed-sky-scene__composer-text flex-1 text-left px-1 whitespace-nowrap overflow-hidden relative min-w-0"
                onClick={openComposer}
                aria-label="Create a post"
                style={{
                  scrollBehavior: 'smooth'
                }}
              >
                {activeType
                  ? `Filtering: ${shortcuts.find((s) => s.type === activeType)?.label ?? activeType}`
                  : <span aria-hidden="true">{displayText}<span style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 80ms' }}>|</span></span>
                }
              </button>
            </div>
          </div>
        </div>

        <CitySilhouette color={theme.silhouetteColor} />
      </div>

      {/* Below slot — ticker + sentinel render here so sky atmosphere covers them */}
      {below && (
        <div className="feed-sky-below relative z-20">
          {below}
        </div>
      )}

    </section>
  );
}
