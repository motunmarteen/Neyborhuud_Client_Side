'use client';

import { useState, useEffect, useRef } from 'react';
import type L from 'leaflet';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

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

/* ── Leaflet CSS (loaded once) ── */
let leafletCssLoaded = false;
function ensureLeafletCss() {
  if (leafletCssLoaded || typeof document === 'undefined') return;
  leafletCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

function getGreeting(time: TimePeriod, firstName?: string): string {
  const name = firstName ? `, ${firstName}` : '';
  switch (time) {
    case 'dawn': return `Good morning${name}`;
    case 'morning': return `Good morning${name}`;
    case 'afternoon': return `Good afternoon${name}`;
    case 'sunset': return `Good evening${name}`;
    case 'evening': return `Good evening${name}`;
    case 'night': return `Good night${name}`;
  }
}

interface AmbientProfileCardProps {
  avatarUrl?: string | null;
  displayName: string;
  initial: string;
  username: string;
  location: string;
  lat?: number;
  lng?: number;
  profileHref: string;
  onNavigate?: () => void;
  /** Optional: pass user object so we can detect auth and fetch hero stats */
  userId?: string;
}

export default function AmbientProfileCard({
  avatarUrl, displayName, initial, username, location,
  lat, lng, profileHref, onNavigate, userId,
}: AmbientProfileCardProps) {
  const [mounted, setMounted] = useState(false);
  const [currentHour, setCurrentHour] = useState(12);
  const [heroStats, setHeroStats] = useState<{ trustScore: number; totalHuudCoins: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    setMounted(true);
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    console.log('🗺️ Map init check:', { mounted, lat, lng, hasContainer: !!mapContainerRef.current });
    if (!mounted || !lat || !lng || !mapContainerRef.current) return;
    // Prevent double-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      return;
    }

    ensureLeafletCss();
    let map: L.Map | null = null;

    import('leaflet').then((Leaflet) => {
      if (!mapContainerRef.current) {
        console.log('🗺️ Map container gone after import');
        return;
      }
      console.log('🗺️ Leaflet loaded, container size:', 
        mapContainerRef.current.offsetWidth, 'x', mapContainerRef.current.offsetHeight);

      // Fix default marker icons (webpack/next breaks the asset paths)
      delete (Leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = Leaflet.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
      }).setView([lat, lng], 15);

      // CartoDB Voyager — clean, modern, colorful tile style
      Leaflet.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 },
      ).addTo(map);

      // Custom NeyborHuud green marker
      const markerIcon = Leaflet.divIcon({
        html: `<div style="
          width:32px;height:32px;display:flex;align-items:center;justify-content:center;
          background:#008751;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "><div style="
          width:10px;height:10px;background:#fff;border-radius:50%;
        "></div></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      Leaflet.marker([lat, lng], { icon: markerIcon }).addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size after a tick (container might not be fully painted)
      setTimeout(() => map?.invalidateSize(), 100);
      setTimeout(() => map?.invalidateSize(), 500);
    });

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, lat, lng]);

  // Fetch hero stats (Neybor Score + HuudCoins)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    import('@/services/gamification.service').then(({ gamificationService }) => {
      gamificationService.getHeroStats().then((res) => {
        if (!cancelled && res.data) setHeroStats(res.data);
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [userId]);

  const timePeriod = getTimePeriod(currentHour);
  const firstName = displayName.split(' ')[0];
  const greeting = getGreeting(timePeriod, firstName);

  return (
    <div className="overflow-hidden relative group/card" style={{
      borderRadius: '0 0 24px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* ─── Full-bleed map background ─── */}
      <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }}>
        {lat && lng ? (
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #00a86b 0%, #006d3f 40%, #004028 100%)' }}
          />
        )}
      </div>

      {/* ─── Multi-layer overlay for depth & readability ─── */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(0,0,0,0.05) 0%,
              rgba(0,0,0,0.08) 20%,
              rgba(0,0,0,0.22) 40%,
              rgba(0,0,0,0.52) 65%,
              rgba(0,20,10,0.82) 100%
            )
          `,
        }}
      />
      {/* Subtle vignette edges */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Fallback watermark when no coordinates */}
      {!lat && !lng && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined" style={{ fontSize: 80, color: 'rgba(255,255,255,0.06)' }}>
            explore
          </span>
        </div>
      )}

      {/* ─── Profile content, overlaid on map ─── */}
      <div className="relative z-[2] px-4 pt-4 pb-4 flex flex-col justify-end h-full" style={{ minHeight: '260px' }}>

        {/* ── Greeting pill — top-left ── */}
        <div className="mb-auto flex items-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-lg"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              {timePeriod === 'night' || timePeriod === 'evening' ? 'dark_mode' : timePeriod === 'dawn' || timePeriod === 'sunset' ? 'routine' : 'light_mode'}
            </span>
            <span className="text-[11px] font-semibold text-white/80" style={{ letterSpacing: '0.04em' }}>
              {greeting}
            </span>
          </div>
        </div>

        {/* ── Avatar + Identity block ── */}
        <a href={profileHref} onClick={onNavigate} className="flex items-center gap-3 min-w-0 group/profile mt-2">
          {/* Avatar with glow ring + online pulse */}
          <div className="relative shrink-0">
            <MapPinAvatar
              src={avatarUrl}
              alt={displayName}
              fallbackInitial={initial}
              size="lg"
            />
            {/* Online indicator dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
              style={{
                background: '#22c55e',
                border: '2.5px solid rgba(0,20,10,0.8)',
                boxShadow: '0 0 8px rgba(34,197,94,0.5)',
              }}
            />
          </div>

          {/* Name + handle + location */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-extrabold truncate leading-tight text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {displayName}
              </p>
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: '15px', color: '#34d399' }}>
                verified
              </span>
            </div>
            <p className="text-[12px] font-medium truncate mt-0.5 text-white/60">
              @{username}
            </p>
            {location && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '13px', color: '#34d399' }}>
                  location_on
                </span>
                <p className="text-[11px] font-medium truncate text-white/70">
                  {location}
                </p>
              </div>
            )}
          </div>
        </a>

        {/* ── Stats row — Neybor Score + HuudCoins ── */}
        {heroStats && (
          <div className="flex gap-2 mt-3">
            {/* Neybor Score */}
            <div
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(0,135,81,0.2)',
                border: '1px solid rgba(52,211,153,0.2)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#6ee7b7' }}>
                  verified_user
                </span>
                <p className="text-xl font-black leading-none tabular-nums text-white" style={{ letterSpacing: '-0.02em' }}>
                  {heroStats.trustScore}
                </p>
              </div>
              <p className="text-[9px] font-bold uppercase mt-1.5 text-emerald-300/60 text-center" style={{ letterSpacing: '0.08em' }}>
                Neybor Score
              </p>
            </div>
            {/* HuudCoins */}
            <div
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(245,166,35,0.15)',
                border: '1px solid rgba(251,191,36,0.2)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '15px', lineHeight: 1 }} aria-hidden>⭐</span>
                <p className="text-xl font-black leading-none tabular-nums text-white" style={{ letterSpacing: '-0.02em' }}>
                  {heroStats.totalHuudCoins.toLocaleString()}
                </p>
              </div>
              <p className="text-[9px] font-bold uppercase mt-1.5 text-amber-300/60 text-center" style={{ letterSpacing: '0.08em' }}>
                HuudCoins
              </p>
            </div>
          </div>
        )}

        {/* Fallback stats when data hasn't loaded yet */}
        {!heroStats && (
          <div className="flex gap-2 mt-3">
            <div
              className="flex-1 h-[48px] rounded-2xl backdrop-blur-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <div
              className="flex-1 h-[48px] rounded-2xl backdrop-blur-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
