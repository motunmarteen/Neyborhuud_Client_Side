'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/api';
import { authService } from '@/services/auth.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { MiniMap } from '@/components/ui/InteractiveMap';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveProfileAvatarInitial, resolveUserAvatarUrl } from '@/lib/userAvatar';
import { resolveProfileMapCenter, PROFILE_MAP_DEFAULT } from '@/lib/profileSnapHelpers';
import { getGeolocation } from '@/lib/nativeGeolocation';
import apiClient from '@/lib/api-client';

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
  const [user, setUser] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(PROFILE_MAP_DEFAULT);
  const [hasNewLocation, setHasNewLocation] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);

  // Load saved radius and coordinates from local user data
  useEffect(() => {
    const stored = localStorage.getItem('neyborhuud_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      const saved = parsed?.settings?.contentRadius;
      if (typeof saved === 'number') setRadius(saved);
      
      const center = resolveProfileMapCenter(parsed);
      if (center) setMapCenter(center);
    }
    setLoaded(true);
  }, []);

  const handleMapLocationChange = (loc: { lat: number; lng: number }) => {
    setMapCenter(loc);
    setHasNewLocation(true);
  };

  const handleSetLocationGPS = () => {
    const geo = getGeolocation();
    if (!geo) return;
    setDetectingGPS(true);
    geo.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setHasNewLocation(true);
        setDetectingGPS(false);
        toast.success('Current GPS location detected. Click "Save Radius & Location" to apply.');
      },
      (err) => {
        console.error('GPS error:', err.message);
        toast.error('Could not get your location. Check permissions.');
        setDetectingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchAPI('/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ contentRadius: radius }),
      });

      if (hasNewLocation) {
        await apiClient.put('/auth/location/update', {
          type: 'current',
          location: { latitude: mapCenter.lat, longitude: mapCenter.lng },
        });
      }

      // Update local storage
      const stored = localStorage.getItem('neyborhuud_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedUser = {
          ...parsed,
          settings: { ...parsed.settings, contentRadius: radius },
          location: hasNewLocation ? { ...parsed.location, latitude: mapCenter.lat, longitude: mapCenter.lng } : parsed.location
        };
        localStorage.setItem('neyborhuud_user', JSON.stringify(updatedUser));
      }

      toast.success(hasNewLocation ? 'Radius and Location coordinates updated' : `Content radius set to ${radius} km`);
      setHasNewLocation(false);
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
            {/* Map Pinning Card */}
            <div className="neumorphic rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40">
                    Pin Your Location
                  </h2>
                  <p className="text-xs text-charcoal/50">
                    Drag the pin or use GPS to set your community center
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSetLocationGPS}
                  disabled={detectingGPS}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-opacity hover:opacity-85 disabled:opacity-50"
                  title="Detect GPS Location"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {detectingGPS ? 'hourglass_top' : 'my_location'}
                  </span>
                </button>
              </div>

              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-charcoal/10">
                <MiniMap
                  center={mapCenter}
                  height="100%"
                  className="absolute inset-0 h-full w-full"
                  draggable={true}
                  onLocationChange={handleMapLocationChange}
                  showDragHint={true}
                  showNavigationControl={true}
                  customMarkerNode={
                    <BrandPinAvatar
                      src={resolveUserAvatarUrl(user)}
                      alt={user?.firstName || 'User'}
                      fallbackInitial={resolveProfileAvatarInitial(user, user?.username || 'U')}
                      size="marker"
                      priority
                      className="brand-mark-hero drop-shadow-lg"
                    />
                  }
                />
              </div>
            </div>

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
                {saving ? 'Saving…' : 'Save Radius & Location'}
              </span>
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
