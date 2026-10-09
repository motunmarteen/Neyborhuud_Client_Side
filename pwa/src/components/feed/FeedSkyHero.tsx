/**
 * FeedSkyHero — Atmospheric Sky & Street Radar Dual-State Hero.
 * Starts with a calm, peaceful atmospheric sky & personalized greeting,
 * then smoothly reveals the live Street Radar HUD after 2.5s or on tap.
 */

'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import apiClient from '@/lib/api-client';
import { DEMO_MODE } from '@/lib/demoMode';
import {
  getTimePeriod,
  getSkyTheme,
  getGreeting,
  type SkyTheme,
} from '@/components/navigation/AmbientProfileCard';
import { wmoToAmbient } from '@/lib/weatherClient';
import { useAmbientWeather } from '@/hooks/useAmbientWeather';
import { useAuth } from '@/hooks/useAuth';
import { CitySilhouette } from '@/components/ambient/CitySilhouette';
import { SkyWeatherEffects } from '@/components/ambient/SkyWeatherEffects';

export type RadarCategory = 'all' | 'safety' | 'traffic' | 'infrastructure' | 'community';
export type HeroMode = 'ambient' | 'radar';

export interface RadarSignal {
  id: string;
  sourceType: string;
  category: 'safety' | 'traffic' | 'infrastructure' | 'community';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  approxDistanceMeters: number;
  distanceLabel: string;
  maskedPostcode?: string;
  landmark?: string;
  areaName?: string;
  districtName?: string;
  timestamp: string;
  confirmCount: number;
  witnessCount?: number;
  isVerified: boolean;
}

interface RadarData {
  summary: {
    totalSignals: number;
    safetyCount: number;
    trafficCount: number;
    infrastructureCount: number;
    communityCount: number;
    activeClusterDetected: boolean;
    radarCenter: {
      latitude: number;
      longitude: number;
      district?: string;
      lga?: string;
      state?: string;
    };
  };
  signals: {
    safety: RadarSignal[];
    traffic: RadarSignal[];
    infrastructure: RadarSignal[];
    community: RadarSignal[];
  };
}

export interface FeedSkyHeroProps {
  below?: ReactNode;
  onOpenWhoIsInMyHuud?: () => void;
  onOpenAskSentinel?: () => void;
}

function formatDayLabel(dayName: string): string {
  const lower = dayName.toLowerCase();
  const d = new Date();
  if (lower === 'yesterday') {
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (lower === 'today') {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (lower === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return dayName;
}

/* ── Sky scene ambient elements ── */

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        w: 1 + ((i * 7 + 3) % 3),
        top: (i * 17 + 5) % 75,
        left: (i * 23 + 11) % 100,
        opacity: 0.2 + ((i * 13) % 8) / 10,
        dur: 2 + ((i * 11) % 4),
        delay: ((i * 7) % 30) / 10,
      })),
    [],
  );

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
  const glowSize = theme.isMoon ? theme.celestialSize * 2.2 : theme.celestialSize * 3;

  return (
    <div className="feed-sky-celestial pointer-events-none opacity-80" aria-hidden>
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
      />
    </div>
  );
}

function CloudShape({
  x,
  y,
  scale,
  color,
  speed,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
  speed: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
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
      <CloudShape x={-4} y={14} scale={0.9} color={color} speed={16} />
      <CloudShape x={82} y={10} scale={0.75} color={color} speed={20} />
      <CloudShape x={6} y={54} scale={0.6} color={color} speed={12} />
    </>
  );
}

