/**
 * SidebarWeatherWidget — Compact ambient sky weather card for RightSidebar
 * Mirrors the FeedSkyHero data (weather, exchange rates, news) in sidebar form.
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
  source: string;
}

/* ── Weather code helpers ── */

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

function owmIdToWmo(id: number): number {
  if (id >= 200 && id <= 232) return 95;
  if (id >= 300 && id <= 321) return 51;
  if (id >= 500 && id <= 504) return 61;
  if (id === 511) return 66;
  if (id >= 520 && id <= 531) return 80;
  if (id >= 600 && id <= 622) return 71;
  if (id >= 701 && id <= 781) return 45;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id >= 803) return 3;
  return 2;
}

function owmIdToCondition(id: number, description: string): string {
  if (description) return description.charAt(0).toUpperCase() + description.slice(1);
  return interpretWeatherCode(owmIdToWmo(id));
}

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

function SidebarRainDrops({ isDark }: { isDark: boolean }) {
  const drops = useMemo(() =>
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: (i * 13 + 5) % 100,
      height: 8 + (i * 7 + 3) % 12,
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
            left: `${d.left}%`, top: '-10px',
            width: '1px', height: `${d.height}px`,
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

/* ── News helpers ── */

const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

const NEWS_FEEDS = [
  { url: 'https://punchng.com/feed/', source: 'PUNCH' },
  { url: 'https://www.vanguardngr.com/feed/', source: 'VANGUARD' },
  { url: 'https://www.channelstv.com/feed/', source: 'CHANNELS' },
];

const FALLBACK_NEWS: NewsItem[] = [
  { title: 'Stay updated with the latest from your neyborhuud', source: 'NeyborHuud' },
];

async function fetchFeedWithFallback(feedUrl: string, source: string): Promise<NewsItem[]> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(feedUrl), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const items = doc.querySelectorAll('item');
      const result: NewsItem[] = [];
      items.forEach((item) => {
        const title = item.querySelector('title')?.textContent?.trim();
        if (title) result.push({ title, source });
      });
      if (result.length > 0) return result.slice(0, 5);
    } catch { /* try next proxy */ }
  }
  return [];
}

/* ── Main Widget ── */

