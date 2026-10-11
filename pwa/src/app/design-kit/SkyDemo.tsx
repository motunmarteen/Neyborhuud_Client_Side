'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FilterChip } from '@/components/ui/Chip';
import type { SkyState } from '@/lib/sky';

const SkyMap = dynamic(() => import('@/components/map/SkyMap').then((m) => m.SkyMap), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-[22px] bg-[#6BBFF1] motion-reduce:animate-none" />,
});

const ENUGU = { lat: 6.4413, lng: 7.4988 };
const label = (h: number) => `${Math.floor(h) % 24}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

export function SkyDemo() {
  const [live, setLive] = useState(true);
  const [hour, setHour] = useState(18.6);
  const [sky, setSky] = useState<SkyState | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={live} onClick={() => setLive(true)}>Live (real sun, Enugu)</FilterChip>
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
      <div className="overflow-hidden rounded-[22px]">
        <SkyMap center={ENUGU} zoom={16} hour={live ? undefined : hour} className="h-[520px] w-full" label="Map of Enugu under today's sky" onSky={setSky} />
      </div>
    </div>
  );
}
