'use client';

/**
 * My Huud: the map home (tracker Phase 3; decision 2026-10-10 "Home becomes the live map
 * under the real sky"). The person's area under the real sky and weather, with street life,
 * live pins in layers, and map ads. Opens on the person's area, or on all of Nigeria when it
 * is not known (never a Lagos default). Tapping a pin opens its panel (M-09).
 *
 * Layout from the agreed mockup (owner, 2026-10-15): top bar, layer chips, the ⚡ PULSE ribbon
 * (news + exchange rates); the Sentinel orb (ring = the area's mood from real safety pins), "Me"
 * and Calm view on the right; a bottom sheet with the greeting and weather, "Ask Sentinel
 * anything…", "Wetin dey happen?", "Report" and "Share today in <area>". Swipe the sheet up
 * (or tap "Feed") to open the Feed.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVerticalSwipes } from '@/hooks/useSwipe';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type * as maplibregl from 'maplibre-gl';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav, OPEN_CREATE_SHEET } from '@/components/feed/BottomNav';
import { FeedNewsTicker, type PulseLocalItem } from '@/components/feed/FeedNewsTicker';
import type { AreaMood } from '@/components/map/Pins';
import { useCalm } from '@/hooks/useCalm';
import { useMapWeather } from '@/hooks/useMapWeather';
import { setSaveData } from '@/lib/calmMode';
import { WEATHER_WORDS } from '@/lib/mapWeather';
import { userArea } from '@/lib/adsApi';
import { nhToast } from '@/lib/toast';
import { isAdminUser } from '@/lib/adminAccess';
import { AmbientSound, buzzForAlert, setSoundPreferred, soundPreferred } from '@/lib/ambientSound';
import { houseMapAds, previewSamplesOn, sampleMapAds } from '@/lib/houseAds';
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
const MENU_ITEM =
  'flex min-h-12 items-center gap-3 px-4 text-left text-[15px] font-bold text-navy transition-colors hover:bg-background disabled:opacity-60';
const SHEET_BTN =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-bold text-navy transition-colors hover:bg-background';
/** How far up a swipe on the sheet must go to open the Feed. */
const SWIPE_UP_PX = 60;

function greetingFor(d: Date): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function HuudMapHomePage() {
  const { user, isLoading } = useAuth();
  // Wait for the profile so the map opens on the person's own area, not a jump from Nigeria.
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#9ED3F5]">
      <TopNav />
      {isLoading ? (
        <div className="h-full w-full animate-pulse bg-[#9ED3F5] motion-reduce:animate-none" />
      ) : (
        <Suspense fallback={<div className="h-full w-full bg-[#9ED3F5]" />}>
          <MapHome user={user} />
        </Suspense>
      )}
      <BottomNav />
    </div>
  );
}

