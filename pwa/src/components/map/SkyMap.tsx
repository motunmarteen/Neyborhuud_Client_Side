'use client';

/**
 * SkyMap — the map home's scene (tracker M-03, part of M-04): the live sky behind, the
 * tilted map in front fading into it at the horizon, and the time-of-day light over the land.
 *
 * The sky follows the real sun for the place on the map (lib/sky.ts). It refreshes every
 * minute. `hour` pins a moment instead (design-kit slider). Weather (M-05) follows the real
 * weather there (useMapWeather); `weather` pins a look. Calm mode stops twinkle, drift and
 * ripples (CSS) and skips falling rain and lightning.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';
import { HuudMap, type LngLat } from '@/components/map/HuudMap';
import { skyAt, skyForHour, type SkyState } from '@/lib/sky';
import { SkyHorizon } from '@/components/map/SkyHorizon';
import { cloudColor, weatherLook, type MapWeather, type WeatherLook } from '@/lib/mapWeather';
import { useMapWeather } from '@/hooks/useMapWeather';
import { useCalm } from '@/hooks/useCalm';
import { applyMapLight } from '@/lib/mapNight';
import { useLivingMap } from '@/hooks/useLivingMap';
import type { Jam } from '@/lib/livingMap';
import { TOY_LAYER_ID, type ToyWorldLayer } from '@/lib/toyWorld/toyWorldLayer';

/** Night for the toy-world models: lit windows, dimmer sun. */
function toyDark(map: maplibregl.Map, dark: number) {
  const layer = map.getLayer(TOY_LAYER_ID) as unknown as { implementation?: ToyWorldLayer } | undefined;
  layer?.implementation?.setDark(dark);
}
import { watMinutes } from '@/lib/sky';

/** Unknown weather: no clouds, rain or haze (never a made-up look). */
const NO_WEATHER: WeatherLook = { ...weatherLook('clear'), cloudOpacity: 0, shadows: 0 };

/** Rain drops: spread across the scene with varied length, speed and start. */
function drops(look: WeatherLook) {
  return Array.from({ length: look.drops }, (_, i) => ({
    left: ((i * 13 + 5) % 100) + '%',
    height: look.dropLength[0] + ((i * 7 + 3) % (look.dropLength[1] - look.dropLength[0] + 1)),
    dur: look.dropSpeed + ((i * 11) % 6) / 10,
    delay: ((i * 7) % 22) / 10,
  }));
}

/** Where puddles ripple on the land (fractions of the scene below the horizon). */
const PUDDLES = [[0.22, 0.38, 1.6], [0.62, 0.55, 1.3], [0.85, 0.36, 1.9], [0.3, 0.72, 1.4], [0.66, 0.8, 1.7]] as const;

/** Height of the sky band above the horizon, in px. */
const SKY_BAND = 200;

/** The phone's top safe area (notch / Dynamic Island) in px; CSS env() is not readable from JS directly. */
function safeTopPx(): number {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;visibility:hidden;pointer-events:none;height:var(--safe-top, 0px)';
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h;
}

const STARS = [
  [9, 30], [24, 62], [38, 22], [52, 54], [64, 34], [84, 66], [16, 86], [73, 90], [45, 78], [92, 28], [30, 44], [58, 14],
] as const;

type SkyMapProps = {
  /** Where the map opens; the sun is computed for this place. Without it, all of Nigeria. */
  center?: LngLat;
  zoom?: number;
  /** Pin a mockup hour (0–24) instead of the real time. */
  hour?: number;
  label?: string;
  className?: string;
  onReady?: (map: maplibregl.Map) => void;
  /** Reports the sky so screens can show the phase ("Sunset") or match colours. */
  onSky?: (sky: SkyState) => void;
  /** Pin a weather look instead of the real weather (design kit). null = no weather. */
  weather?: MapWeather | null;
  /** Reports the real weather in use (null when unknown). */
  onWeather?: (wx: MapWeather | null) => void;
  /** Street life: vehicles, people, kids playing football (M-17). Off in calm mode. */
  living?: boolean;
  /** Reported go-slows: street traffic crawls and queues there (M-10). */
  jams?: Jam[];
  /** Map home: swoop-down opening and slow circling (see HuudMap). */
  cinematic?: boolean;
  /** Map home: real buildings as styled 3D models (see HuudMap). */
  toyWorld?: boolean;
  /** Where the compass and the map credit sit (the map home puts them top-right). */
  controlsPosition?: 'top-right' | 'bottom-right';
  /**
   * Extra sky height in px above the usual band (owner, 2026-10-16: the notch should show
   * the sky, not a flat strip). The map home lifts the sky by the notch plus its top
   * controls, so clouds, sun and stars sit behind the status bar and the horizon shows
   * just under the Pulse ribbon. 'safe-top' adds the phone's notch height automatically.
   */
  skyLift?: number | { safeTopPlus: number };
};

