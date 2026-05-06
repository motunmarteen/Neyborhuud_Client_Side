'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/api';
import { authService } from '@/services/auth.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

const PRESETS = [
  { label: 'Urban', km: 5,  description: 'Dense city areas' },
  { label: 'Suburban', km: 20, description: 'Town & suburb coverage' },
  { label: 'Rural', km: 50, description: 'Wide rural coverage' },
];

export default function LocationSettingsPage() {
  const router = useRouter();
  const [radius, setRadius] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved radius from local user data
  useEffect(() => {
    const stored = localStorage.getItem('neyborhuud_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const saved = parsed?.settings?.contentRadius;
      if (typeof saved === 'number') setRadius(saved);
    }
    setLoaded(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchAPI('/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ contentRadius: radius }),
      });

      // Update local storage
      const stored = localStorage.getItem('neyborhuud_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          'neyborhuud_user',
          JSON.stringify({ ...parsed, settings: { ...parsed.settings, contentRadius: radius } }),
        );
      }

      toast.success(`Content radius set to ${radius} km`);
    } catch {
      toast.error('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-soft-bg pb-24">
          {/* Header */}
          <div className="sticky top-0 z-50 border-b border-charcoal/5 bg-white/60 backdrop-blur-xl">
            <div className="mx-auto flex max-w-md items-center gap-4 px-6 py-4">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-xl neumorphic"
              >
                <span className="material-symbols-outlined text-[20px] text-charcoal">arrow_back</span>
              </button>
              <h1 className="text-xl font-bold text-charcoal">Location &amp; Radius</h1>
            </div>
          </div>

          <div className="mx-auto max-w-md space-y-6 px-6 py-6">
            {/* Radius slider */}
            <div className="neumorphic rounded-2xl p-6">
              <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-charcoal/40">
                Content Radius
              </h2>
              <p className="mb-5 text-xs text-charcoal/50">
                Show content from within{' '}
                <span className="font-black text-charcoal">{radius} km</span> of your location
              </p>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={100}
                step={5}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-charcoal/10 accent-primary"
              />
              <div className="mt-1 flex justify-between text-[10px] text-charcoal/30 font-bold">
                <span>1 km</span>
                <span>100 km</span>
              </div>

              {/* Tick marks at preset values */}
              <div className="relative mt-3 h-1">
                {PRESETS.map(({ km }) => (
                  <div
                    key={km}
                    style={{ left: `${((km - 1) / 99) * 100}%` }}
                    className="absolute top-0 h-1 w-0.5 -translate-x-0.5 bg-charcoal/20"
                  />
                ))}
              </div>
            </div>

            {/* Preset buttons */}
            <div className="neumorphic rounded-2xl p-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-charcoal/40">
                Quick Presets
              </h2>
              <div className="flex flex-col gap-3">
                {PRESETS.map(({ label, km, description }) => (
                  <button
                    key={km}
                    onClick={() => setRadius(km)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                      radius === km
                        ? 'bg-primary/10 ring-1 ring-primary'
                        : 'neumorphic-inset hover:bg-charcoal/5'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-black ${radius === km ? 'text-primary' : 'text-charcoal'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-charcoal/40">{description}</p>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${radius === km ? 'text-primary' : 'text-charcoal/50'}`}>
                      {km} km
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="neumorphic-btn w-full rounded-2xl py-4"
            >
              <span className="text-xs font-black uppercase tracking-widest text-charcoal">
                {saving ? 'Saving…' : 'Save Radius'}
              </span>
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