function MapHome({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const router = useRouter();
  // "📍 See on map" from a Feed post opens the map on that street block (?lat=&lng=, 3 decimals).
  const params = useSearchParams();
  const focusLat = Number(params.get('lat'));
  const focusLng = Number(params.get('lng'));
  const hasFocus = params.has('lat') && params.has('lng') && Number.isFinite(focusLat) && Number.isFinite(focusLng);
  const view = useMemo(
    () => (hasFocus ? { center: { lat: focusLat, lng: focusLng }, zoom: STREET_ZOOM + 1 } : startView(user)),
    [user, hasFocus, focusLat, focusLng],
  );
  const knowsArea = view.zoom >= STREET_ZOOM;
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [sky, setSky] = useState<SkyState | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(LAYERS.map((l) => l.key));
  const [pin, setPin] = useState<MapPin | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [locating, setLocating] = useState(false);
  const calm = useCalm();
  const area = userArea(user);
  const wx = useMapWeather(knowsArea ? view.center : null);
  const firstName = (user as { firstName?: string } | null)?.firstName;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { status, pins, fresh } = useMapPins(map, layers, { onOpen: setPin, live: true });

  // Sound and vibration (owner, 2026-10-15): off until turned on. Browsers only start sound
  // after a tap, so a saved "on" waits for the first touch on the page.
  const [soundOn, setSoundOn] = useState(false);
  const [sound] = useState(() => new AmbientSound());
  useEffect(() => {
    if (!soundPreferred()) return;
    const go = () => {
      sound.start();
      setSoundOn(true);
    };
    window.addEventListener('pointerdown', go, { once: true });
    return () => window.removeEventListener('pointerdown', go);
  }, [sound]);
  useEffect(() => () => sound.stop(), [sound]);
  const toggleSound = () => {
    if (soundOn) {
      sound.stop();
      setSoundOn(false);
      setSoundPreferred(false);
    } else {
      sound.start();
      setSoundOn(true);
      setSoundPreferred(true);
    }
  };
  // A new nearby safety alert buzzes the phone (when sound is on).
  useEffect(() => {
    if (soundOn && pins.some((p) => p.layer === 'safety' && fresh.has(p.id))) buzzForAlert();
  }, [fresh, pins, soundOn]);
  // Ads: real ones; NeyborHuud's "Your ad here" when there are none; sample ads for preview.
  const isAdmin = isAdminUser(user as Parameters<typeof isAdminUser>[0]);
  const [samplesOn, setSamplesOn] = useState(false);
  useEffect(() => setSamplesOn(previewSamplesOn(isAdmin)), [isAdmin]);
  const adArea = userArea(user);
  // useMapAds compares ads by id, so new arrays each render are fine here.
  const houseAds = knowsArea && adArea ? houseMapAds(view.center, adArea) : [];
  const sampleAds = knowsArea && adArea && samplesOn ? sampleMapAds(view.center, adArea) : [];
  useMapAds(map, { dark: sky?.dark ?? 0, onOpen: setAd, fallback: houseAds, extra: sampleAds });

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

  // The orb's ring: red for a live safety alert on screen, amber for any safety or traffic pin.
  const mood: AreaMood = pins.some((p) => p.layer === 'safety' && p.live)
    ? 'alert'
    : pins.some((p) => p.layer === 'safety' || p.layer === 'traffic')
      ? 'advisory'
      : 'calm';

  useEffect(() => {
    if (soundOn) sound.update(sky?.dark ?? 0, wx);
  }, [soundOn, sound, sky?.dark, wx]);

  const weatherWords = wx ? WEATHER_WORDS[wx] : null;
  const weatherLine = [weatherWords ? `${weatherWords.icon} ${weatherWords.label}` : null, area?.lga ?? null].filter(Boolean).join(' · ');
  const openCreate = () => window.dispatchEvent(new CustomEvent(OPEN_CREATE_SHEET));

  // Pulse (mockup): the weather now and reported go-slows in this area come first.
  const areaLga = area?.lga;
  const pulseLocal = useMemo<PulseLocalItem[]>(() => {
    const out: PulseLocalItem[] = [];
    if (weatherWords) out.push({ text: `${weatherWords.icon} ${weatherWords.label} now${areaLga ? ` in ${areaLga}` : ''}` });
    for (const p of pins.filter((x) => x.layer === 'traffic').slice(0, 3)) {
      out.push({ text: `🚧 ${p.top.title}`, href: pinHref(p) });
    }
    return out;
  }, [weatherWords, areaLga, pins]);
  const shareToday = async () => {
    const where = area?.lga ?? 'my area';
    const text = `See what is happening in ${where} today on NeyborHuud.`;
    const url = `${window.location.origin}/huud`;
    try {
      if (navigator.share) await navigator.share({ title: `Today in ${where}`, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        nhToast.success('Link copied', 'Paste it in WhatsApp or anywhere.');
      }
    } catch {
      /* closed the share sheet */
    }
  };

  // Swipe the sheet up to open the Feed.
  // The card is open by default; swipe down (or ✕) hides it to see the whole map.
  const [cardOpen, setCardOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // How tall the card (or the "Show card" tab) is, so the ⋯ and SOS buttons sit just above it.
  const dockRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Card hidden: "Show card" sits in the same row as ⋯ and SOS, right above the tab bar.
    if (!cardOpen) {
      document.documentElement.style.setProperty('--huud-dock', '0px');
      return;
    }
    const el = dockRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--huud-dock', `${Math.round(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardOpen]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--huud-dock');
    },
    [],
  );
  const onSheetDown = useVerticalSwipes(SWIPE_UP_PX, {
    onUp: () => router.push('/feed'),
    onDown: () => setCardOpen(false),
  });
  const onTabDown = useVerticalSwipes(SWIPE_UP_PX, { onUp: () => setCardOpen(true) });

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
      {/* Full screen, notch area included, so the sky runs up behind the status bar
          (owner, 2026-10-16). SkyMap's own box is position: relative, hence this wrapper. */}
      <div className="absolute inset-0">
        <SkyMap
          center={knowsArea ? view.center : undefined}
          // Closer street view so the 3D buildings read (owner, 2026-10-16).
          zoom={knowsArea ? Math.max(view.zoom, 16.4) : view.zoom}
          className="h-full w-full"
          label={knowsArea ? 'Live map of your area' : 'Live map of Nigeria'}
          onReady={setMap}
          onSky={setSky}
          cinematic={!hasFocus}
          toyWorld
          // Sky reaches up behind the notch and the top bar; the horizon stays just under the controls.
          skyLift={{ safeTopPlus: 60 }}
        />
      </div>

      {/* Under the top bar: layer chips, then the ⚡ PULSE ribbon (news + exchange rates). */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--app-topnav-height)+var(--safe-top,0px)+0.25rem)] z-10 flex flex-col gap-2 px-3">
        <div className="pointer-events-auto mx-auto w-full max-w-xl">
          <MapLayerChips active={layers} onChange={setLayers} counts={counts} />
        </div>
        <div className="nh-map-pulse pointer-events-auto mx-auto w-full max-w-xl overflow-hidden rounded-full shadow-[0_4px_14px_rgba(29,36,51,0.16)]">
          <FeedNewsTicker local={pulseLocal} />
        </div>
      </div>

      {/* ⋯ map menu (owner, 2026-10-16): on the left, opposite SOS, just above the card;
          both follow the card down when it is hidden (--huud-dock, set below). */}
      <div
        className="absolute left-3 z-20 transition-[bottom] duration-300 ease-out motion-reduce:transition-none"
        style={{ bottom: 'calc(var(--app-bottomnav-h) + 1rem + var(--huud-dock, 0px))' }}
      >
        {menuOpen ? (
          <div
            role="menu"
            aria-label="Map options"
            className="absolute bottom-full left-0 mb-2 flex w-48 flex-col overflow-hidden rounded-[18px] bg-white py-1 shadow-[0_8px_24px_rgba(29,36,51,0.22)]"
          >
            <button type="button" role="menuitem" className={MENU_ITEM} disabled={!map || locating} onClick={() => { setMenuOpen(false); locate(); }}>
              <span aria-hidden className="material-symbols-outlined text-[20px]">{locating ? 'progress_activity' : 'my_location'}</span>
              {locating ? 'Finding you…' : 'Go to where I am'}
            </button>
            <button type="button" role="menuitemcheckbox" aria-checked={calm} className={MENU_ITEM} onClick={() => { setMenuOpen(false); setSaveData(!calm); }}>
              <span aria-hidden className="material-symbols-outlined text-[20px]">{calm ? 'play_circle' : 'self_improvement'}</span>
              {calm ? 'Live view' : 'Calm view'}
            </button>
            <button type="button" role="menuitemcheckbox" aria-checked={soundOn} className={MENU_ITEM} onClick={() => { setMenuOpen(false); toggleSound(); }}>
              <span aria-hidden className="material-symbols-outlined text-[20px]">{soundOn ? 'volume_up' : 'volume_off'}</span>
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Map options: go to where I am, calm view, sound"
          className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(29,36,51,0.3)] transition-colors hover:bg-background"
        >
          <span aria-hidden className="material-symbols-outlined text-[26px] text-navy">
            more_horiz
          </span>
        </button>
      </div>

      {/* Bottom sheet (mockup): greeting + weather, Ask Sentinel, post, report, share.
          Swipe up for the Feed; swipe down or ✕ to hide it and see the whole map. */}
      {cardOpen ? (
      <section
        ref={dockRef as unknown as React.Ref<HTMLElement>}
        aria-label="Your area today"
        onPointerDown={onSheetDown}
        className="absolute inset-x-0 bottom-[calc(var(--app-bottomnav-h)+0.5rem)] z-10 px-3"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-2.5 rounded-[24px] bg-white/95 px-4 pb-3.5 pt-2 shadow-[0_-4px_24px_rgba(29,36,51,0.18)] backdrop-blur">
          <div className="relative flex justify-center">
            <Link href="/feed" className="flex flex-col items-center gap-0.5 pt-0.5" aria-label="Open the Feed. You can also swipe this card up.">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-line" />
              <span className="text-[11px] font-extrabold text-muted">Swipe up for the Feed · down to hide</span>
            </Link>
            <button
              type="button"
              onClick={() => setCardOpen(false)}
              aria-label="Hide this card and see the whole map"
              className="absolute -right-2 -top-1 grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-background"
            >
              <span aria-hidden className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
          <p aria-live="polite" className={`text-center text-xs font-bold text-[#8A5A00] ${hint ? '' : 'sr-only'}`}>
            {hint ?? (status === 'loading' ? 'Loading what is happening…' : `${pins.length} things happening on the map`)}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-lg font-extrabold text-navy">
              {greetingFor(now)}
              {firstName ? `, ${firstName}` : ''}
            </span>
            {weatherLine ? <span className="truncate text-xs font-bold text-muted">{weatherLine}</span> : null}
          </div>
          <Link
            href="/sentinel"
            className="flex min-h-12 items-center gap-2.5 rounded-full bg-background px-3 text-[15px] font-semibold text-muted transition-colors hover:bg-[#E9EDF3]"
          >
            <span aria-hidden className="relative grid h-8 w-8 place-items-center rounded-full bg-brand-green-dark text-white">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {/* The area's mood (was the Sentinel orb's ring): amber for reports, red for a live alert. */}
              {mood !== 'calm' ? (
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-background ${mood === 'alert' ? 'bg-brand-red motion-safe:animate-pulse' : 'bg-[#F0A93B]'}`}
                />
              ) : null}
            </span>
            Ask Sentinel anything…
            {mood !== 'calm' ? (
              <span className="sr-only">{mood === 'alert' ? '. There is an alert in your area' : '. Your area is on advisory'}</span>
            ) : null}
          </Link>
          <div className="flex gap-2">
            <button type="button" onClick={openCreate} className={SHEET_BTN}>
              ✏️ Wetin dey happen?
            </button>
            <button type="button" onClick={openCreate} className={SHEET_BTN}>
              ⚠️ Report
            </button>
          </div>
          <button type="button" onClick={() => void shareToday()} className="text-sm font-bold text-brand-green-dark">
            📸 Share today in {area?.lga ?? 'your area'}
          </button>
        </div>
      </section>
      ) : (
        // Same row as ⋯ (left) and SOS (right): same bottom, same 56 px height, centred.
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--app-bottomnav-h)+1rem)] z-10 flex h-14 items-center justify-center px-20"
          onPointerDown={onTabDown}
        >
          <button
            type="button"
            onClick={() => setCardOpen(true)}
            className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/95 px-4 text-sm font-extrabold text-navy shadow-[0_4px_14px_rgba(29,36,51,0.18)]"
          >
            <span aria-hidden className="material-symbols-outlined text-[18px]">
              expand_less
            </span>
            Show card
          </button>
        </div>
      )}

      <PinPanel pin={pin} onClose={() => setPin(null)} />

      <AppBottomSheet open={!!ad} onClose={() => setAd(null)} title={ad?.title ?? 'Ad'}>
        {ad ? (
          <div className="flex flex-col gap-3 pb-2">
            <span className="self-start rounded-full bg-background px-2 py-0.5 text-[11px] font-extrabold text-navy">
              {ad._id.startsWith('sample-') ? 'Sample ad · preview, not a real business' : 'Ad'}
            </span>
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