export default function SidebarWeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [newsIndex, setNewsIndex] = useState(0);

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
    if (!navigator.geolocation) {
      setWeather({ temp: 32, condition: 'Sunny', city: 'Lagos', wmoCode: 0 });
      setWeatherLoading(false);
      return;
    }

    let lastLat = 0;
    let lastLon = 0;

    const updateWeather = async (latitude: number, longitude: number, force = false) => {
      const moved = Math.abs(latitude - lastLat) > 0.005 || Math.abs(longitude - lastLon) > 0.005;
      if (!force && lastLat !== 0 && !moved) return;
      lastLat = latitude;
      lastLon = longitude;

      try {
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
        } catch { /* geocode failed */ }

        // Strategy 1: Backend (OpenWeatherMap)
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

                if (w.isRaining && wmoCode < 50) {
                  wmoCode = w.isShowering ? 80 : 61;
                  condition = w.isShowering ? 'Rain Showers' : 'Rain';
                }

                const city = cityName !== 'Your Area' ? cityName : (w.location?.name || cityName);
                setWeather({ temp: w.temperature?.current ?? 28, condition, city, wmoCode });
                return;
              }
            }
          } catch { /* fall through */ }
        }

        // Strategy 2: Open-Meteo multi-model
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
          const ukmoCode = ukmoCur?.weather_code ?? 0;
          const ukmoRain = (ukmoCur?.rain ?? 0) + (ukmoCur?.showers ?? 0) + (ukmoCur?.precipitation ?? 0);
          if (ukmoCode >= 50 && code < 50) code = ukmoCode;
          if ((rain > 0 || showers > 0 || ukmoRain > 0) && code < 50) {
            code = showers > 0 ? 80 : 61;
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

    const refreshInterval = setInterval(() => {
      if (lastLat !== 0) updateWeather(lastLat, lastLon, true);
    }, 10 * 60_000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(refreshInterval);
    };
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
      const sources = [
        `https://api.exchangerate-api.com/v4/latest/USD?t=${Date.now()}`,
        `https://open.er-api.com/v6/latest/USD?t=${Date.now()}`,
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json`,
      ];

      for (const url of sources) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();
          const r: Record<string, number> = data.rates ?? data.usd ?? {};
          const ngnPerUSD = r['NGN'] ?? r['ngn'] ?? 0;
          if (!ngnPerUSD) continue;

          const parsed = currencies.map((c) => {
            const key = c.currency.toUpperCase();
            const keyLower = c.currency.toLowerCase();
            const foreignPerUSD = r[key] ?? r[keyLower] ?? 0;
            const rate = foreignPerUSD ? Math.round((ngnPerUSD / foreignPerUSD) * 100) / 100 : 0;
            return { ...c, rate };
          });

          if (parsed.some((p) => p.rate > 0)) {
            setRates(parsed);
            setRatesLoading(false);
            return;
          }
        } catch { /* try next */ }
      }
      setFallback();
      setRatesLoading(false);
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle exchange rates
  useEffect(() => {
    if (rates.length === 0) return;
    const interval = setInterval(() => setRateIndex((prev) => (prev + 1) % rates.length), 3000);
    return () => clearInterval(interval);
  }, [rates]);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      const results = await Promise.allSettled(
        NEWS_FEEDS.map((feed) => fetchFeedWithFallback(feed.url, feed.source)),
      );
      const arrays = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
      const total = arrays.reduce((s, a) => s + a.length, 0);

      if (total > 0) {
        const max = Math.max(...arrays.map((a) => a.length));
        const interleaved: NewsItem[] = [];
        for (let i = 0; i < max; i++) {
          arrays.forEach((a) => { if (a[i]) interleaved.push(a[i]); });
        }
        setNewsItems(interleaved.slice(0, 8));
      } else {
        setNewsItems(FALLBACK_NEWS);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 15 * 60_000);
    return () => clearInterval(interval);
  }, []);

  // Cycle news
  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => setNewsIndex((prev) => (prev + 1) % newsItems.length), 6000);
    return () => clearInterval(interval);
  }, [newsItems]);

  const currentRate = rates[rateIndex];
  const currentNews = newsItems[newsIndex];

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-[2000ms]"
      style={{ background: theme.skyGradient, minHeight: 180 }}
    >
      {/* Horizon glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-[2000ms]" style={{ background: theme.horizonGlow }} />

      {/* Stars */}
      {theme.showStars && <SidebarStars />}

      {/* Celestial body */}
      <SidebarCelestial theme={theme} />

      {/* Clouds */}
      {theme.showClouds && <SidebarClouds color={theme.cloudColor} />}

      {/* Rain */}
      {theme.showRain && <SidebarRainDrops isDark={isDark} />}

      {/* City silhouette */}
      <SidebarSilhouette color={theme.silhouetteColor} />

      {/* Content overlay */}
      <div className="relative z-10 p-4 flex flex-col justify-between" style={{ minHeight: 180 }}>
        {weatherLoading ? (
          <div className="animate-pulse flex flex-col gap-2 flex-1 justify-center">
            <div className="h-3 rounded-full w-16 bg-white/15" />
            <div className="h-8 rounded-full w-14 bg-white/15" />
            <div className="h-3 rounded-full w-28 bg-white/15" />
          </div>
        ) : weather ? (
          <>
            {/* Exchange rate */}
            {!ratesLoading && currentRate && (
              <p
                className="text-xs font-bold mt-3"
                style={{ color: theme.textColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                1 {currentRate.currency} = ₦{currentRate.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}

            {/* News ticker */}
            {currentNews && (
              <div className="mt-2 flex items-start gap-1.5">
                <span
                  className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded"
                  style={{
                    background: 'rgba(239,68,68,0.85)',
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  LIVE
                </span>
                <span
                  className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  {currentNews.source}
                </span>
                <p
                  className="text-[10px] leading-tight line-clamp-2"
                  style={{ color: theme.mutedColor, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {currentNews.title}
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
