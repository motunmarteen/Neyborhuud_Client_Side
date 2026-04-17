/**
 * FeedSkyHero — Full-width ambient sky scene hero
 * Spans from below TopNav to just before the first post card.
 * Contains weather data + exchange rate overlay + city silhouette.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getTimePeriod,
  getSkyTheme,
  type SkyTheme,
  type WeatherCondition as AmbientWeather,
} from '@/components/navigation/AmbientProfileCard';
import { API_BASE_URL } from '@/lib/api';

interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  wmoCode: number;
}

interface ExchangeRate {
  currency: string;
  symbol: string;
  rate: number;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

/* ── Weather code helpers ── */

/**
 * WMO Weather Interpretation Codes (WW)
 * 0       Clear sky
 * 1-3     Mainly clear / partly cloudy / overcast
 * 45-48   Fog / depositing rime fog
 * 51-55   Drizzle (light/moderate/dense)
 * 56-57   Freezing drizzle
 * 61-65   Rain (slight/moderate/heavy)
 * 66-67   Freezing rain
 * 71-77   Snow / snow grains / ice pellets
 * 80-82   Rain showers (slight/moderate/violent)
 * 85-86   Snow showers
 * 95      Thunderstorm (slight/moderate)
 * 96-99   Thunderstorm with hail
 */
function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Partly Cloudy';
}

function wmoToAmbient(code: number): AmbientWeather {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'clear';
}

/**
 * Map OWM condition id → WMO-equivalent code for the ambient engine.
 * https://openweathermap.org/weather-conditions
 */
function owmIdToWmo(id: number): number {
  if (id >= 200 && id <= 232) return 95; // thunderstorm
  if (id >= 300 && id <= 321) return 51; // drizzle
  if (id >= 500 && id <= 504) return 61; // rain
  if (id === 511) return 66;             // freezing rain
  if (id >= 520 && id <= 531) return 80; // shower rain
  if (id >= 600 && id <= 622) return 71; // snow
  if (id >= 701 && id <= 781) return 45; // fog/mist/haze
  if (id === 800) return 0;             // clear
  if (id === 801) return 1;             // few clouds
  if (id === 802) return 2;             // scattered clouds
  if (id >= 803) return 3;              // overcast
  return 2;
}