function getWeatherEmoji(wmoCode: number, isDark: boolean): string {
  if (wmoCode >= 95) return '⛈️';
  if ((wmoCode >= 51 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) return '🌧️';
  if (wmoCode >= 71 && wmoCode <= 77) return '❄️';
  if (wmoCode >= 45 && wmoCode <= 48) return '🌫️';
  if (wmoCode === 2 || wmoCode === 3) return '☁️';
  if (wmoCode === 1) return isDark ? '🌙' : '⛅';
  return isDark ? '✨' : '☀️';
}

/* ── Main Component ── */

export function FeedSkyHero({ below, onOpenWhoIsInMyHuud, onOpenAskSentinel }: FeedSkyHeroProps) {
  const { weather, loading: weatherLoading } = useAmbientWeather();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const authUser = mounted ? user : null;

  // SSR-stable hour: initialized to 12 consistently across SSR and initial hydration render
  const [currentHour, setCurrentHour] = useState(12);
  useEffect(() => {
    setMounted(true);
    setCurrentHour(new Date().getHours());
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const timePeriod = getTimePeriod(currentHour);
  const ambientWeather = weather ? wmoToAmbient(weather.wmoCode) : 'clear';
  const theme = useMemo(() => getSkyTheme(timePeriod, ambientWeather), [timePeriod, ambientWeather]);
  const isDark = theme.isMoon;
  const greeting = getGreeting(timePeriod, authUser?.firstName, authUser?.username);

  // ── Two-State Hero Mode: 'ambient' (Calm Greeting) -> 'radar' (Live Signals) ──
  const [heroMode, setHeroMode] = useState<HeroMode>('ambient');

  // Auto-transition to radar mode after 2.6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroMode('radar');
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  const toggleMode = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHeroMode((prev) => (prev === 'ambient' ? 'radar' : 'ambient'));
  };

  // ── Street Radar State ──
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory>('all');
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [radarData, setRadarData] = useState<RadarData | null>(null);

  useEffect(() => {
    async function fetchRadar() {
      try {
        setLoadingRadar(true);
        const res = await apiClient.get<RadarData>('/geo/radar', {
          params: { radiusMeters: 2000, category: selectedCategory },
        });
        if (res && res.data) {
          setRadarData(res.data);
        }
      } catch {
        // No fabricated signals outside demo mode — a made-up "suspicious
        // vehicle" on a safety radar is misinformation. Show nothing instead.
        if (!DEMO_MODE) {
          setRadarData(null);
          return;
        }
        setRadarData({
          summary: {
            totalSignals: 4,
            safetyCount: 1,
            trafficCount: 1,
            infrastructureCount: 1,
            communityCount: 1,
            activeClusterDetected: false,
            radarCenter: {
              latitude: 6.4474,
              longitude: 3.4723,
              district: 'Lekki Phase 1',
              lga: 'Eti-Osa',
              state: 'Lagos',
            },
          },
          signals: {
            safety: [
              {
                id: 'sig-1',
                sourceType: 'incident',
                category: 'safety',
                title: 'Suspicious Vehicle Reported',
                description: 'Unmarked van idling near Commercial Road with hazard lights on',
                severity: 'high',
                approxDistanceMeters: 250,
                distanceLabel: '250m away',
                maskedPostcode: 'LA 08 *** ** 04',
                timestamp: new Date().toISOString(),
                confirmCount: 4,
                isVerified: true,
              },
            ],
            traffic: [
              {
                id: 'sig-2',
                sourceType: 'fyi',
                category: 'traffic',
                title: 'Admiralty Way Slowdown',
                description: 'Slow traffic moving toward Lekki-Ikoyi link bridge due to lane repair',
                severity: 'medium',
                approxDistanceMeters: 400,
                distanceLabel: '400m away',
                maskedPostcode: 'LA 08 *** ** 12',
                timestamp: new Date().toISOString(),
                confirmCount: 7,
                isVerified: true,
              },
            ],
            infrastructure: [
              {
                id: 'sig-3',
                sourceType: 'fyi',
                category: 'infrastructure',
                title: 'Grid Power Restored',
                description: 'EKEDC 33kV feeder online across Sector 2',
                severity: 'low',
                approxDistanceMeters: 150,
                distanceLabel: '150m away',
                maskedPostcode: 'LA 08 *** ** 01',
                timestamp: new Date().toISOString(),
                confirmCount: 19,
                isVerified: true,
              },
            ],
            community: [
              {
                id: 'sig-4',
                sourceType: 'event',
                category: 'community',
                title: 'Huud Watch Evening Patrol',
                description: 'Volunteer shift active from 8:00 PM to 11:30 PM',
                severity: 'low',
                approxDistanceMeters: 100,
                distanceLabel: '100m away',
                maskedPostcode: 'LA 08 *** ** 09',
                timestamp: new Date().toISOString(),
                confirmCount: 12,
                isVerified: true,
              },
            ],
          },
        });
      } finally {
        setLoadingRadar(false);
      }
    }

    fetchRadar();
  }, [selectedCategory]);

  const allSignalsList: RadarSignal[] = useMemo(() => {
    if (!radarData) return [];
    if (selectedCategory === 'all') {
      return [
        ...radarData.signals.safety,
        ...radarData.signals.traffic,
        ...radarData.signals.infrastructure,
        ...radarData.signals.community,
      ].sort((a, b) => a.approxDistanceMeters - b.approxDistanceMeters);
    }
    return radarData.signals[selectedCategory] || [];
  }, [radarData, selectedCategory]);

  const activeSignal = allSignalsList[activeSignalIndex] || allSignalsList[0] || null;

  const getCategoryTheme = (cat: RadarSignal['category']) => {
    switch (cat) {
      case 'safety':
        return {
          pill: 'bg-red-500/20 text-red-300 border-red-500/30',
          dot: 'bg-red-400',
          icon: 'shield_alert',
          label: 'Safety Alert',
        };
      case 'traffic':
        return {
          pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
          icon: 'traffic',
          label: 'Traffic & Transit',
        };
      case 'infrastructure':
        return {
          pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400',
          icon: 'bolt',
          label: 'Utilities & Power',
        };
      case 'community':
        return {
          pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: 'group',
          label: 'Community & Patrol',
        };
    }
  };

  const activeCategoryTheme = activeSignal ? getCategoryTheme(activeSignal.category) : null;

  return (
    <section className="feed-sky-hero flex flex-col relative overflow-hidden">
      {/* Sky Scene — Atmospheric canvas wrapping both states */}
      <div
        suppressHydrationWarning
        onClick={toggleMode}
        className="relative flex flex-col justify-between overflow-hidden min-h-[64vh] sm:min-h-[460px] md:aspect-[16/9] md:min-h-[500px] md:max-h-[600px] lg:max-h-[620px] cursor-pointer select-none"
      >
        {/* Atmospheric Sky Layers */}
        <div suppressHydrationWarning className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 transition-all duration-[2000ms]"
            style={{ background: theme.skyGradient }}
          />
          <div
            className="absolute inset-0 transition-all duration-[2000ms]"
            style={{ background: theme.horizonGlow }}
          />
          {theme.showStars && <Stars />}
          <CelestialBody theme={theme} />
          {theme.showClouds && <AnimatedClouds color={theme.cloudColor} />}
          <SkyWeatherEffects theme={theme} isDark={isDark} size="hero" />
        </div>

        {/* City Skyline Silhouette — anchored at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none opacity-60">
          <CitySilhouette color={theme.silhouetteColor} height={46} />
        </div>

        {/* ── STATE 1: CALM, PEACEFUL AMBIENT GREETING ── */}
        <div
          className={`absolute inset-0 z-20 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-14 flex flex-col items-center justify-between text-center transition-all duration-700 ease-out ${
            heroMode === 'ambient'
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Top Bar: Balanced distribution */}
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/40 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-md transition-all whitespace-nowrap shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="tracking-tight">Live in {radarData?.summary?.radarCenter?.district || weather?.city || 'Your Huud'}</span>
            </div>

            <button
              type="button"
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 hover:bg-black/55 border border-white/25 hover:border-emerald-400/50 backdrop-blur-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 group whitespace-nowrap shrink-0"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Radar</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                {radarData?.summary?.totalSignals ?? 0}
              </span>
            </button>
          </div>

          {/* Central Weather & Greeting Content */}
          <div className="w-full flex flex-col items-center justify-center my-auto py-2">
            <h1
              suppressHydrationWarning
              className="text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] mb-2 sm:mb-3"
            >
              {greeting}
            </h1>

            {weatherLoading ? (
              <div className="w-full flex flex-col items-center py-4 animate-pulse">
                <div className="h-3.5 w-32 bg-white/20 rounded-full mb-3" />
                <div className="h-10 w-24 bg-white/20 rounded-2xl" />
              </div>
            ) : weather ? (
              <div className="w-full flex flex-col items-center">
                {weather.forecast && weather.forecast.length >= 3 ? (
                  <div className="flex items-center justify-center gap-8 sm:gap-14 md:gap-18 my-2 sm:my-3">
                    {weather.forecast.slice(0, 3).map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col items-center transition-all ${
                          day.isToday ? 'scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className={`${day.isToday ? 'text-lg sm:text-xl mb-1' : 'text-sm sm:text-base mb-1'}`}>
                          {getWeatherEmoji(weather.wmoCode, isDark)}
                        </span>
                        <p
                          className={`${
                            day.isToday
                              ? 'text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight'
                              : 'text-base sm:text-lg md:text-xl font-bold text-white/80'
                          }`}
                          style={{
                            textShadow: day.isToday
                              ? '0 6px 20px rgba(0,0,0,0.45)'
                              : '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          {day.isToday ? weather.temp : day.temp}°
                        </p>
                        <p
                          className={`text-xs sm:text-sm font-medium mt-1.5 ${
                            day.isToday ? 'text-white font-semibold' : 'text-white/70'
                          }`}
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                        >
                          {formatDayLabel(day.dayName)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-5xl sm:text-6xl md:text-7xl font-black text-white"
                    style={{ textShadow: '0 6px 20px rgba(0,0,0,0.45)' }}
                  >
                    {weather.temp}°
                  </p>
                )}

                {/* Condition pill */}
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/40 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
                  <span className="text-sm">{getWeatherEmoji(weather.wmoCode, isDark)}</span>
                  <span>{weather.condition}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Interactive Radar Floating Dock (Anchored right above city silhouette) */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={toggleMode}
              className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/45 hover:bg-black/65 border border-white/25 hover:border-emerald-400/50 backdrop-blur-2xl text-white text-xs sm:text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_36px_rgba(16,185,129,0.25)] transition-all duration-300 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="tracking-tight font-bold">
                {radarData?.summary?.totalSignals ?? 0} street signals nearby
              </span>
              <span className="text-emerald-300 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Open Radar →
              </span>
            </button>
          </div>
        </div>

        {/* ── STATE 2: REARRANGED, CENTRALIZED STREET RADAR HUD ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 z-20 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-14 flex flex-col justify-between items-center text-center transition-all duration-700 ease-out cursor-default ${
            heroMode === 'radar'
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Top HUD Row: Balanced District, Radar Beacon & Weather Pill */}
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm backdrop-blur-md shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live 2km Radar
              </span>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-sm hidden md:inline truncate max-w-[160px]">
                {radarData?.summary?.radarCenter?.district || weather?.city || 'Your Huud'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {weather && (
                <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-black/35 backdrop-blur-xl border border-white/20 text-white text-[11px] font-extrabold shadow-sm whitespace-nowrap shrink-0">
                  <span>{getWeatherEmoji(weather.wmoCode, isDark)}</span>
                  <span>{weather.temp}°C</span>
                </div>
              )}

              {/* Mode Toggle Button back to Sky */}
              <button
                type="button"
                onClick={toggleMode}
                className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-xl text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>🌤️</span>
                <span>Calm View</span>
              </button>
            </div>
          </div>

          {/* Central Section: Category Filter Pills + Spotlight Card */}
          <div className="w-full flex flex-col items-center justify-center my-auto gap-3 py-1">
            {/* Category Filter Pills Row — Centered */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap w-full py-0.5">
              {[
                { key: 'all', label: 'All Signals', count: radarData?.summary?.totalSignals || 0 },
                { key: 'safety', label: '🔴 Safety', count: radarData?.summary?.safetyCount || 0 },
                { key: 'traffic', label: '🟡 Traffic', count: radarData?.summary?.trafficCount || 0 },
                { key: 'infrastructure', label: '🔵 Utilities', count: radarData?.summary?.infrastructureCount || 0 },
                { key: 'community', label: '🟢 Patrol', count: radarData?.summary?.communityCount || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.key as RadarCategory);
                    setActiveSignalIndex(0);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedCategory === tab.key
                      ? 'bg-white text-slate-900 shadow-md ring-1 ring-white/50'
                      : 'bg-black/30 hover:bg-black/45 text-white/90 border border-white/15 backdrop-blur-md'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      selectedCategory === tab.key ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

          {/* Unified Spotlight Glass Card — Consolidated & Pleasing to the eye */}
          <div className="w-full max-w-lg mx-auto">
            {loadingRadar ? (
              <div className="w-full p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 text-center text-white/70 text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[16px] text-emerald-400">progress_activity</span>
                Scanning street signals...
              </div>
            ) : allSignalsList.length === 0 ? (
              <div className="w-full p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center text-white/75 text-xs">
                No active street signals in this category within 2km.
              </div>
            ) : activeSignal && activeCategoryTheme ? (
              <div className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/50 backdrop-blur-xl border border-white/20 shadow-xl transition-all text-left">
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${activeCategoryTheme.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeCategoryTheme.dot}`} />
                      {activeCategoryTheme.label}
                    </span>
                    <span className="text-[10px] text-white/80 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                      {activeSignal.distanceLabel}
                    </span>
                    {activeSignal.maskedPostcode && (
                      <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/20">
                        {activeSignal.maskedPostcode}
                      </span>
                    )}
                    {activeSignal.isVerified && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Confirmed
                      </span>
                    )}
                  </div>

                  {/* Carousel Pagination Controls */}
                  {allSignalsList.length > 1 && (
                    <div className="flex items-center gap-1 text-[11px] text-white/80 shrink-0">
                      <span className="text-[10px] font-mono mr-1">
                        {activeSignalIndex + 1}/{allSignalsList.length}
                      </span>
                      <button
                        type="button"
                        aria-label="Previous signal"
                        onClick={() => setActiveSignalIndex((prev) => (prev > 0 ? prev - 1 : allSignalsList.length - 1))}
                        className="size-5 rounded bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Next signal"
                        onClick={() => setActiveSignalIndex((prev) => (prev < allSignalsList.length - 1 ? prev + 1 : 0))}
                        className="size-5 rounded bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-[13px] sm:text-[14px] font-black text-white mb-0.5 tracking-tight line-clamp-1">
                  {activeSignal.title}
                </h3>
                <p className="text-[11px] sm:text-[12px] text-white/80 line-clamp-2 leading-relaxed">
                  {activeSignal.description}
                </p>

                {/* Footer with Timestamp, Confirmations & Integrated Actions */}
                <div className="flex items-center justify-between text-[10px] text-white/60 mt-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span>{new Date(activeSignal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-white/80 font-medium">
                      <span className="material-symbols-outlined text-[12px] text-emerald-400">thumb_up</span>
                      {activeSignal.confirmCount} confirmed
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenWhoIsInMyHuud && (
                      <button
                        type="button"
                        onClick={onOpenWhoIsInMyHuud}
                        className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[12px] text-emerald-300">groups</span>
                        <span>Around</span>
                      </button>
                    )}
                    {onOpenAskSentinel && (
                      <button
                        type="button"
                        onClick={onOpenAskSentinel}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                        <span>Sentinel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

          {/* Bottom Row: Balanced anchor above city skyline */}
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={toggleMode}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-xl text-white/85 hover:text-white text-xs font-semibold shadow-md transition-all active:scale-95 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>🌤️ Return to Calm Sky</span>
            </button>
          </div>
        </div>
      </div>

      {/* Below slot — ticker renders cleanly connected */}
      {below && <div className="w-full border-t border-black/[0.08] relative z-20 bg-white">{below}</div>}
    </section>
  );
}
