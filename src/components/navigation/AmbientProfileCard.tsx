'use client';

import { useState, useEffect, useMemo } from 'react';

export type TimePeriod = 'night' | 'dawn' | 'morning' | 'afternoon' | 'sunset' | 'evening';
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow';

export interface SkyTheme {
  skyGradient: string;
  horizonGlow: string;
  celestialColor: string;
  celestialGlow: string;
  celestialTop: string;
  celestialRight: string;
  celestialSize: number;
  isMoon: boolean;
  textColor: string;
  mutedColor: string;
  showStars: boolean;
  showClouds: boolean;
  showRain: boolean;
  cloudColor: string;
  silhouetteColor: string;
}

export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'sunset';
  if (hour >= 19 && hour < 21) return 'evening';
  return 'night';
}

export function getSkyTheme(time: TimePeriod, weather: WeatherCondition): SkyTheme {
  const isRainy = weather === 'rain' || weather === 'storm';
  const isCloudy = weather === 'cloudy' || isRainy || weather === 'fog';

  const base: Record<TimePeriod, SkyTheme> = {
    night: {
      skyGradient: 'linear-gradient(180deg, #0a0e27 0%, #151b3a 30%, #1a1f4e 60%, #1e2258 100%)',
      horizonGlow: 'radial-gradient(ellipse 120% 40% at 50% 100%, rgba(30,40,80,0.6) 0%, transparent 70%)',
      celestialColor: '#e8e8f0',
      celestialGlow: 'rgba(200,210,255,0.3)',
      celestialTop: '12%',
      celestialRight: '18%',
      celestialSize: 28,
      isMoon: true,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.65)',
      showStars: true,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(40,50,80,0.7)',
      silhouetteColor: '#0a0e1a',
    },
    dawn: {
      skyGradient: 'linear-gradient(180deg, #1a1040 0%, #4a2060 15%, #c0456a 35%, #e8845c 55%, #f5c16c 75%, #fce8a0 100%)',
      horizonGlow: 'radial-gradient(ellipse 100% 50% at 50% 100%, rgba(255,200,100,0.5) 0%, transparent 70%)',
      celestialColor: '#ffe4b0',
      celestialGlow: 'rgba(255,180,80,0.4)',
      celestialTop: '55%',
      celestialRight: '25%',
      celestialSize: 34,
      isMoon: false,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.85)',
      showStars: false,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(255,180,130,0.35)',
      silhouetteColor: '#1a0e20',
    },
    morning: {
      skyGradient: 'linear-gradient(180deg, #3a7bd5 0%, #5a9fe6 25%, #7cb8f0 50%, #a0d4f8 75%, #d4edfc 100%)',
      horizonGlow: 'radial-gradient(ellipse 100% 40% at 70% 20%, rgba(255,255,200,0.25) 0%, transparent 60%)',
      celestialColor: '#fff5d0',
      celestialGlow: 'rgba(255,230,130,0.35)',
      celestialTop: '8%',
      celestialRight: '22%',
      celestialSize: 32,
      isMoon: false,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.85)',
      showStars: false,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(255,255,255,0.6)',
      silhouetteColor: '#2a4a6a',
    },
    afternoon: {
      skyGradient: 'linear-gradient(180deg, #2980b9 0%, #3498db 20%, #56b4e9 45%, #87ceeb 70%, #b0e0f0 100%)',
      horizonGlow: 'radial-gradient(ellipse 80% 40% at 60% 10%, rgba(255,255,220,0.2) 0%, transparent 60%)',
      celestialColor: '#fff8e0',
      celestialGlow: 'rgba(255,240,150,0.4)',
      celestialTop: '6%',
      celestialRight: '35%',
      celestialSize: 30,
      isMoon: false,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.85)',
      showStars: false,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(255,255,255,0.55)',
      silhouetteColor: '#1a3a5a',
    },
    sunset: {
      skyGradient: 'linear-gradient(180deg, #2d1b69 0%, #8e4585 18%, #d4556a 35%, #e8845c 50%, #f5af60 68%, #fcd380 85%, #fce8a0 100%)',
      horizonGlow: 'radial-gradient(ellipse 120% 50% at 40% 100%, rgba(255,160,60,0.6) 0%, transparent 70%)',
      celestialColor: '#ffcc70',
      celestialGlow: 'rgba(255,160,50,0.5)',
      celestialTop: '50%',
      celestialRight: '15%',
      celestialSize: 36,
      isMoon: false,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.85)',
      showStars: false,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(255,150,100,0.4)',
      silhouetteColor: '#1a0e25',
    },
    evening: {
      skyGradient: 'linear-gradient(180deg, #0f1535 0%, #1a1f50 20%, #2d2b6e 40%, #4a3570 60%, #5a3060 80%, #2a1535 100%)',
      horizonGlow: 'radial-gradient(ellipse 100% 40% at 50% 100%, rgba(80,50,100,0.4) 0%, transparent 70%)',
      celestialColor: '#e0e0f0',
      celestialGlow: 'rgba(180,190,255,0.25)',
      celestialTop: '15%',
      celestialRight: '20%',
      celestialSize: 26,
      isMoon: true,
      textColor: '#ffffff',
      mutedColor: 'rgba(255,255,255,0.7)',
      showStars: true,
      showClouds: isCloudy,
      showRain: isRainy,
      cloudColor: 'rgba(50,40,80,0.6)',
      silhouetteColor: '#0a0815',
    },
  };

  const theme = { ...base[time] };

  if (isRainy) {
    theme.skyGradient = time === 'night' || time === 'evening'
      ? 'linear-gradient(180deg, #0d1020 0%, #1a1e30 30%, #2a2e40 60%, #353840 100%)'
      : 'linear-gradient(180deg, #4a5060 0%, #5a6070 25%, #6a7080 50%, #808890 75%, #9aa0a8 100%)';
    theme.silhouetteColor = time === 'night' || time === 'evening' ? '#080a12' : '#3a4050';
  }

  return theme;
}

