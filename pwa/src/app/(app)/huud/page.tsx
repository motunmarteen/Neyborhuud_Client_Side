'use client';

/**
 * My Huud: the map home (tracker Phase 3; decision 2026-10-10 "Home becomes the live map
 * under the real sky"). The person's area under the real sky and weather, with street life,
 * live pins in layers, and map ads. Opens on the person's area, or on all of Nigeria when it
 * is not known (never a Lagos default). Tapping a pin opens its panel (M-09); the feed is one
 * tap away ("List").
 */

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type * as maplibregl from 'maplibre-gl';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { MapLayerChips } from '@/components/map/MapLayerChips';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useAuth } from '@/hooks/useAuth';
import { useMapPins } from '@/hooks/useMapPins';
import { useMapAds } from '@/hooks/useMapAds';
import { LAYERS, LAYER_META, pinHref, shortNaira, type MapLayer, type MapPin } from '@/lib/mapPins';
import { openAdTarget, type Ad } from '@/lib/adsApi';
import { startView, STREET_ZOOM } from '@/lib/nigeriaView';
import { formatTimeAgo } from '@/utils/timeAgo';
import type { SkyState } from '@/lib/sky';

const SkyMap = dynamic(() => import('@/components/map/SkyMap').then((m) => m.SkyMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#9ED3F5] motion-reduce:animate-none" />,
});

const MAIN_BTN =
  'inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-5 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark';
const SOFT_BTN =
  'inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line bg-white px-5 text-[15px] font-bold text-navy transition-colors hover:bg-background';
const FLOAT_BTN =
  'pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/95 px-4 text-sm font-extrabold text-navy shadow-[0_4px_14px_rgba(29,36,51,0.18)] transition-colors hover:bg-white';

export default function HuudMapHomePage() {
  const { user, isLoading } = useAuth();
  // Wait for the profile so the map opens on the person's own area, not a jump from Nigeria.
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#9ED3F5]">
      <TopNav />
      {isLoading ? <div className="h-full w-full animate-pulse bg-[#9ED3F5] motion-reduce:animate-none" /> : <MapHome user={user} />}
      <BottomNav />
    </div>
  );
}

function MapHome({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const router = useRouter();
  const view = useMemo(() => startView(user), [user]);
  const knowsArea = view.zoom >= STREET_ZOOM;
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [sky, setSky] = useState<SkyState | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(LAYERS.map((l) => l.key));
  const [pin, setPin] = useState<MapPin | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [locating, setLocating] = useState(false);

  const { status, pins } = useMapPins(map, layers, { onOpen: setPin });
  useMapAds(map, { dark: sky?.dark ?? 0, onOpen: setAd });

  const counts = useMemo(() => {
    const c: Partial<Record<MapLayer, number>> = {};
    for (const p of pins) c[p.layer] = (c[p.layer] ?? 0) + p.count;
    return c;
  }, [pins]);

  const locate = useCallback(() => {
    if (!map || !('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: STREET_ZOOM + 0.5 });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [map]);

  const hint =
    status === 'zoom-in'
      ? knowsArea
        ? 'Zoom in to see what is happening'
        : 'Zoom in to your area to see what is happening'
      : status === 'error'
        ? 'Could not load what is happening here'
        : status === 'ready' && pins.length === 0 && layers.length > 0
          ? 'All quiet here right now'
          : null;

  return (
    <>
      <SkyMap
        center={knowsArea ? view.center : undefined}
        zoom={view.zoom}
        className="h-full w-full"
        label={knowsArea ? 'Live map of your area' : 'Live map of Nigeria'}
        onReady={setMap}
        onSky={setSky}
      />

      {/* Layer chips under the top bar (the sky band stays visible behind them). */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--app-topnav-height)+var(--safe-top,0px)+0.25rem)] z-10 px-3">
        <div className="pointer-events-auto mx-auto max-w-xl">
          <MapLayerChips active={layers} onChange={setLayers} counts={counts} />
        </div>
      </div>

      {/* Bottom controls above the tab bar. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--app-bottomnav-h)+0.75rem)] z-10 flex flex-col items-center gap-2 px-3">
        <p aria-live="polite" className={`rounded-full bg-navy/85 px-3 py-1.5 text-xs font-bold text-white ${hint ? '' : 'sr-only'}`}>
          {hint ?? (status === 'loading' ? 'Loading what is happening…' : `${pins.length} things happening on the map`)}
        </p>
        {/* Left side: the floating SOS button sits bottom-right. */}
        <div className="flex w-full max-w-xl items-center gap-2">
          <button type="button" onClick={locate} className={FLOAT_BTN} aria-label="Go to where I am" disabled={!map || locating}>
            <span aria-hidden className="material-symbols-outlined text-[18px]">
              {locating ? 'progress_activity' : 'my_location'}
            </span>
            {locating ? 'Finding you…' : 'Me'}
          </button>
          <Link href="/feed" className={FLOAT_BTN}>
            <span aria-hidden className="material-symbols-outlined text-[18px]">
              view_agenda
            </span>
            List
          </Link>
        </div>
      </div>

      <PinPanel pin={pin} onClose={() => setPin(null)} />

      <AppBottomSheet open={!!ad} onClose={() => setAd(null)} title={ad?.title ?? 'Ad'}>
        {ad ? (
          <div className="flex flex-col gap-3 pb-2">
            <span className="self-start rounded-full bg-background px-2 py-0.5 text-[11px] font-extrabold text-navy">Ad</span>
            {ad.line ? <p className="text-[15px] text-navy">{ad.line}</p> : null}
            <div className="flex gap-2">
              {ad.target ? (
                <button type="button" className={MAIN_BTN} onClick={() => openAdTarget(ad.target, router.push)}>
                  Visit
                </button>
              ) : null}
              <Link href="/ads" className={SOFT_BTN}>
                Advertise here
              </Link>
            </div>
          </div>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

/** M-09: what a pin is, how fresh, and where to go next. */
function PinPanel({ pin, onClose }: { pin: MapPin | null; onClose: () => void }) {
  const meta = pin ? LAYER_META[pin.layer] : null;
  const price = pin?.layer === 'market' ? shortNaira(pin.top.price) : undefined;
  const isSafety = pin?.layer === 'safety';

  return (
    <AppBottomSheet open={!!pin} onClose={onClose} title={meta ? `${meta.emoji} ${meta.label}` : 'Pin'}>
      {pin ? (
        <div className="flex flex-col gap-3 pb-2">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-extrabold leading-snug text-navy">{pin.top.title}</p>
            <p className="text-sm font-semibold text-muted">
              {formatTimeAgo(pin.top.createdAt)}
              {price ? ` · ${price}` : ''}
              {pin.live ? ' · happening now' : ''}
            </p>
            {pin.count > 1 ? <p className="text-sm text-navy">And {pin.count - 1} more around this street.</p> : null}
            <p className="text-xs text-muted">Shown on the street block, never the exact spot.</p>
          </div>
          <div className="flex gap-2">
            <Link href={pinHref(pin)} className={MAIN_BTN}>
              {isSafety ? 'See the report' : 'Open'}
            </Link>
            <Link href={`/sentinel?q=${encodeURIComponent(pin.top.title)}`} className={SOFT_BTN}>
              Ask Sentinel
            </Link>
          </div>
        </div>
      ) : null}
    </AppBottomSheet>
  );
}