export function SkyMap({ center, zoom, hour, label, className = '', onReady, onSky, weather, onWeather, living = true, jams, cinematic = false, toyWorld = false, skyLift = 0, controlsPosition = 'bottom-right' }: SkyMapProps) {
  const liftPlus = typeof skyLift === 'number' ? null : skyLift.safeTopPlus;
  const [lift, setLift] = useState(typeof skyLift === 'number' ? skyLift : 0);
  useEffect(() => {
    if (liftPlus == null) return;
    const measure = () => setLift(Math.round(safeTopPx() + liftPlus));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [liftPlus]);
  const band = SKY_BAND + lift;
  const calm = useCalm();
  const liveWx = useMapWeather(weather === undefined ? center : null);
  const wx = weather === undefined ? liveWx : weather;
  useEffect(() => onWeather?.(wx), [wx, onWeather]);
  const look = wx ? weatherLook(wx) : NO_WEATHER;
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapObj, setMapObj] = useState<maplibregl.Map | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (hour != null) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [hour]);

  const sky = useMemo(() => (hour != null ? skyForHour(hour) : skyAt(now, center)), [hour, now, center]);
  useEffect(() => onSky?.(sky), [sky, onSky]);

  // Night lights (M-06): the map's own colours follow the sky; windows and lamps glow.
  const darkStep = Math.round(sky.dark * 50) / 50;
  useEffect(() => {
    if (mapRef.current) {
      applyMapLight(mapRef.current, darkStep);
      toyDark(mapRef.current, darkStep);
    }
  }, [darkStep]);
  const handleReady = (map: maplibregl.Map) => {
    mapRef.current = map;
    setMapObj(map);
    applyMapLight(map, darkStep);
    toyDark(map, darkStep);
    onReady?.(map);
  };

  const arcTop = (arc: number) => band - 26 - arc * (band - 70);
  const clouds = wx ? cloudColor(wx, sky.dark, sky.skyBot) : '#FFFFFF';

  // Street life follows the local clock (or the pinned hour) and the weather.
  useLivingMap(mapObj, {
    hour: hour ?? watMinutes(now) / 60,
    weather: wx,
    dark: sky.dark,
    enabled: living && !calm,
    jams,
  });
  const rain = calm ? [] : drops(look);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(180deg, ${sky.skyTop} 0%, ${sky.skyBot} ${band}px, ${sky.skyBot} 100%)` }}
    >
      {/* Sky: stars, sun (east → west), moon. Decorative. */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: band }} aria-hidden>
        {/* Weather wash over the sky: cloud cover, harmattan dust, storm. */}
        <div className="absolute inset-0" style={{ background: look.skyWash }} />
        <div className="absolute inset-0" style={{ opacity: look.hidesStars ? 0 : sky.starOpacity }}>
          {STARS.map(([x, y], i) => (
            <span
              key={i}
              className="nh-twinkle absolute rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, animationDelay: `${(i * 0.37) % 2.6}s` }}
            />
          ))}
        </div>
        <span
          className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${6 + sky.sun.x * 88}%`,
            top: arcTop(sky.sun.arc),
            opacity: sky.sun.opacity * look.sunOpacity,
            background: `radial-gradient(circle at 40% 40%, #FFFBE8 0%, ${sky.sun.color} 65%)`,
            boxShadow: `0 0 40px 14px ${sky.sun.glow}`,
          }}
        />
        <span
          className="absolute h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${6 + sky.moon.x * 88}%`,
            top: arcTop(sky.moon.arc),
            opacity: sky.moon.opacity * look.moonOpacity,
            background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #DCDDEA 100%)',
            boxShadow: '0 0 26px 6px rgba(220,225,255,.35)',
          }}
        >
          <span className="absolute left-[9px] top-[12px] h-1.5 w-1.5 rounded-full bg-[rgba(150,155,180,.35)]" />
          <span className="absolute left-[19px] top-[19px] h-1 w-1 rounded-full bg-[rgba(150,155,180,.35)]" />
        </span>
        {/* Clouds drifting across the sky. */}
        <svg viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" style={{ opacity: look.cloudOpacity }}>
          <g className="nh-drift" fill={clouds}>
            <ellipse cx="70" cy="110" rx="38" ry="15" /><circle cx="56" cy="101" r="15" /><circle cx="80" cy="94" r="19" />
            <ellipse cx="300" cy="150" rx="46" ry="16" /><circle cx="284" cy="140" r="17" /><circle cx="312" cy="132" r="22" />
          </g>
          <g className="nh-drift-slow" fill={clouds} opacity=".85">
            <ellipse cx="190" cy="60" rx="34" ry="12" /><circle cx="178" cy="52" r="13" /><circle cx="200" cy="47" r="16" />
            <ellipse cx="360" cy="40" rx="28" ry="10" /><circle cx="350" cy="34" r="11" />
          </g>
        </svg>
      </div>

      {/* The map, its far edge fading into the sky (horizon). */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: `linear-gradient(180deg, transparent 0, transparent ${band - 70}px, #000 ${band + 30}px)`,
          maskImage: `linear-gradient(180deg, transparent 0, transparent ${band - 70}px, #000 ${band + 30}px)`,
        }}
      >
        <HuudMap center={center} zoom={zoom} label={label} className="h-full w-full" onReady={handleReady} compassPosition={controlsPosition} attributionPosition={controlsPosition} cinematic={cinematic} toyWorld={toyWorld} />
        {/* Time-of-day light over the land: warm at dawn and sunset, blue at night. */}
        <div
          className="pointer-events-none absolute inset-0"
          // Dawn and sunset warmth; eases off at night, when the map's own night colours take over.
          style={{ background: sky.tint, opacity: sky.tintAlpha * (1 - sky.dark * 0.8), mixBlendMode: 'multiply' }}
          aria-hidden
        />
        {/* Sunlight falling on the land, from the sun's side. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 75% 42% at ${6 + sky.sun.x * 88}% ${band + 20}px, ${look.sunOpacity < 1 ? 'transparent' : sky.sunGround}, transparent 72%)` }}
          aria-hidden
        />
        {/* Weather haze over the land, harmattan dust, drifting cloud shadows. */}
        <div className="pointer-events-none absolute inset-0" style={{ background: look.mapHaze, opacity: look.mapHazeAlpha }} aria-hidden />
        <div className="pointer-events-none absolute inset-0" style={{ background: '#D9C09A', opacity: look.dust }} aria-hidden />
        <div
          className="nh-drift-slow pointer-events-none absolute inset-0"
          style={{
            opacity: look.shadows,
            background:
              'radial-gradient(ellipse 120px 50px at 25% 55%, rgba(20,30,50,.32), transparent 70%), radial-gradient(ellipse 150px 60px at 75% 75%, rgba(20,30,50,.28), transparent 70%), radial-gradient(ellipse 110px 46px at 65% 45%, rgba(20,30,50,.22), transparent 70%)',
          }}
          aria-hidden
        />
        {/* Rain puddles ripple on the ground. */}
        {look.puddles > 0 ? (
          <div className="pointer-events-none absolute inset-0" style={{ opacity: look.puddles }} aria-hidden>
            {PUDDLES.map(([x, y, d], i) => (
              <span
                key={i}
                className="nh-puddle absolute rounded-[50%] border-[3px] border-white"
                style={{ left: `${x * 100}%`, top: `calc(${band}px + ${y} * (100% - ${band}px))`, animationDuration: `${d}s` }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Horizon haze: the sky's colour washes over the far land (M-04). */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: band - 50,
          height: 160,
          background: `linear-gradient(180deg, transparent 0%, ${sky.skyBot}cc 30%, ${sky.skyBot}55 62%, transparent 100%)`,
        }}
        aria-hidden
      />
      {/* Far horizon: bush line and trees (palms in the south, acacias in the north). */}
      <SkyHorizon color={sky.skyline} lat={center?.lat} top={band - 52} />

      {/* Rain: glowing drops falling at a slant (not in calm mode). */}
      {rain.length ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ transform: 'rotate(8deg) scale(1.15)' }} aria-hidden>
          {rain.map((d, i) => (
            <span
              key={i}
              className="nh-drop absolute -top-8 rounded-[2px]"
              style={{ left: d.left, width: look.dropWidth, height: d.height, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
            />
          ))}
        </div>
      ) : null}
      {/* Lightning flashes now and then in a storm (not in calm mode). */}
      {look.lightning && !calm ? <div className="nh-flash pointer-events-none absolute inset-0 bg-white" aria-hidden /> : null}
    </div>
  );
}
