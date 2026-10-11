'use client';

/**
 * SkyMap — the map home's scene (tracker M-03, part of M-04): the live sky behind, the
 * tilted map in front fading into it at the horizon, and the time-of-day light over the land.
 *
 * The sky follows the real sun for the place on the map (lib/sky.ts). It refreshes every
 * minute. `hour` pins a moment instead (design-kit slider). Stars twinkle only outside calm
 * mode (CSS stops animations there).
 */

import { useEffect, useMemo, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';
import { HuudMap, type LngLat } from '@/components/map/HuudMap';
import { skyAt, skyForHour, type SkyState } from '@/lib/sky';
import { SkyHorizon } from '@/components/map/SkyHorizon';

/** Height of the sky band above the horizon, in px. */
const SKY_BAND = 200;

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
};

export function SkyMap({ center, zoom, hour, label, className = '', onReady, onSky }: SkyMapProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (hour != null) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [hour]);

  const sky = useMemo(() => (hour != null ? skyForHour(hour) : skyAt(now, center)), [hour, now, center]);
  useEffect(() => onSky?.(sky), [sky, onSky]);

  const arcTop = (arc: number) => SKY_BAND - 26 - arc * (SKY_BAND - 70);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(180deg, ${sky.skyTop} 0%, ${sky.skyBot} ${SKY_BAND}px, ${sky.skyBot} 100%)` }}
    >
      {/* Sky: stars, sun (east → west), moon. Decorative. */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: SKY_BAND }} aria-hidden>
        <div className="absolute inset-0" style={{ opacity: sky.starOpacity }}>
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
            opacity: sky.sun.opacity,
            background: `radial-gradient(circle at 40% 40%, #FFFBE8 0%, ${sky.sun.color} 65%)`,
            boxShadow: `0 0 40px 14px ${sky.sun.glow}`,
          }}
        />
        <span
          className="absolute h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${6 + sky.moon.x * 88}%`,
            top: arcTop(sky.moon.arc),
            opacity: sky.moon.opacity,
            background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #DCDDEA 100%)',
            boxShadow: '0 0 26px 6px rgba(220,225,255,.35)',
          }}
        >
          <span className="absolute left-[9px] top-[12px] h-1.5 w-1.5 rounded-full bg-[rgba(150,155,180,.35)]" />
          <span className="absolute left-[19px] top-[19px] h-1 w-1 rounded-full bg-[rgba(150,155,180,.35)]" />
        </span>
      </div>

      {/* The map, its far edge fading into the sky (horizon). */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: `linear-gradient(180deg, transparent 0, transparent ${SKY_BAND - 70}px, #000 ${SKY_BAND + 30}px)`,
          maskImage: `linear-gradient(180deg, transparent 0, transparent ${SKY_BAND - 70}px, #000 ${SKY_BAND + 30}px)`,
        }}
      >
        <HuudMap center={center} zoom={zoom} label={label} className="h-full w-full" onReady={onReady} compassPosition="bottom-right" />
        {/* Time-of-day light over the land: warm at dawn and sunset, blue at night. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: sky.tint, opacity: sky.tintAlpha, mixBlendMode: 'multiply' }}
          aria-hidden
        />
        {/* Sunlight falling on the land, from the sun's side. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 75% 42% at ${6 + sky.sun.x * 88}% ${SKY_BAND + 20}px, ${sky.sunGround}, transparent 72%)` }}
          aria-hidden
        />
      </div>

      {/* Horizon haze: the sky's colour washes over the far land (M-04). */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: SKY_BAND - 50,
          height: 160,
          background: `linear-gradient(180deg, transparent 0%, ${sky.skyBot}cc 30%, ${sky.skyBot}55 62%, transparent 100%)`,
        }}
        aria-hidden
      />
      {/* Far horizon: bush line and trees (palms in the south, acacias in the north). */}
      <SkyHorizon color={sky.skyline} lat={center?.lat} top={SKY_BAND - 52} />
    </div>
  );
}
