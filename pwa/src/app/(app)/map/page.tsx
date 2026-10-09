'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center mb-4 animate-pulse text-[#00C830] shadow-sm">
        <MapPin size={32} />
      </div>
      <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1">
        Loading Discovery Map...
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs">
        Connecting vector radar and locating your neighborhood...
      </p>
    </div>
  ),
});

export default function MapPage() {
  return <MapComponent />;
}