// --- Sky Scene Elements ---

function Stars() {
  const stars = useMemo(() =>
    Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      w: 1 + (i * 7 + 3) % 3,
      top: (i * 17 + 5) % 80,
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
            width: `${s.w}px`,
            height: `${s.w}px`,
            top: `${s.top}%`,
            left: `${s.left}%`,
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
        {/* Glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: theme.celestialSize * 2.5,
            height: theme.celestialSize * 2.5,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
            animation: 'ambient-pulse 6s ease-in-out infinite',
          }}
        />
        {/* Moon body */}
        <div
          className="relative rounded-full"
          style={{
            width: theme.celestialSize,
            height: theme.celestialSize,
            background: `radial-gradient(circle at 35% 35%, ${theme.celestialColor} 0%, #c8cce0 100%)`,
            boxShadow: `0 0 15px ${theme.celestialGlow}, 0 0 40px ${theme.celestialGlow}`,
          }}
        >
          {/* Craters */}
          <div className="absolute rounded-full" style={{ width: 5, height: 5, top: '25%', left: '55%', background: 'rgba(0,0,0,0.08)' }} />
          <div className="absolute rounded-full" style={{ width: 3, height: 3, top: '55%', left: '30%', background: 'rgba(0,0,0,0.06)' }} />
          <div className="absolute rounded-full" style={{ width: 4, height: 4, top: '45%', left: '60%', background: 'rgba(0,0,0,0.05)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute transition-all duration-[2000ms]" style={{ top: theme.celestialTop, right: theme.celestialRight }}>
      {/* Outer glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: theme.celestialSize * 3.5,
          height: theme.celestialSize * 3.5,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${theme.celestialGlow} 0%, transparent 70%)`,
          animation: 'ambient-pulse 5s ease-in-out infinite',
        }}
      />
      {/* Mid glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: theme.celestialSize * 2,
          height: theme.celestialSize * 2,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          animation: 'ambient-pulse 3s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />
      {/* Sun body */}
      <div
        className="relative rounded-full"
        style={{
          width: theme.celestialSize,
          height: theme.celestialSize,
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
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${scale})`,
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
      <CloudShape x={-8} y={12} scale={1} color={color} speed={14} />
      <CloudShape x={50} y={6} scale={0.75} color={color} speed={18} />
      <CloudShape x={20} y={25} scale={0.6} color={color} speed={10} />
    </>
  );
}

function RainDrops({ isDark }: { isDark: boolean }) {
  const drops = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
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
            left: `${d.left}%`,
            top: '-12px',
            width: '1.5px',
            height: `${d.height}px`,
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
      style={{ height: '32px' }}
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
      {/* Lit windows */}
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

async function fetchWeather(lat: number, lng: number): Promise<WeatherCondition> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code&timezone=auto`
    );
    if (!res.ok) return 'clear';
    const data = await res.json();
    const code = data?.current?.weather_code ?? 0;
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3) return 'cloudy';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 95 && code <= 99) return 'storm';
    return 'clear';
  } catch {
    return 'clear';
  }
}

