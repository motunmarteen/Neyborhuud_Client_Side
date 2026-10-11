'use client';

import dynamic from 'next/dynamic';

// MapLibre needs the browser (WebGL), so it loads on the client only.
const HuudMap = dynamic(() => import('@/components/map/HuudMap').then((m) => m.HuudMap), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-[22px] bg-[#B9D99B] motion-reduce:animate-none" />,
});

export function MapDemo() {
  return (
    <div className="overflow-hidden rounded-[22px]">
      <HuudMap className="h-[420px] w-full" label="Map of Ojuelegba and Surulere, Lagos" />
    </div>
  );
}
