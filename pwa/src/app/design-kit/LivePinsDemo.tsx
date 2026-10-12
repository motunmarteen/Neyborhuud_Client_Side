'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type * as maplibregl from 'maplibre-gl';
import { MapLayerChips } from '@/components/map/MapLayerChips';
import { useMapPins } from '@/hooks/useMapPins';
import { LAYERS, LAYER_META, type MapLayer, type MapPin } from '@/lib/mapPins';

const SkyMap = dynamic(() => import('@/components/map/SkyMap').then((m) => m.SkyMap), {
  ssr: false,
  loading: () => <div className="h-[560px] w-full animate-pulse rounded-[22px] bg-[#6BBFF1] motion-reduce:animate-none" />,
});

const ENUGU = { lat: 6.4413, lng: 7.4988 };
// The tilted view looks north, so the samples sit just south of the centre, in view.
const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** SAMPLE pins for the public design kit only (in the app, pins come from /geo/map-pins). */
const SAMPLE: MapPin[] = [
  { id: 's1', layer: 'safety', lat: 6.4410, lng: 7.4986, count: 1, live: true, top: { id: 'x1', title: 'Suspicious movement near the junction', sourceType: 'incident', severity: 'high', createdAt: ago(20) } },
  { id: 's2', layer: 'traffic', lat: 6.4398, lng: 7.4995, count: 2, live: false, top: { id: 'x2', title: 'Go-slow on Ogui Road', sourceType: 'fyi', createdAt: ago(40) } },
  { id: 's3', layer: 'light_water', lat: 6.4415, lng: 7.4998, count: 1, live: false, top: { id: 'x3', title: 'Light don come back', sourceType: 'fyi', createdAt: ago(15) } },
  { id: 's4', layer: 'market', lat: 6.4392, lng: 7.4980, count: 1, live: false, top: { id: 'x4', title: 'Chest freezer for sale', sourceType: 'product', createdAt: ago(300), price: 18_000_000 } },
  { id: 's5', layer: 'work', lat: 6.4404, lng: 7.4977, count: 1, live: false, top: { id: 'x5', title: 'Shop assistant needed', sourceType: 'job', createdAt: ago(600) } },
  { id: 's6', layer: 'events', lat: 6.4419, lng: 7.4989, count: 1, live: false, top: { id: 'x6', title: 'Estate meeting on Saturday', sourceType: 'event_page', createdAt: ago(900) } },
  { id: 's7', layer: 'help', lat: 6.4396, lng: 7.4988, count: 1, live: false, top: { id: 'x7', title: 'Need jumper cables', sourceType: 'help_request', createdAt: ago(25) } },
];

export function LivePinsDemo() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(LAYERS.map((l) => l.key));
  const [opened, setOpened] = useState<MapPin | null>(null);
  const { pins } = useMapPins(map, layers, { sample: SAMPLE, onOpen: setOpened });
  const counts = useMemo(() => {
    const c: Partial<Record<MapLayer, number>> = {};
    for (const p of SAMPLE) c[p.layer] = (c[p.layer] ?? 0) + p.count;
    return c;
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <MapLayerChips active={layers} onChange={setLayers} counts={counts} />
      <div className="relative overflow-hidden rounded-[22px]">
        <SkyMap center={ENUGU} zoom={16.4} className="h-[560px] w-full" label="Sample pins on a map of Enugu" onReady={setMap} weather={null} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-navy">Sample pins</span>
      </div>
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {opened
          ? `${LAYER_META[opened.layer].emoji} ${opened.top.title}${opened.count > 1 ? ` (+${opened.count - 1} more here)` : ''}`
          : `${pins.length} pins on the map. Tap one.`}
      </p>
    </div>
  );
}
