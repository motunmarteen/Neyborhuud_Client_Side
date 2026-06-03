'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-brand-surface flex items-center justify-center mb-4 animate-pulse border border-black/[0.06]">
        <span className="material-symbols-outlined text-[32px] text-primary">map</span>
      </div>
      <h3 className="font-semibold text-brand-black text-base mb-1">Loading Discovery Map...</h3>
      <p className="text-[var(--neu-text-muted)] text-xs">Getting coordinates and drawing the neighbourhood...</p>
    </div>
  ),
});

export default function MapPage() {
  return <MapComponent />;
}
