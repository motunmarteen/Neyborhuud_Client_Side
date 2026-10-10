'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50  border border-emerald-200/80  flex items-center justify-center mb-4 animate-pulse text-[#00B82E] shadow-sm">
        <MapPin size={32} />
      </div>
      <h3 className="font-extrabold text-slate-900  text-base mb-1">
        Loading Discovery Map...
      </h3>
      <p className="text-slate-500  text-xs">
        Connecting vector radar and locating your neighborhood...
      </p>
    </div>
  ),
});

export default function MapPage() {
  return <MapComponent />;
}
