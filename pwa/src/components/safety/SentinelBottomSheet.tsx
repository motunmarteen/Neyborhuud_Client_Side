'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSentinelBottomSheet } from '@/contexts/SentinelBottomSheetContext';
import { SENTINEL_FEATURES } from '@/lib/sentinel-catalog';
import { SentinelIcon } from '@/components/navigation/AppNavIcon';

const getIconBgClasses = (accent: string) => {
  switch (accent) {
    case 'primary': return 'bg-[#00D431]/10 text-[#00D431] dark:bg-[#00D431]/15';
    case 'blue': return 'bg-[#6B9FFF]/10 text-[#6B9FFF] dark:bg-[#6B9FFF]/15';
    case 'red': return 'bg-[#FF6B6B]/10 text-[#FF6B6B] dark:bg-[#FF6B6B]/15';
    default: return 'bg-black/5 text-neu-text-secondary dark:bg-white/10 dark:text-white/70';
  }
};

export function SentinelBottomSheet() {
  const { isOpen, closeSheet } = useSentinelBottomSheet();
  const [render, setRender] = useState(false);
  const router = useRouter();

  // Mount/unmount animation timing
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      const t = setTimeout(() => setRender(false), 400);
      document.body.style.overflow = '';
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!render) return null;

  // Helpers to grab specific features
  const getFeature = (id: string) => SENTINEL_FEATURES.find(f => f.id === id)!;
  
  const sos = getFeature('sos-center');
  const emergency = getFeature('emergency');
  const sentinelAi = getFeature('sentinel-ai');
  
  const quickActionIds = ['trips', 'tracking', 'geofences', 'fake-call', 'guardians', 'circle', 'panic-pin', 'checkins'];
  const quickActions = quickActionIds.map(getFeature).filter(Boolean);
  
  const listOptionIds = ['status', 'trip-log', 'incidents', 'dashboard'];
  const listOptions = listOptionIds.map(getFeature).filter(Boolean);

  return (
    <div 
      className={`fixed inset-0 z-[10000] flex items-end justify-center transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={closeSheet}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Sheet Panel */}
      <div 
        className={`relative w-full sm:max-w-[600px] max-h-[85vh] overflow-y-auto overscroll-contain bg-[#f9fdf9] dark:bg-[#0A120C] rounded-t-[2rem] rounded-b-none px-4 pt-4 pb-6 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)] border-t border-white/60 dark:border-white/5 transition-transform duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.1)] ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4 shrink-0 bg-black/15 dark:bg-white/20" />

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4 relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00D431]/10 flex items-center justify-center">
               <SentinelIcon active className="w-5 h-5 text-[#00D431]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[20px] font-black leading-tight text-neu-text dark:text-white tracking-tight">
                Safety Toolkit
              </h2>
              <span className="text-[11px] font-bold text-neu-text-secondary dark:text-white/50">
                Protected by Sentinel
              </span>
            </div>
          </div>
          <button 
            onClick={closeSheet} 
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-neu-text-secondary hover:bg-black/10 dark:hover:bg-white/20 transition-colors shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1. CRITICAL ACTIONS (Red Zone) */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Link
            href={sos?.href || '/sos'}
            className="relative overflow-hidden bg-gradient-to-br from-[#FF3B30] to-[#D70015] rounded-sm p-3.5 flex flex-col justify-between shadow-[0_8px_24px_rgba(255,59,48,0.3)] hover:shadow-[0_12px_32px_rgba(255,59,48,0.4)] active:scale-[0.98] transition-all text-white min-h-[90px] group"
            onClick={closeSheet}
          >
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative mb-2.5 z-10 flex">
               <span className="material-symbols-outlined text-[36px] relative z-10" style={{ fontVariationSettings: '"FILL" 1' }}>emergency</span>
            </div>
            <div className="flex flex-col relative z-10">
               <span className="font-black text-[16px] leading-tight drop-shadow-sm tracking-tight mb-0.5">SOS Mode</span>
               <span className="text-[11px] font-medium text-white/90">Slide to alarm</span>
            </div>
          </Link>

          <Link
            href={emergency?.href || '/safety'}
            className="relative overflow-hidden bg-[#FFF5F5] dark:bg-[#1A0A0A] border border-[#FF3B30]/15 dark:border-[#FF3B30]/20 rounded-sm p-3.5 flex flex-col justify-between hover:bg-[#FFE8E8] dark:hover:bg-[#2A1111] active:scale-[0.98] transition-all min-h-[90px] group"
            onClick={closeSheet}
          >
            <div className="mb-2.5 flex">
               <span className="material-symbols-outlined text-[#FF3B30] text-[36px]" style={{ fontVariationSettings: '"FILL" 1' }}>local_police</span>
            </div>
            <div className="flex flex-col">
               <span className="font-bold text-[15px] text-[#FF3B30] dark:text-[#FF4B4B] leading-tight tracking-tight mb-0.5">Report</span>
               <span className="text-[11px] font-medium text-neu-text-secondary dark:text-white/60">Local agencies</span>
            </div>
          </Link>
        </div>

        {/* 2. SENTINEL AI BANNER */}
        {sentinelAi && (
          <Link
            href={sentinelAi.href}
            className="w-full bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] rounded-sm py-2.5 px-3.5 mb-4 flex items-center justify-between text-white shadow-md active:scale-[0.98] transition-transform"
            onClick={closeSheet}
          >
            <div className="flex items-center gap-2.5">
               <span className="material-symbols-outlined text-[#6B9FFF] text-[32px]">psychology</span>
               <div className="flex flex-col">
                 <span className="font-bold text-[13px]">Threat Scanning</span>
                 <span className="text-[10px] text-white/70">AI active in your neighborhood</span>
               </div>
            </div>
            <span className="material-symbols-outlined text-white/50">chevron_right</span>
          </Link>
        )}

        {/* 3. QUICK ACTIONS GRID */}
        <div className="mb-5">
          <h3 className="text-[11px] font-black tracking-widest uppercase text-neu-text-secondary dark:text-white/40 mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {quickActions.map((feature) => {
              // Convert getIconBgClasses to text colors
              const getIconTextClasses = (accent: string) => {
                switch (accent) {
                  case 'primary': return 'text-[#00D431]';
                  case 'blue': return 'text-[#6B9FFF]';
                  case 'red': return 'text-[#FF6B6B]';
                  default: return 'text-[#9FBBA0] dark:text-[#9FBBA0]';
                }
              };
              
              return (
                <Link
                  key={feature.id}
                  href={feature.href}
                  className="flex flex-col items-center justify-start text-center gap-1 group transition-transform duration-200 active:scale-95"
                  onClick={closeSheet}
                >
                  <span className={`material-symbols-outlined text-[48px] sm:text-[52px] ${getIconTextClasses(feature.accent)} transition-opacity group-hover:opacity-80`} style={{ fontVariationSettings: '"FILL" 1' }}>
                    {feature.icon}
                  </span>
                  <span className="font-bold text-[10px] sm:text-[11px] text-neu-text dark:text-white leading-tight px-0.5">
                    {feature.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. LIST OPTIONS */}
        <div className="bg-white dark:bg-white/5 rounded-sm border border-black/5 dark:border-white/5 overflow-hidden mb-4 shadow-sm">
           {listOptions.map((feature, index) => (
             <Link
               key={feature.id}
               href={feature.href}
               className={`flex items-center gap-2.5 py-2.5 px-3.5 active:bg-black/5 dark:active:bg-white/10 transition-colors ${index !== listOptions.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
               onClick={closeSheet}
             >
               <span className={`material-symbols-outlined text-[28px] ${
                  feature.accent === 'primary' ? 'text-[#00D431]' : 
                  feature.accent === 'blue' ? 'text-[#6B9FFF]' : 
                  feature.accent === 'red' ? 'text-[#FF6B6B]' : 
                  'text-[#9FBBA0] dark:text-[#9FBBA0]'
               }`} style={{ fontVariationSettings: '"FILL" 1' }}>{feature.icon}</span>
               <span className="font-bold text-[13px] text-neu-text dark:text-white flex-1">{feature.label}</span>
               <span className="material-symbols-outlined text-neu-text-secondary/50 dark:text-white/30 text-[18px]">chevron_right</span>
             </Link>
           ))}
        </div>

        {/* 5. MANAGE SENTINEL SETTINGS */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neu-text dark:text-white font-bold text-[13px] transition-colors active:scale-[0.98]"
          onClick={() => {
            closeSheet();
            router.push('/safety/manage');
          }}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Manage Sentinel Settings
        </button>
      </div>
    </div>
  );
}
