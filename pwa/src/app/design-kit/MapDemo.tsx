'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { FilterChip } from '@/components/ui/Chip';
import { NIGERIA_BOUNDS, NIGERIA_VIEW } from '@/lib/nigeriaView';

// MapLibre needs the browser (WebGL), so it loads on the client only.
const HuudMap = dynamic(() => import('@/components/map/HuudMap').then((m) => m.HuudMap), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-[22px] bg-[#B9D99B] motion-reduce:animate-none" />,
});

// Built for the whole of Nigeria: the same map style everywhere.
const PLACES = [
  { name: 'Nigeria', lat: NIGERIA_VIEW.center.lat, lng: NIGERIA_VIEW.center.lng, zoom: NIGERIA_VIEW.zoom },
  { name: 'Kano', lat: 12.0002, lng: 8.5167, zoom: 15 },
  { name: 'Abuja', lat: 9.0765, lng: 7.4986, zoom: 15 },
  { name: 'Enugu', lat: 6.4413, lng: 7.4988, zoom: 15 },
  { name: 'Port Harcourt', lat: 4.8156, lng: 7.0498, zoom: 15 },
  { name: 'Ibadan', lat: 7.3986, lng: 3.9 , zoom: 15 },
  { name: 'Lagos', lat: 6.5059, lng: 3.3667, zoom: 15 },
];

export function MapDemo() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const [active, setActive] = useState('Nigeria');
  const go = (p: (typeof PLACES)[number]) => {
    setActive(p.name);
    if (p.name === 'Nigeria') mapRef.current?.fitBounds(NIGERIA_BOUNDS, { padding: 16, animate: false });
    else mapRef.current?.jumpTo({ center: [p.lng, p.lat], zoom: p.zoom });
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {PLACES.map((p) => (
          <FilterChip key={p.name} active={active === p.name} onClick={() => go(p)}>
            {p.name}
          </FilterChip>
        ))}
      </div>
      <div className="overflow-hidden rounded-[22px]">
        <HuudMap className="h-[420px] w-full" label="Map of Nigeria" onReady={(m) => (mapRef.current = m)} />
      </div>
    </div>
  );
}
