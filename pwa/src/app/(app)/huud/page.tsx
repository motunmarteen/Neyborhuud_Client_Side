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
import { TodaysPulseSheet } from '@/components/feed/TodaysPulseSheet';
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
import { useMyPins } from '@/hooks/useMyPins';
import { useAreaPulses } from '@/hooks/useAreaPulses';
import { useAreaChampions, type AreaChampion } from '@/hooks/useAreaChampions';
import { ChampionSheet } from '@/components/map/ChampionSheet';
import { useHuudWeek } from '@/hooks/useQuests';
import { useShop } from '@/hooks/usePhase7';
import { MapSkinOverlay } from '@/components/map/MapSkinOverlay';
import { useFriendsSharing, useLensChoice, useMapLenses, type LensItem, type LensKey } from '@/hooks/useMapLenses';
import { LensItemSheet, MapLensSheet } from '@/components/map/MapLensSheet';
import { MapTour, useMapTour } from '@/components/map/MapTour';
import { ShareTodaySheet } from '@/components/map/ShareTodaySheet';
import { VisitorWelcome } from '@/components/map/VisitorWelcome';
import { JoinSheet } from '@/components/map/JoinSheet';
import { HelpMapSheet } from '@/components/map/HelpMapSheet';
import { useAreaWelcome } from '@/hooks/useAreaWelcome';
import { rememberRef, signupHref } from '@/lib/visitor';
import type { ShareRow } from '@/lib/shareCard';
import { extractUserHomeCoords } from '@/lib/mapUserLocation';
import { jamStrength, type Jam } from '@/lib/livingMap';
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
  const [pulseOpen, setPulseOpen] = useState(false);
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

  // M-10: fresh traffic reports (go-slows, road blocks, accidents, floods) make the street
  // life crawl and queue there. Kept while the Traffic chip is off: hiding pins clears no road.
  const [trafficPins, setTrafficPins] = useState<MapPin[]>([]);
  useEffect(() => {
    if (layers.includes('traffic')) setTrafficPins(pins.filter((p) => p.layer === 'traffic'));
  }, [pins, layers]);
  const jams = useMemo<Jam[]>(
    () =>
      trafficPins
        .map((p) => ({
          centre: [p.lng, p.lat] as [number, number],
          // A pin stands for one ~110 m block; the queue reaches the roads around it.
          radiusM: 220,
          strength: jamStrength(p.top.createdAt, p.top.severity, now.getTime()) * (p.count > 1 ? 1 : 0.85),
        }))
        .filter((j) => j.strength > 0),
    [trafficPins, now],
  );

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

  // Your home (only you see it) and "You are here".
  const home = useMemo(() => (user ? extractUserHomeCoords(user as Parameters<typeof extractUserHomeCoords>[0]) : null), [user]);
  const { showHere } = useMyPins(map, { home, name: firstName ?? 'You' });
  // Visitors (not signed in, owner 2026-10-17): the map with a welcome card instead of the
  // member card; "Join free" keeps the sharer's invite code from the link.
  const visitor = !user;
  const areaWelcome = useAreaWelcome(map, visitor);
  const [joinHref, setJoinHref] = useState('/huud?join=1');
  useEffect(() => {
    rememberRef(params.get('ref'));
    setJoinHref(signupHref());
  }, [params]);
  // Joining happens here on the live map (owner 2026-10-18), not on a separate page.
  const [joinOpen, setJoinOpen] = useState(false);
  useEffect(() => {
    setJoinOpen(params.get('join') === '1');
  }, [params]);
  // While joining, the floating ⋯ and SOS buttons step aside (the sheet is tall).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-joining', joinOpen && visitor);
    return () => document.documentElement.removeAttribute('data-joining');
  }, [joinOpen, visitor]);
  const closeJoin = useCallback(() => {
    setJoinOpen(false);
    const u = new URL(window.location.href);
    u.searchParams.delete('join');
    window.history.replaceState(null, '', u.pathname + u.search);
  }, []);

  // Help map Nigeria (M-18): when most buildings here are stand-ins (OpenStreetMap has no
  // outlines yet), invite people to add the real ones. Hidden for a week per area once closed.
  const [mapGap, setMapGap] = useState({ real: 0, filler: 0 });
  const [helpMapOpen, setHelpMapOpen] = useState(false);
  const [helpMapHiddenAt, setHelpMapHiddenAt] = useState<string | null>(null);
  useEffect(() => {
    if (!map) return;
    const el = map.getContainer();
    const onBuilt = (ev: Event) => {
      const e = (ev as CustomEvent<{ real?: number; filler?: number }>).detail ?? {};
      setMapGap({ real: e.real ?? 0, filler: e.filler ?? 0 });
      const c = map.getCenter();
      const key = `nh_helpmap_${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;
      try {
        const until = Number(localStorage.getItem(key));
        setHelpMapHiddenAt(until > Date.now() ? key : null);
      } catch {
        setHelpMapHiddenAt(null);
      }
    };
    el.addEventListener('toyworld:built', onBuilt);
    return () => el.removeEventListener('toyworld:built', onBuilt);
  }, [map]);
  const helpMapShown =
    mapGap.filler >= 20 && mapGap.filler >= mapGap.real && !helpMapHiddenAt;
  const dismissHelpMap = () => {
    if (!map) return;
    const c = map.getCenter();
    const key = `nh_helpmap_${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;
    try {
      localStorage.setItem(key, String(Date.now() + 7 * 864e5));
    } catch {
      /* private mode: hidden for this visit only */
    }
    setHelpMapHiddenAt(key);
  };

  // M-11: where neighbours are active now (busy areas, never people or homes).
  useAreaPulses(map);
  // M-14: last week's 👑 Area Champions, at the centre of their area.
  const [champion, setChampion] = useState<AreaChampion | null>(null);
  useAreaChampions(map, setChampion);
  // First-time tour (mockup): three steps, once per phone; replay from the ⋯ menu.
  // Members only, on their own area; visitors can tap "Show me around".
  const tour = useMapTour(!!map && !hasFocus && !!user);

  // A tap before the map has finished loading is remembered and run when it is ready
  // (it used to do nothing, so "Use my location" looked broken on a slow phone).
  const pendingLocate = useRef(false);
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    if (!map) {
      pendingLocate.current = true;
      setLocating(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        showHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const target = { center: [pos.coords.longitude, pos.coords.latitude] as [number, number], zoom: STREET_ZOOM + 0.5 };
        map.flyTo({ ...target, essential: true });
        // If anything interrupts the flight (the map still starting up), jump straight there.
        map.once('moveend', () => {
          if (map.getZoom() < target.zoom - 1) map.jumpTo(target);
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [map, showHere]);
  useEffect(() => {
    if (map && pendingLocate.current) {
      pendingLocate.current = false;
      locate();
    }
  }, [map, locate]);

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
  const openCreate = () => window.dispatchEvent(new CustomEvent(OPEN_CREATE_SHEET));

  // One live line under the greeting: an alert first, then what is going on, then quiet.
  const where = area?.lga ?? 'your area';
  const firstAlert = pins.find((p) => p.layer === 'safety' && p.live) ?? null;
  const safetyCount = pins.filter((p) => p.layer === 'safety').reduce((n, p) => n + p.count, 0);
  const allCount = pins.reduce((n, p) => n + p.count, 0);
  const statusLine =
    status === 'zoom-in'
      ? knowsArea
        ? 'Zoom in to see what is happening'
        : 'Zoom in to your area to see what is happening'
      : status === 'error'
        ? 'Could not load what is happening'
        : status === 'loading' && pins.length === 0
          ? 'Checking your area…'
          : firstAlert
            ? safetyCount > 1
              ? `${safetyCount} safety alerts nearby`
              : '1 safety alert nearby'
            : allCount > 0
              ? `${allCount} ${allCount === 1 ? 'thing' : 'things'} happening nearby`
              : `All quiet in ${where}`;
  // Quiet street (mockup): nothing reported here yet. Honest, and still useful.
  const quiet = knowsArea && status === 'ready' && allCount === 0;
  const username = (user as { username?: string } | null)?.username;
  const inviteNeighbours = async () => {
    const url = `${window.location.origin}/signup${username ? `?ref=${encodeURIComponent(username)}` : ''}`;
    const text = `Join me on NeyborHuud so we can look out for each other in ${where}.`;
    try {
      if (navigator.share) await navigator.share({ title: 'NeyborHuud', text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        nhToast.success('Invite copied', 'Paste it in your street WhatsApp group.');
      }
    } catch {
      /* closed the share sheet */
    }
  };

  const openStatus = () => {
    if (firstAlert) setPin(firstAlert);
    else router.push('/feed');
  };

  // Pulse (mockup): the weather now and reported go-slows in this area come first.
  const areaLga = area?.lga;
  // Huud of the Week shows in the Pulse ribbon (GAMIFICATION-REVIEW, G-08). Members only.
  const { data: huudWeek } = useHuudWeek(!!user);
  const { data: shopData } = useShop(!!user);
  // Map lenses (owner 2026-10-18): friends, birthdays, businesses, one tap each, never crowded.
  const lensChoice = useLensChoice();
  const [lensSheetOpen, setLensSheetOpen] = useState(false);
  const [lensItem, setLensItem] = useState<{ it: LensItem; lens: LensKey } | null>(null);
  useMapLenses(user ? map : null, lensChoice.on, (it, lens) => setLensItem({ it, lens }));
  const friendsSharing = useFriendsSharing(!!user);
  const pulseLocal = useMemo<PulseLocalItem[]>(() => {
    const out: PulseLocalItem[] = [];
    if (weatherWords) out.push({ text: `${weatherWords.icon} ${weatherWords.label} now${areaLga ? ` in ${areaLga}` : ''}` });
    for (const p of pins.filter((x) => x.layer === 'traffic').slice(0, 3)) {
      out.push({ text: `🚧 ${p.top.title}`, href: pinHref(p) });
    }
    if (huudWeek?.area) {
      const g = huudWeek.theme.goal;
      out.push({
        text: `${huudWeek.theme.emoji} ${huudWeek.theme.title}: ${huudWeek.done ? `${huudWeek.area.lga} did it!` : `${Math.min(huudWeek.progress, g)} of ${g} in ${huudWeek.area.lga}`}`,
        href: '/rewards',
      });
    }
    return out;
  }, [weatherWords, areaLga, pins, huudWeek]);
  // Share today (mockup share card 1): the live sky over the area plus today's real items.
  // Safety alerts never go on it (safety reports are not shared publicly).
  const [shareOpen, setShareOpen] = useState(false);
  // The champion's own card (Phase 7): their sky, the crown and what they did.
  const [shareChampion, setShareChampion] = useState<AreaChampion | null>(null);
  const shareCard = useMemo(() => {
    if (!sky) return null;
    if (shareChampion) {
      const c = shareChampion;
      return {
        area: c.lga,
        date: now,
        sky,
        weather: null,
        label: `AREA CHAMPION OF THE WEEK · ${c.lga.toUpperCase()}`,
        headline: `👑 ${c.isMe ? 'I am' : `${c.name} is`} ${c.lga}'s Area Champion this week`,
        rows: [
          { icon: '⭐', text: `${c.impact.toLocaleString('en-NG')} Impact from helping neighbours` },
          { icon: '🤝🏾', text: 'Confirmed reports, help, deals, returns' },
          { icon: '🏘️', text: 'Looking out for each other, street by street' },
        ],
      };
    }
    const rows: ShareRow[] = pins
      .filter((p) => p.layer === 'traffic')
      .slice(0, 2)
      .map((p) => ({ icon: '🚧', text: p.top.title }));
    const add = (n: number | undefined, icon: string, text: (n: number) => string) => {
      if (n && n > 0) rows.push({ icon, text: text(n) });
    };
    add(counts.light_water, '💡', (n) => `${n} light & water ${n === 1 ? 'update' : 'updates'}`);
    add(counts.market, '🛒', (n) => `${n} ${n === 1 ? 'thing' : 'things'} for sale near you`);
    add(counts.events, '🎉', (n) => `${n} ${n === 1 ? 'event' : 'events'} coming up`);
    add(counts.help, '🙋🏾', (n) => `${n} ${n === 1 ? 'neighbour' : 'neighbours'} asking for help`);
    add(counts.work, '💼', (n) => `${n} jobs and services nearby`);
    if (!rows.length) rows.push({ icon: '🏘️', text: 'Quiet street today. Be the first to post' });
    return {
      area: area?.lga ?? 'my area',
      date: now,
      sky,
      weather: weatherWords ? `${weatherWords.icon} ${weatherWords.label} now` : null,
      rows,
    };
  }, [sky, pins, counts, area?.lga, now, weatherWords, shareChampion]);
  // Worked out after the page starts in the browser (the server does not know the address),
  // so the first render matches the server's.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  // The shared link opens the live map of this area (rounded to ~1 km, never someone's home),
  // so a WhatsApp contact lands on the street, not a sign-up form; it carries the invite code.
  const shareCentre = map?.getCenter() ?? (knowsArea ? view.center : null);
  const shareLink =
    origin && shareCentre
      ? `${origin}/huud?lat=${shareCentre.lat.toFixed(2)}&lng=${shareCentre.lng.toFixed(2)}${username ? `&ref=${encodeURIComponent(username)}` : ''}`
      : '';

  // Swipe the sheet up to open the Feed.
  // The card is open by default; swipe down (or ✕) hides it to see the whole map.
  const [cardOpen, setCardOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // How tall the card (or the "Show card" tab) is, so the ⋯ and SOS buttons sit just above it.
  const dockRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Card hidden: "Show card" sits in the same row as ⋯ and SOS, right above the tab bar.
    if (!cardOpen) {
      // Buttons at bar + 2.25rem, like the "Show card" row (3rem - 0.75rem).
      document.documentElement.style.setProperty('--huud-dock', '-0.75rem');
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

  return (
    <>
      {/* Full screen, notch area included, so the sky runs up behind the status bar
          (owner, 2026-10-16). SkyMap's own box is position: relative, hence this wrapper.
          Compass and map credit sit top-right, under the ⚡ ribbon, not under the bottom bar. */}
      <div className="huud-map-home absolute inset-0">
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
          controlsPosition="top-right"
          jams={jams}
          // Sky reaches up behind the notch and the top bar; the horizon stays just under the controls.
          skyLift={{ safeTopPlus: 60 }}
        />
        {/* Phase 7 shop: the person's map skin (only they see it). */}
        <MapSkinOverlay skin={shopData?.equipped.mapSkin} calm={calm} />
      </div>

      {/* Under the top bar: layer chips, then the ⚡ PULSE ribbon (news + exchange rates). */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--app-topnav-height)+var(--safe-top,0px)+0.25rem)] z-10 flex flex-col gap-2 px-3">
        <div className="pointer-events-auto mx-auto w-full max-w-xl" data-tour="chips">
          <MapLayerChips
            active={layers}
            onChange={setLayers}
            counts={counts}
            onMore={user ? () => setLensSheetOpen(true) : undefined}
            moreOn={lensChoice.on.length}
          />
        </div>
        <div className="nh-map-pulse pointer-events-auto mx-auto w-full max-w-xl overflow-hidden rounded-full shadow-[0_4px_14px_rgba(29,36,51,0.16)]">
          <FeedNewsTicker local={pulseLocal} onOpen={() => setPulseOpen(true)} />
        </div>
        {helpMapShown ? (
          <div className="pointer-events-auto mx-auto flex w-full max-w-xl justify-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/95 py-1 pl-3 pr-1 text-xs font-extrabold text-navy shadow-[0_4px_14px_rgba(29,36,51,0.16)]">
              <button type="button" onClick={() => setHelpMapOpen(true)} className="inline-flex min-h-8 items-center gap-1">
                <span aria-hidden>🗺️</span> This street isn&apos;t fully mapped. Help map it
              </button>
              <button
                type="button"
                onClick={dismissHelpMap}
                aria-label="Hide for a week"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-background"
              >
                <span aria-hidden className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ⋯ map menu (owner, 2026-10-16): on the left, opposite SOS, just above the card;
          both follow the card down when it is hidden (--huud-dock, set below). */}
      <div
        data-map-menu
        className="absolute left-3 z-20 transition-[bottom] duration-300 ease-out motion-reduce:transition-none"
        style={{ bottom: 'calc(var(--app-bottomnav-h) + 3rem + var(--huud-dock, 0px))' }}
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
            <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => { setMenuOpen(false); tour.start(); }}>
              <span aria-hidden className="material-symbols-outlined text-[20px]">explore</span>
              Show me around
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
          aria-label="Map options: go to where I am, calm view, show me around, sound"
          className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(29,36,51,0.3)] transition-colors hover:bg-background"
        >
          <span aria-hidden className="material-symbols-outlined text-[26px] text-navy">
            more_horiz
          </span>
        </button>
      </div>

      {/* Area card (redesigned, owner 2026-10-16: no repeats). One job per line:
          handle (drag up = Feed, drag down or tap = hide), greeting + one live status line,
          Ask Sentinel, then Post and Share. Weather and area are already in Pulse and the top bar;
          Report lives in the Create sheet that Post opens. */}
      {cardOpen ? (
      <section
        ref={dockRef as unknown as React.Ref<HTMLElement>}
        aria-label="Your area now"
        onPointerDown={onSheetDown}
        // Clear of the raised ➕ on the tab bar (it rises ~36 px above the bar).
        className="absolute inset-x-0 bottom-[calc(var(--app-bottomnav-h)+2.5rem)] z-10 px-3"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-[24px] bg-white/95 px-4 pb-4 pt-1.5 shadow-[0_-4px_24px_rgba(29,36,51,0.18)] backdrop-blur">
          <div className="relative flex h-6 items-center justify-center">
            <button
              type="button"
              onClick={() => setCardOpen(false)}
              aria-label="Hide this card and see the whole map. Drag it up to open the Feed."
              className="grid h-6 w-16 place-items-center rounded-full"
            >
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-line" />
            </button>
            <Link
              href="/feed"
              className="absolute right-0 top-0 inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[11px] font-extrabold text-muted hover:text-navy"
            >
              Feed
              <span aria-hidden className="material-symbols-outlined text-[16px]">
                expand_less
              </span>
            </Link>
          </div>

          {visitor && joinOpen ? (
            <JoinSheet
              map={map}
              area={areaWelcome}
              refCode={params.get('ref')}
              onLocate={locate}
              locating={locating}
              onClose={closeJoin}
            />
          ) : visitor ? (
            <VisitorWelcome
              area={
                areaWelcome?.neighbourhood && areaWelcome.lga
                  ? `${areaWelcome.neighbourhood}, ${areaWelcome.lga}`
                  : areaWelcome?.lga ?? null
              }
              lga={areaWelcome?.lga ?? null}
              neighbours={areaWelcome?.neighbours ?? 0}
              joinHref={joinHref}
              onTour={tour.start}
              onShowMyArea={locate}
              locating={locating}
            />
          ) : (
          <>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-lg font-extrabold leading-tight text-navy">
              {greetingFor(now)}
              {firstName ? `, ${firstName}` : ''}
            </h2>
            <button
              type="button"
              onClick={openStatus}
              aria-live="polite"
              className="inline-flex items-center gap-2 self-start text-left text-sm font-bold text-muted hover:text-navy"
            >
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  mood === 'alert' ? 'bg-brand-red motion-safe:animate-pulse' : mood === 'advisory' ? 'bg-[#F0A93B]' : 'bg-primary'
                }`}
              />
              <span className={mood === 'alert' ? 'text-[#C8102E]' : undefined}>{statusLine}</span>
            </button>
          </div>

          {quiet ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-background p-3">
              <p className="font-heading text-base font-extrabold text-navy">Your street dey wait for you 🏘️</p>
              <p className="text-sm font-semibold text-muted">
                Nobody don post for {where} yet.{pulseLocal.length ? ' Here’s what we know already:' : ''}
              </p>
              {pulseLocal.slice(0, 3).map((l) => (
                <p key={l.text} className="text-sm font-bold text-navy">
                  {l.text}
                </p>
              ))}
              <div className="mt-1 flex gap-2">
                <button type="button" onClick={() => void inviteNeighbours()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-white">
                  <span aria-hidden>🙌🏾</span> Invite neighbours
                </button>
                <Link href="/communities?create=1" className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-bold text-navy">
                  <span aria-hidden>🏘️</span> Set up my estate
                </Link>
              </div>
            </div>
          ) : null}

          <Link
            href="/sentinel"
            className="flex min-h-12 items-center gap-2.5 rounded-full bg-background px-3 text-[15px] font-semibold text-muted transition-colors hover:bg-[#E9EDF3]"
          >
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-brand-green-dark text-white">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </span>
            Ask Sentinel anything…
          </Link>

          <div className="flex gap-2">
            <button type="button" onClick={openCreate} className={SHEET_BTN}>
              <span aria-hidden>✏️</span> Post
            </button>
            <button type="button" onClick={() => setShareOpen(true)} className={SHEET_BTN}>
              <span aria-hidden>📸</span> Share today
            </button>
          </div>
          </>
          )}
        </div>
      </section>
      ) : (
        // Same row as ⋯ (left) and SOS (right): same bottom, same 56 px height, centred.
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--app-bottomnav-h)+2.25rem)] z-10 flex h-14 items-center justify-center px-20"
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
      <MapLensSheet
        open={lensSheetOpen}
        onClose={() => setLensSheetOpen(false)}
        on={lensChoice.on}
        onToggle={lensChoice.toggle}
        sharing={friendsSharing.on}
        onSharing={(v) => void friendsSharing.setOn(v)}
      />
      <LensItemSheet item={lensItem} onClose={() => setLensItem(null)} />
      <ChampionSheet
        champion={champion}
        onClose={() => setChampion(null)}
        isMember={!!user}
        joinHref={joinHref}
        onShare={(c) => {
          setChampion(null);
          setShareChampion(c);
          setShareOpen(true);
        }}
      />
      <HelpMapSheet
        open={helpMapOpen}
        onClose={() => setHelpMapOpen(false)}
        centre={map ? { lat: map.getCenter().lat, lng: map.getCenter().lng } : null}
        realCount={mapGap.real}
        fillerCount={mapGap.filler}
      />
      {shareLink ? (
        <ShareTodaySheet
          open={shareOpen}
          onClose={() => {
            setShareOpen(false);
            setShareChampion(null);
          }}
          card={shareCard}
          link={shareLink}
          {...(shareChampion
            ? {
                title: `Area Champion of the Week: ${shareChampion.lga}`,
                text: `${shareChampion.isMe ? 'I am' : `${shareChampion.name} is`} ${shareChampion.lga}'s Area Champion of the Week on NeyborHuud.`,
              }
            : {})}
        />
      ) : null}
      {tour.step >= 0 ? <MapTour step={tour.step} onNext={tour.next} onSkip={tour.finish} /> : null}
      <TodaysPulseSheet
        open={pulseOpen}
        onClose={() => setPulseOpen(false)}
        center={map ? { lat: map.getCenter().lat, lng: map.getCenter().lng } : knowsArea ? view.center : null}
        areaName={area?.lga}
        local={pulseLocal}
      />

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
