'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FilterChip } from '@/components/ui/Chip';
import type { SkyState } from '@/lib/sky';
import { MAP_WEATHERS, WEATHER_WORDS, type MapWeather } from '@/lib/mapWeather';

const SkyMap = dynamic(() => import('@/components/map/SkyMap').then((m) => m.SkyMap), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-[22px] bg-[#6BBFF1] motion-reduce:animate-none" />,
});

const PLACES = {
  Enugu: { lat: 6.4413, lng: 7.4988 },
  Kano: { lat: 12.0105, lng: 8.5341 },
} as const;
type Place = keyof typeof PLACES;

const label = (h: number) => `${Math.floor(h) % 24}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

export function SkyDemo() {
  const [place, setPlace] = useState<Place>('Enugu');
  const [live, setLive] = useState(true);
  const [hour, setHour] = useState(18.6);
  const [sky, setSky] = useState<SkyState | null>(null);
  // undefined = the real weather there; otherwise a pinned look.
  const [pinned, setPinned] = useState<MapWeather | undefined>(undefined);
  const [realWx, setRealWx] = useState<MapWeather | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(PLACES) as Place[]).map((p) => (
          <FilterChip key={p} active={place === p} onClick={() => setPlace(p)}>
            {p}
          </FilterChip>
        ))}
        <FilterChip active={live} onClick={() => setLive(true)}>Live sun</FilterChip>
        <FilterChip active={!live} onClick={() => setLive(false)}>Try a time</FilterChip>
        {sky ? <span className="text-sm font-bold text-muted">{sky.phase}</span> : null}
      </div>
      {!live ? (
        <label className="flex items-center gap-3 text-sm font-bold text-navy">
          <span className="w-12 tabular-nums">{label(hour)}</span>
          <input
            type="range"
            min={0}
            max={23.95}
            step={0.05}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="flex-1 accent-[#00B82E]"
            aria-label="Time of day"
          />
        </label>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <FilterChip active={pinned === undefined} onClick={() => setPinned(undefined)}>
          {pinned === undefined && realWx ? `Live: ${WEATHER_WORDS[realWx].icon} ${WEATHER_WORDS[realWx].label}` : 'Live weather'}
        </FilterChip>
        {MAP_WEATHERS.map((w) => (
          <FilterChip key={w} active={pinned === w} onClick={() => setPinned(w)} icon={WEATHER_WORDS[w].icon}>
            {WEATHER_WORDS[w].label}
          </FilterChip>
        ))}
      </div>
      <div className="overflow-hidden rounded-[22px]">
        <SkyMap
          key={place}
          center={PLACES[place]}
          zoom={16}
          hour={live ? undefined : hour}
          weather={pinned}
          className="h-[520px] w-full"
          label={`Map of ${place} under today's sky`}
          onSky={setSky}
          onWeather={pinned === undefined ? setRealWx : undefined}
        />
      </div>
    </div>
  );
}
