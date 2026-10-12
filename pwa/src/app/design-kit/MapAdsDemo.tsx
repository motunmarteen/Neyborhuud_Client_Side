'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type * as maplibregl from 'maplibre-gl';
import { useMapAds } from '@/hooks/useMapAds';
import { boardInk } from '@/components/map/AdBoard';
import type { Ad } from '@/lib/adsApi';
import type { SkyState } from '@/lib/sky';

const SkyMap = dynamic(() => import('@/components/map/SkyMap').then((m) => m.SkyMap), {
  ssr: false,
  loading: () => <div className="h-[560px] w-full animate-pulse rounded-[22px] bg-[#6BBFF1] motion-reduce:animate-none" />,
});

const ENUGU = { lat: 6.4413, lng: 7.4988 };
const base = { status: 'active', weeks: 1, price: { currency: 'HC', amount: 1500 }, area: { lga: 'Enugu North', state: 'Enugu' }, createdAt: '' } as const;

/** SAMPLE ads for the public design kit only (in the app they come from /ads/map). */
const SAMPLE: Ad[] = [
  { ...base, _id: 'b1', kind: 'billboard', title: "Mama Bisi's Kitchen", line: 'Hot amala till 9pm', colour: '#E8892B', location: { lat: 6.4405, lng: 7.4983 } },
  { ...base, _id: 'b2', kind: 'billboard', title: 'Chidi Phones', line: 'Screen repair in 1 hour', colour: '#2B6AA6', location: { lat: 6.4397, lng: 7.4996 } },
  { ...base, _id: 'p1', kind: 'sponsored_pin', pinLayer: 'market', title: 'Ada Fabrics', colour: '#8B5CF6', location: { lat: 6.4414, lng: 7.5003 } },
];

const WALL_SAMPLE: Record<string, { title: string; colour: string }> = {
  '0:1': { title: 'Ada Fabrics', colour: '#8B5CF6' },
  '1:4': { title: 'Chidi Phones', colour: '#2B6AA6' },
  '2:2': { title: "Bisi's", colour: '#E8892B' },
  '3:5': { title: 'Gym 042', colour: '#0E8A3E' },
  '4:0': { title: 'Uche Tailor', colour: '#B5544A' },
};

export function MapAdsDemo() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [night, setNight] = useState(false);
  const [sky, setSky] = useState<SkyState | null>(null);
  const [opened, setOpened] = useState<Ad | null>(null);
  useMapAds(map, { dark: sky?.dark ?? 0, sample: SAMPLE, onOpen: setOpened });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[false, true].map((n) => (
          <button
            key={String(n)}
            type="button"
            aria-pressed={night === n}
            onClick={() => setNight(n)}
            className={`min-h-11 rounded-full border px-4 text-sm font-bold ${night === n ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy'}`}
          >
            {n ? '🌙 Night' : '☀️ Day'}
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-[22px]">
        <SkyMap
          center={ENUGU}
          zoom={16.4}
          hour={night ? 20.5 : 13}
          className="h-[560px] w-full"
          label="Sample billboards on a map of Enugu"
          onReady={setMap}
          onSky={setSky}
          weather={null}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-navy">Sample ads</span>
      </div>
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {opened ? `Opened: ${opened.title}${opened.line ? `. ${opened.line}` : ''}` : 'Tap a billboard or the sponsored pin.'}
      </p>

      <h3 className="mt-2 font-heading text-base font-extrabold text-navy">Ad Wall (sample, 6 × 6 of 12 × 12)</h3>
      <div className="nh-wall max-w-xs" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        {Array.from({ length: 36 }, (_, i) => {
          const p = WALL_SAMPLE[`${Math.floor(i / 6)}:${i % 6}`];
          return (
            <span key={i} className="nh-wall__plot" data-state={p ? 'live' : i === 20 ? 'taken' : 'free'} style={p ? { background: p.colour, color: boardInk(p.colour) } : undefined}>
              {p?.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}
