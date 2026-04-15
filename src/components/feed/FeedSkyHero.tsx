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

/* ── Weather code helpers ── */

function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Showers';
  if (code <= 94) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Partly Cloudy';
}

function wmoToAmbient(code: number): AmbientWeather {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95 && code <= 99) return 'storm';
  return 'clear';
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

/* ── Main Component ── */

export function FeedSkyHero() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);

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

    const updateWeather = async (latitude: number, longitude: number) => {
      const moved = Math.abs(latitude - lastLat) > 0.005 || Math.abs(longitude - lastLon) > 0.005;
      if (lastLat !== 0 && !moved) return;
      lastLat = latitude;
      lastLon = longitude;

      try {
        const [weatherRes, geoRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`, {
            headers: { 'User-Agent': 'NeyborHuud/1.0' },
          }),
        ]);

        let cityName = 'Your Area';
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const a = geoData?.address;
          cityName = a?.city_district || a?.town || a?.city || a?.suburb
            || a?.neighbourhood || a?.village || a?.county || a?.state || 'Your Area';
        }

        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          const temp = Math.round(wData.current?.temperature_2m || 31);
          const code = wData.current?.weather_code || 0;
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/NGN');
        if (res.ok) {
          const data = await res.json();
          const r = data.rates || {};
          const currencies = [
            { currency: 'USD', symbol: '$' },
            { currency: 'GBP', symbol: '£' },
            { currency: 'EUR', symbol: '€' },
            { currency: 'JPY', symbol: '¥' },
            { currency: 'CNY', symbol: '¥' },
          ];
          setRates(currencies.map((c) => ({
            ...c,
            rate: r[c.currency] ? Math.round(1 / r[c.currency]) : 0,
          })));
        } else {
          setFallback();
        }
      } catch {
        setFallback();
      } finally {
        setRatesLoading(false);
      }
    };

    const setFallback = () => {
      setRates([
        { currency: 'USD', symbol: '$', rate: 1580 },
        { currency: 'GBP', symbol: '£', rate: 2010 },
        { currency: 'EUR', symbol: '€', rate: 1720 },
        { currency: 'JPY', symbol: '¥', rate: 11 },
        { currency: 'CNY', symbol: '¥', rate: 218 },
      ]);
    };

    fetchRates();
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
      style={{ background: theme.skyGradient, minHeight: 200 }}
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
      <div className="relative z-10 px-5 pt-5 pb-14 flex flex-col justify-between min-h-[200px]">

        {/* Weather section */}
        {weatherLoading ? (
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-3 rounded-full w-16 bg-white/15" />
            <div className="h-10 rounded-full w-20 bg-white/15" />
            <div className="h-3 rounded-full w-32 bg-white/15" />
          </div>
        ) : weather ? (
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1"
              style={{ color: theme.mutedColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Weather
            </p>
            <p
              className="text-[42px] font-extrabold leading-none tracking-tight"
              style={{ color: theme.textColor, textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
            >
              {weather.temp}°
            </p>
            <p
              className="text-sm mt-1 font-medium"
              style={{ color: theme.mutedColor, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              {weather.condition} · {weather.city}
            </p>
          </div>
        ) : null}

        {/* Exchange rate — frosted glass pill, bottom-left above silhouette */}
        {!ratesLoading && currentRate && (
          <div className="mt-4 self-start">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: theme.textColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                {currentRate.symbol}1 = ₦{currentRate.rate.toLocaleString()}
              </span>
              <span className="w-px h-3 bg-white/25" />
              <div className="flex items-center gap-0.5">
                {rates.map((r, i) => (
                  <span
                    key={r.currency}
                    className="text-[8px] font-bold px-0.5 transition-all"
                    style={{
                      color: i === rateIndex ? theme.textColor : theme.mutedColor,
                      opacity: i === rateIndex ? 1 : 0.5,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {r.currency}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