function owmIdToCondition(id: number, description: string): string {
  // Use the OWM description directly — it's precise (e.g. "light rain", "shower rain")
  // Just capitalise the first letter
  if (description) return description.charAt(0).toUpperCase() + description.slice(1);
  return interpretWeatherCode(owmIdToWmo(id));
}

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
  if (theme.isMoon) {
    return (
      <div className="absolute transition-all duration-[2000ms]" style={{ top: theme.celestialTop, right: theme.celestialRight }}>
        <div
          className="absolute rounded-full"
          style={{
            width: theme.celestialSize * 2.5, height: theme.celestialSize * 2.5,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
            animation: 'ambient-pulse 6s ease-in-out infinite',
          }}
        />
        <div
          className="relative rounded-full"
          style={{
            width: theme.celestialSize, height: theme.celestialSize,
            background: `radial-gradient(circle at 35% 35%, ${theme.celestialColor} 0%, #c8cce0 100%)`,
            boxShadow: `0 0 15px ${theme.celestialGlow}, 0 0 40px ${theme.celestialGlow}`,
          }}
        >
          <div className="absolute rounded-full" style={{ width: 5, height: 5, top: '25%', left: '55%', background: 'rgba(0,0,0,0.08)' }} />
          <div className="absolute rounded-full" style={{ width: 3, height: 3, top: '55%', left: '30%', background: 'rgba(0,0,0,0.06)' }} />
          <div className="absolute rounded-full" style={{ width: 4, height: 4, top: '45%', left: '60%', background: 'rgba(0,0,0,0.05)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute transition-all duration-[2000ms]" style={{ top: theme.celestialTop, right: theme.celestialRight }}>
      <div
        className="absolute rounded-full"
        style={{
          width: theme.celestialSize * 3.5, height: theme.celestialSize * 3.5,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
          animation: 'ambient-pulse 5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: theme.celestialSize * 2, height: theme.celestialSize * 2,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          animation: 'ambient-pulse 3s ease-in-out infinite', animationDelay: '1s',
        }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: theme.celestialSize, height: theme.celestialSize,
          background: `radial-gradient(circle at 40% 40%, #fff8e8 0%, ${theme.celestialColor} 60%, ${theme.celestialGlow} 100%)`,
          boxShadow: `0 0 20px ${theme.celestialGlow}, 0 0 60px ${theme.celestialGlow}`,
        }}
      />
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

function RainDrops({ isDark }: { isDark: boolean }) {
  const drops = useMemo(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: (i * 13 + 5) % 100,
      height: 10 + (i * 7 + 3) % 18,
      dur: 0.35 + ((i * 11) % 4) / 15,
      delay: ((i * 7) % 25) / 10,
      angle: -10 + ((i * 3) % 8),
    })), []);

  return (
    <>
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: `${d.left}%`, top: '-12px',
            width: '1.5px', height: `${d.height}px`,
            transform: `rotate(${d.angle}deg)`,
            background: isDark
              ? 'linear-gradient(180deg, transparent, rgba(150,180,255,0.5), transparent)'
              : 'linear-gradient(180deg, transparent, rgba(255,255,255,0.5), transparent)',
            borderRadius: '1px',
            animation: `ambient-rain ${d.dur}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function CitySilhouette({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full"
      viewBox="0 0 300 45"
      preserveAspectRatio="none"
      style={{ height: '42px' }}
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
      <rect x="60" y="16" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="93" y="11" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3" />
      <rect x="143" y="9" width="2" height="2" fill="rgba(255,220,100,0.8)" rx="0.3">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
      </rect>
      <rect x="145" y="13" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3" />
      <rect x="195" y="16" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="5s" repeatCount="indefinite" />
      </rect>
      <rect x="229" y="13" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3" />
      <rect x="231" y="17" width="2" height="2" fill="rgba(255,220,100,0.4)" rx="0.3">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <rect x="275" y="20" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3" />
      <rect x="22" y="18" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="4.5s" repeatCount="indefinite" />
      </rect>
      <rect x="54" y="20" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3" />
      <rect x="113" y="24" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3" />
      <rect x="163" y="22" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="6s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ── News Ticker ── */
const NEWS_FEEDS = [
  { url: 'https://punchng.com/feed/', source: 'Punch' },
  { url: 'https://www.vanguardngr.com/feed/', source: 'Vanguard' },
  { url: 'https://www.channelstv.com/feed/', source: 'Channels' },
];

// Multiple proxy fallbacks — tried in order until one works
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const FALLBACK_NEWS: NewsItem[] = [
  { title: 'Tinubu meets state governors over economic reform agenda', link: '#', source: 'Punch' },
  { title: 'CBN holds rates steady as inflation eases to 31.7%', link: '#', source: 'Vanguard' },
  { title: 'Super Eagles squad announced for AFCON qualifier', link: '#', source: 'Channels' },
  { title: 'Lagos-Ibadan Expressway set for completion by Q3 2026', link: '#', source: 'Punch' },
  { title: 'NNPCL records record crude output of 1.8mb/d in March', link: '#', source: 'Vanguard' },
  { title: 'Senate passes new electricity reform bill into law', link: '#', source: 'Channels' },
];

function parseRSSXML(xml: string, source: string): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return [];
    return Array.from(doc.querySelectorAll('item')).slice(0, 4).map((el) => ({
      title: (el.querySelector('title')?.textContent || '')
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim(),
      link: el.querySelector('link')?.textContent?.trim() || '#',
      source,
    })).filter((i) => i.title.length > 4);
  } catch {
    return [];
  }
}

async function fetchFeedWithFallback(feedUrl: string, source: string): Promise<NewsItem[]> {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(feedUrl), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      let xml: string;
      if (contentType.includes('application/json')) {
        // allorigins wraps in { contents: '...' }
        const json = await res.json();
        xml = json.contents as string;
      } else {
        xml = await res.text();
      }
      const items = parseRSSXML(xml, source);
      if (items.length > 0) return items;
    } catch {
      // try next proxy
    }
  }
  return [];
}

function NewsTicker({ items, theme }: { items: NewsItem[]; theme: SkyTheme }) {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (i: number) => {
    if (i === index) return;
    setAnimating(true);
    setTimeout(() => {
      setIndex(i);
      setAnimating(false);
    }, 300);
  };

  useEffect(() => {
    if (items.length < 2) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setAnimating(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[index];

  return (
    <div className="overflow-hidden">
      <div
        style={{
          transform: animating ? 'translateY(-8px)' : 'translateY(0)',
          opacity: animating ? 0 : 1,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        }}
      >
        {/* LIVE + Source */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            LIVE
          </span>
          <span
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: theme.mutedColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {item.source}
          </span>
        </div>
        {/* Headline — 2 lines */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block min-w-0 text-sm font-semibold leading-snug"
          style={{
            color: theme.textColor,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {item.title}
        </a>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function FeedSkyHero() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(FALLBACK_NEWS);

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

  // Fetch weather
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setWeather({ temp: 32, condition: 'Sunny', city: 'Lagos', wmoCode: 0 });
      setWeatherLoading(false);
      return;
    }

    let lastLat = 0;
    let lastLon = 0;
    let lastFetchTime = 0;

    const updateWeather = async (latitude: number, longitude: number, force = false) => {
      const moved = Math.abs(latitude - lastLat) > 0.005 || Math.abs(longitude - lastLon) > 0.005;
      if (!force && lastLat !== 0 && !moved) return;
      lastLat = latitude;
      lastLon = longitude;
      lastFetchTime = Date.now();

      try {
        // Reverse-geocode for city name (always needed)
        let cityName = 'Your Area';
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`,
            { headers: { 'User-Agent': 'NeyborHuud/1.0' }, signal: AbortSignal.timeout(5000) },
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const a = geoData?.address;
            cityName = a?.city_district || a?.town || a?.city || a?.suburb
              || a?.neighbourhood || a?.village || a?.county || a?.state || 'Your Area';
          }
        } catch {
          // geocode failed — cityName stays as default
        }

        // Strategy 1: Backend (OpenWeatherMap) — more accurate real-time data for Nigeria
        const apiBase = API_BASE_URL;
        if (apiBase) {
          try {
            const backendRes = await fetch(
              `${apiBase}/weather/current?lat=${latitude}&lon=${longitude}`,
              { signal: AbortSignal.timeout(6000) },
            );
            if (backendRes.ok) {
              const json = await backendRes.json();
              const w = json?.data?.weather;
              if (w) {
                const owmCondition = w.conditions?.[0];
                const owmId = owmCondition?.id ?? 800;
                const desc = owmCondition?.description ?? '';
                let wmoCode = owmIdToWmo(owmId);
                let condition = owmIdToCondition(owmId, desc);

                // Backend cross-references multiple weather models;
                // trust isRaining/isShowering even if the OWM id looks benign
                if (w.isRaining && wmoCode < 50) {
                  wmoCode = w.isShowering ? 80 : 61;
                  condition = w.isShowering ? 'Rain Showers' : 'Rain';
                }

                // Use backend city name if Nominatim failed
                const city = cityName !== 'Your Area' ? cityName : (w.location?.name || cityName);
                console.log(`[Weather] Backend: ${condition} (OWM id=${owmId} → WMO=${wmoCode}, rain=${w.isRaining}), ${w.temperature?.current}°C, city=${city}`);
                setWeather({ temp: w.temperature?.current ?? 28, condition, city, wmoCode });
                return;
              }
            }
          } catch {
            console.log('[Weather] Backend unavailable, falling back to Open-Meteo');
          }
        }

        // Strategy 2: Open-Meteo multi-model (free, no key) — fallback
        // Query default + UKMO model in parallel; UKMO has better tropical Africa coverage
        const [defaultRes, ukmoRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,rain,showers,precipitation&timezone=auto`,
            { signal: AbortSignal.timeout(6000) },
          ).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,rain,showers,precipitation&models=ukmo_seamless&timezone=auto`,
            { signal: AbortSignal.timeout(6000) },
          ).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const defaultCur = defaultRes?.current;
        const ukmoCur = ukmoRes?.current;
        if (defaultCur) {
          const temp = Math.round(defaultCur.temperature_2m || 31);
          let code = defaultCur.weather_code || 0;
          const rain = defaultCur.rain ?? 0;
          const showers = defaultCur.showers ?? 0;

          // Cross-reference UKMO model — if it detects rain/storm, override
          const ukmoCode = ukmoCur?.weather_code ?? 0;
          const ukmoRain = (ukmoCur?.rain ?? 0) + (ukmoCur?.showers ?? 0) + (ukmoCur?.precipitation ?? 0);
          if (ukmoCode >= 50 && code < 50) {
            code = ukmoCode;
            console.log(`[Weather] UKMO model override: code ${ukmoCode} (rain from UKMO, default said ${defaultCur.weather_code})`);
          }

          // Correct WMO code if rain/showers fields disagree with weather_code
          if ((rain > 0 || showers > 0 || ukmoRain > 0) && code < 50) {
            code = showers > 0 ? 80 : 61;
            console.log(`[Weather] Open-Meteo code corrected: rain=${rain}, showers=${showers}, ukmoRain=${ukmoRain} → code=${code}`);
          }

          setWeather({ temp, condition: interpretWeatherCode(code), city: cityName, wmoCode: code });
        } else {
          setWeather({ temp: 31, condition: 'Partly Cloudy', city: cityName, wmoCode: 2 });
        }
      } catch {
        setWeather({ temp: 31, condition: 'Partly Cloudy', city: 'Your Area', wmoCode: 2 });
      } finally {
        setWeatherLoading(false);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => updateWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setWeather({ temp: 31, condition: 'Partly Cloudy', city: 'Lagos', wmoCode: 2 });
        setWeatherLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );

    // Refresh weather every 10 minutes so conditions update when rain stops/starts
    const refreshInterval = setInterval(() => {
      if (lastLat !== 0) updateWeather(lastLat, lastLon, true);
    }, 10 * 60_000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(refreshInterval);
    };
  }, []);

  // Fetch news — tries 3 CORS proxies per feed, falls back to placeholders
  useEffect(() => {
    const fetchNews = async () => {
      const results = await Promise.allSettled(
        NEWS_FEEDS.map((feed) => fetchFeedWithFallback(feed.url, feed.source))
      );
      const arrays = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
      const total = arrays.reduce((s, a) => s + a.length, 0);

      if (total > 0) {
        // Interleave: Punch[0], Vanguard[0], Channels[0], Punch[1]…
        const max = Math.max(...arrays.map((a) => a.length));
        const interleaved: NewsItem[] = [];
        for (let i = 0; i < max; i++) {
          arrays.forEach((a) => { if (a[i]) interleaved.push(a[i]); });
        }
        setNewsItems(interleaved.slice(0, 12));
      } else {
        // All proxies failed — show curated placeholders
        setNewsItems(FALLBACK_NEWS);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 15 * 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const currencies = [
      { currency: 'USD', symbol: '$' },
      { currency: 'GBP', symbol: '£' },
      { currency: 'EUR', symbol: '€' },
      { currency: 'JPY', symbol: '¥' },
      { currency: 'CNY', symbol: '¥' },
    ];

    const setFallback = () => {
      setRates([
        { currency: 'USD', symbol: '$', rate: 1352.24 },
        { currency: 'GBP', symbol: '£', rate: 1834.16 },
        { currency: 'EUR', symbol: '€', rate: 1594.37 },
        { currency: 'JPY', symbol: '¥', rate: 8.47 },
        { currency: 'CNY', symbol: '¥', rate: 197.53 },
      ]);
    };

    const fetchRates = async () => {
      // Fetch USD as base — every free API tracks USD/NGN accurately.
      // NGN per currency X = r.NGN / r.X (cross-rate math).
      const sources = [
        `https://api.exchangerate-api.com/v4/latest/USD?t=${Date.now()}`,
        `https://open.er-api.com/v6/latest/USD?t=${Date.now()}`,
        // CDN-hosted fallback, updated daily
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json`,
      ];

      for (const url of sources) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();

          // Normalise: exchangerate-api/open.er-api → data.rates
          // fawazahmed0 CDN → data.usd
          const r: Record<string, number> =
            data.rates ?? data.usd ?? {};

          const ngnPerUSD = r['NGN'] ?? r['ngn'] ?? 0;
          if (!ngnPerUSD) continue;

          const parsed = currencies.map((c) => {
            const key = c.currency.toUpperCase();
            const keyLower = c.currency.toLowerCase();
            const foreignPerUSD = r[key] ?? r[keyLower] ?? 0;
            // cross-rate: 1 foreign = ngnPerUSD / foreignPerUSD NGN
            const rate = foreignPerUSD ? Math.round((ngnPerUSD / foreignPerUSD) * 100) / 100 : 0;
            return { ...c, rate };
          });

          if (parsed.some((p) => p.rate > 0)) {
            console.log('[ExchangeRates]', parsed.map(p => `${p.currency}=${p.rate}`).join(', '));
            setRates(parsed);
            setRatesLoading(false);
            return;
          }
        } catch {
          // try next source
        }
      }
      setFallback();
      setRatesLoading(false);
    };

    fetchRates();
    // Refresh every 30 minutes so rates stay live during long sessions
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle exchange rates
  useEffect(() => {
    if (rates.length === 0) return;
    const interval = setInterval(() => setRateIndex((prev) => (prev + 1) % rates.length), 3000);
    return () => clearInterval(interval);
  }, [rates]);

  const currentRate = rates[rateIndex];

  return (
    <div
      className="relative overflow-hidden transition-all duration-[2000ms]"
      style={{ background: theme.skyGradient, height: 185 }}
    >
      {/* Horizon glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-[2000ms]"
        style={{ background: theme.horizonGlow }}
      />

      {/* Stars */}
      {theme.showStars && <Stars />}

      {/* Celestial body */}
      <CelestialBody theme={theme} />

      {/* Clouds */}
      {theme.showClouds && <AnimatedClouds color={theme.cloudColor} />}

      {/* Rain */}
      {theme.showRain && <RainDrops isDark={isDark} />}

      {/* City silhouette */}
      <CitySilhouette color={theme.silhouetteColor} />

      {/* ── Content overlay ── */}
      <div className="relative z-10 px-5 pt-[52px] pb-3 flex flex-col justify-between h-[185px]">

        {/* Weather + Exchange rate row */}
        {weatherLoading ? (
          <div className="animate-pulse flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <div className="h-10 rounded-full w-20 bg-white/15" />
              <div className="h-3 rounded-full w-32 bg-white/15" />
            </div>
            <div className="h-3 rounded-full w-28 bg-white/15" />
          </div>
        ) : weather ? (
          <div className="flex items-baseline justify-between gap-3">
            {/* Temp + condition + city on one line */}
            <div className="flex items-baseline gap-2 min-w-0">
              <p
                className="text-[42px] font-extrabold leading-none tracking-tight shrink-0"
                style={{ color: theme.textColor, textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
              >
                {weather.temp}°
              </p>
              <p
                className="text-sm font-medium truncate"
                style={{ color: theme.mutedColor, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
              >
                {weather.condition}
              </p>
            </div>
            {/* Exchange rate on the right */}
            {!ratesLoading && currentRate && (
              <span
                className="text-xs font-bold whitespace-nowrap shrink-0"
                style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
              >
                1 {currentRate.currency} = ₦{currentRate.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        ) : null}

        {/* News ticker — source + headline on one line */}
        <div className="mt-auto">
          <NewsTicker items={newsItems} theme={theme} />
        </div>
      </div>
    </div>
  );
}