function getGreeting(time: TimePeriod): string {
  switch (time) {
    case 'dawn': return 'Good morning';
    case 'morning': return 'Good morning';
    case 'afternoon': return 'Good afternoon';
    case 'sunset': return 'Good evening';
    case 'evening': return 'Good evening';
    case 'night': return 'Good night';
  }
}

interface AmbientProfileCardProps {
  avatarUrl?: string | null;
  displayName: string;
  initial: string;
  username: string;
  location: string;
  followerCount: number;
  followingCount: number;
  lat?: number;
  lng?: number;
  profileHref: string;
  onNavigate?: () => void;
}

export default function AmbientProfileCard({
  avatarUrl, displayName, initial, username, location,
  followerCount, followingCount, lat, lng, profileHref, onNavigate,
}: AmbientProfileCardProps) {
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [mounted, setMounted] = useState(false);
  const [currentHour, setCurrentHour] = useState(12); // stable SSR default

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    setMounted(true);
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lat && lng) {
      fetchWeather(lat, lng).then(setWeather);
      const interval = setInterval(() => fetchWeather(lat, lng).then(setWeather), 30 * 60_000);
      return () => clearInterval(interval);
    }
  }, [lat, lng]);

  const timePeriod = getTimePeriod(currentHour);
  const theme = useMemo(() => getSkyTheme(timePeriod, weather), [timePeriod, weather]);
  const greeting = getGreeting(timePeriod);
  const isDark = timePeriod === 'night' || timePeriod === 'evening';

  return (
    <div
      className="relative overflow-hidden transition-all duration-[2000ms]"
      style={{ background: theme.skyGradient, minHeight: 190 }}
    >
      {/* Horizon glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-[2000ms]" style={{ background: theme.horizonGlow }} />

      {/* Stars */}
      {theme.showStars && <Stars />}

      {/* Sun or Moon */}
      <CelestialBody theme={theme} />

      {/* Clouds */}
      {theme.showClouds && <AnimatedClouds color={theme.cloudColor} />}

      {/* Rain */}
      {theme.showRain && <RainDrops isDark={isDark} />}

      {/* City silhouette at bottom */}
      <CitySilhouette color={theme.silhouetteColor} />

      {/* Content */}
      <div className="relative z-10 px-4 pt-4 pb-12">
        {/* Greeting */}
        <p
          className="text-xs font-medium tracking-wide mb-3"
          style={{ color: theme.mutedColor, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          {greeting}
        </p>

        {/* Profile */}
        <a href={profileHref} onClick={onNavigate} className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base" style={{ color: theme.textColor }}>{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: theme.textColor, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
              {displayName}
            </p>
            <p className="text-xs truncate" style={{ color: theme.mutedColor, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              @{username}
            </p>
          </div>
        </a>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 mt-2.5">
            <span className="material-symbols-outlined text-sm" style={{ color: theme.mutedColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              location_on
            </span>
            <p className="text-xs truncate" style={{ color: theme.mutedColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {location}
            </p>
          </div>
        )}

        {/* Follower stats */}
        <div className="flex items-center gap-4 mt-2.5">
          <a href={`${profileHref}?tab=following`} onClick={onNavigate} className="flex items-center gap-1">
            <span className="text-sm font-bold" style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {followingCount.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: theme.mutedColor }}>Following</span>
          </a>
          <a href={`${profileHref}?tab=followers`} onClick={onNavigate} className="flex items-center gap-1">
            <span className="text-sm font-bold" style={{ color: theme.textColor, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {followerCount.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: theme.mutedColor }}>Followers</span>
          </a>
        </div>
      </div>
    </div>
  );
}
