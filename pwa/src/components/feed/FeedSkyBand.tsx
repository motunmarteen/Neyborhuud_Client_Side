'use client';

/**
 * Top of the Feed, as in the agreed mockup ("the same live sky continues at the top of
 * Gist", now the Feed, owner 2026-10-15): the real sky for the person's area (same as the
 * My Huud map), the palm / acacia horizon, rain when it is really raining, the title and a
 * real weather line. Swipe down on it (or tap "Map") to go back to the map.
 *
 * The big hero, radar, greeting and Pulse live on My Huud now; the Feed is for posts.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCalm } from '@/hooks/useCalm';
import { useMapWeather } from '@/hooks/useMapWeather';
import { SkyHorizon } from '@/components/map/SkyHorizon';
import { skyAt } from '@/lib/sky';
import { WEATHER_WORDS, weatherLook } from '@/lib/mapWeather';
import { extractUserMapCoords, type MapUserLike } from '@/lib/mapUserLocation';
import { userArea } from '@/lib/adsApi';
import { useStarted } from '@/hooks/useStarted';
import { useTranslation } from '@/lib/i18n';

/** Sky band height below the floating top bar. */
const BAND = 112;

export function FeedSkyBand() {
  const { t } = useTranslation();
  // The sky depends on this phone's clock and your area: a plain sky until the page has started.
  const started = useStarted();
  const calm = useCalm();
  const { user } = useAuth();
  const place = useMemo(() => (user ? extractUserMapCoords(user as unknown as MapUserLike) : null), [user]);
  const area = userArea(user);
  const wx = useMapWeather(place);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const sky = useMemo(() => skyAt(now, place), [now, place]);
  const look = started && wx ? weatherLook(wx) : null;
  const rain = !calm && look ? Array.from({ length: Math.min(look.drops, 26) }, (_, i) => i) : [];
  const words = wx ? WEATHER_WORDS[wx] : null;
  const weatherLine = started ? [words ? `${words.icon} ${words.label}` : null, area?.lga ?? null].filter(Boolean).join(' · ') : '';

  // Pulling down from the top of the Feed (this sky included) goes back to the map: see feed/page.tsx.

  return (
    <section
      aria-label={t('feed.title')}
      className="relative overflow-hidden"
      style={{
        height: `calc(var(--safe-top) + var(--app-topnav-height) + ${BAND}px)`,
        background: started ? `linear-gradient(180deg, ${sky.skyTop} 0%, ${sky.skyBot} 100%)` : 'linear-gradient(180deg, #CFE6F5 0%, #EEF2F7 100%)',
        touchAction: 'pan-y',
      }}
    >
      {look ? <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: look.skyWash }} /> : null}
      {!started ? null : sky.sun.up ? (
        <span
          aria-hidden
          className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 rounded-full"
          style={{
            left: `${8 + sky.sun.x * 84}%`,
            top: `calc(var(--safe-top) + var(--app-topnav-height) + ${Math.round(70 - sky.sun.arc * 56)}px)`,
            opacity: sky.sun.opacity * (look?.sunOpacity ?? 1),
            background: `radial-gradient(circle at 40% 40%, #FFFBE8 0%, ${sky.sun.color} 65%)`,
            boxShadow: `0 0 30px 10px ${sky.sun.glow}`,
          }}
        />
      ) : sky.moon.up ? (
        <span
          aria-hidden
          className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 rounded-full bg-[#F4F1EA]"
          style={{
            left: `${8 + sky.moon.x * 84}%`,
            top: `calc(var(--safe-top) + var(--app-topnav-height) + ${Math.round(66 - sky.moon.arc * 50)}px)`,
            opacity: sky.moon.opacity,
            boxShadow: '0 0 18px 4px rgba(244,241,234,0.35)',
          }}
        />
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-11">
        {started ? <SkyHorizon color={sky.skyline} lat={place?.lat} top={0} /> : null}
      </div>
      {rain.length ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {rain.map((i) => (
            <span
              key={i}
              className="nh-drop absolute -top-8 rounded-[2px]"
              style={{
                left: `${(i * 13 + 5) % 100}%`,
                width: look!.dropWidth,
                height: look!.dropLength[0] + ((i * 7) % 8),
                animationDuration: `${look!.dropSpeed + ((i * 11) % 6) / 10}s`,
                animationDelay: `${((i * 7) % 22) / 10}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-3 flex items-end justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-col" style={{ color: started && sky.dark > 0.5 ? '#FFFFFF' : '#1D2433' }}>
          <h1 className="font-heading text-[26px] font-black leading-none drop-shadow-sm">{t('feed.title')}</h1>
          {weatherLine ? <span className="mt-1 truncate text-[13px] font-bold drop-shadow-sm">{weatherLine}</span> : null}
        </div>
        <Link
          href="/huud"
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-white/90 px-3 text-xs font-extrabold text-navy shadow-sm"
          aria-label={t('feed.mapAria')}
        >
          <span aria-hidden className="material-symbols-outlined text-[16px]">
            map
          </span>
          {t('feed.map')}
        </Link>
      </div>
    </section>
  );
}
