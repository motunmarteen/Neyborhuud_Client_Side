'use client';

/**
 * The Sentinel tab's safety hub, as in the agreed mockup ("🛡️ Sentinel tab: all safety
 * features"): the area's mood and today's summary, "Hold SOS for 3 seconds", your real
 * guardians / circle / trip, the safe-trip button, the three tool groups (Protect, Your
 * network, Tools) and "What Sentinel watches for you". Everything shown is real; when
 * nothing is happening the summary says so.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { safetyService } from '@/services/safety.service';
import { tripService } from '@/services/trip.service';
import { fetchMapPins, type MapPin } from '@/lib/mapPins';
import { extractUserHomeCoords } from '@/lib/mapUserLocation';
import { useSos } from '@/hooks/useSos';
import { SentinelOrb } from '@/components/map/Pins';

const GROUPS: { title: string; items: { icon: string; label: string; sub: string; href: string }[] }[] = [
  {
    title: 'Protect',
    items: [
      { icon: '🚗', label: 'Safe trips', sub: 'Guardians follow your trip', href: '/safety/trips' },
      { icon: '📍', label: 'Emergency tracking', sub: 'Live location if danger', href: '/safety/kidnapping-tracking' },
      { icon: '🗺️', label: 'Safety zones', sub: 'Red-zone alerts', href: '/safety/geofences' },
      { icon: '✅', label: 'Check-ins', sub: '“I don reach” reminders', href: '/safety/manage#checkins' },
    ],
  },
  {
    title: 'Your network',
    items: [
      { icon: '👥', label: 'Guardians', sub: 'Who gets your SOS', href: '/safety/manage#guardians' },
      { icon: '🫂', label: 'Circle', sub: 'Family and close friends', href: '/safety/manage#linkers' },
      { icon: '📡', label: 'Live status', sub: 'Share how you dey', href: '/safety/manage#status' },
      { icon: '🔔', label: 'Guardian alerts', sub: 'When your people need you', href: '/safety/manage#alerts' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { icon: '🔢', label: 'Panic PIN', sub: 'Secret PIN calls for help', href: '/safety/panic-pin' },
      { icon: '📞', label: 'Fake call', sub: 'Escape a bad situation', href: '/safety/fake-call' },
      { icon: '🆘', label: 'Report emergency', sub: 'Fire, accident, attack', href: '/safety/emergency' },
      { icon: '📣', label: 'Community emergency', sub: 'Alert the whole estate', href: '/community-emergency' },
      { icon: '🚨', label: 'Incident reports', sub: 'Confirm or dispute', href: '/incident-reports' },
      { icon: '🕘', label: 'History', sub: 'Past trips and incidents', href: '/safety/trips/history' },
    ],
  },
];

const WATCHES = [
  { icon: '💬', label: 'Scams and threats in chats' },
  { icon: '📰', label: 'Dangerous or fake posts' },
  { icon: '🛒', label: 'Fake sellers, jobs and events' },
  { icon: '📍', label: 'Red zones where you go' },
  { icon: '🤝', label: 'Trust and reports about people' },
];

const HOLD_MS = 3000;

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const countOf = (res: unknown, key: string) => {
  const d = (res as { data?: Record<string, unknown> })?.data ?? (res as Record<string, unknown>);
  const v = d?.[key];
  return Array.isArray(v) ? v.length : 0;
};

/** Hold the button for 3 seconds to start an SOS (the usual countdown still lets you cancel). */
function SosHoldCard({ guardians }: { guardians: number }) {
  const sos = useSos();
  const [p, setP] = useState(0);
  const [holding, setHolding] = useState(false);
  const active = sos.phase === 'active' || sos.phase === 'pending';
  const { triggerSos } = sos;
  // While held: fill the ring; at 3 seconds, start the SOS (its countdown still lets you cancel).
  useEffect(() => {
    if (!holding) {
      setP(0);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const v = Math.min(1, (performance.now() - t0) / HOLD_MS);
      setP(v);
      if (v >= 1) {
        setHolding(false);
        navigator.vibrate?.(200);
        void triggerSos();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [holding, triggerSos]);
  const start = () => {
    if (!active) setHolding(true);
  };
  const stop = () => setHolding(false);

  return (
    <div className="flex items-center gap-4 rounded-[22px] bg-[#FDECEC] p-4">
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !holding) start();
        }}
        onKeyUp={stop}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={active ? 'SOS is on' : 'Hold for 3 seconds to send SOS'}
        className="relative grid h-20 w-20 shrink-0 touch-none select-none place-items-center rounded-full bg-[#E5484D] text-lg font-black text-white shadow-[0_6px_18px_rgba(229,72,77,0.45)]"
        style={{ background: `conic-gradient(#8E1B1F ${p * 360}deg, #E5484D 0deg)` }}
      >
        <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#E5484D]">SOS</span>
      </button>
      <div className="min-w-0">
        <p className="font-heading text-base font-black text-navy">{active ? 'SOS is on' : 'Hold SOS for 3 seconds'}</p>
        <p className="text-sm text-navy">
          {active ? (
            <Link href="/sos" className="font-bold text-[#B42318] underline">
              Open SOS
            </Link>
          ) : guardians > 0 ? (
            `Your ${guardians} ${guardians === 1 ? 'guardian gets' : 'guardians get'} your location at once.`
          ) : (
            <>
              Add a guardian so someone gets your location.{' '}
              <Link href="/safety/manage#guardians" className="font-bold text-[#B42318] underline">
                Add one
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function SentinelHub({ user, areaName }: { user: unknown; areaName?: string | null }) {
  const firstName = (user as { firstName?: string } | null)?.firstName;
  const home = useMemo(() => (user ? extractUserHomeCoords(user as Parameters<typeof extractUserHomeCoords>[0]) : null), [user]);

  const { data: guardians = 0 } = useQuery({
    queryKey: ['sentinel', 'guardians'],
    queryFn: async () => countOf(await safetyService.getGuardians('accepted'), 'guardians'),
    staleTime: 60_000,
    enabled: !!user,
  });
  const { data: circle = 0 } = useQuery({
    queryKey: ['sentinel', 'circle'],
    queryFn: async () => countOf(await safetyService.getMyCircle(), 'members'),
    staleTime: 60_000,
    enabled: !!user,
  });
  const { data: trip = null } = useQuery({
    queryKey: ['sentinel', 'trip'],
    queryFn: async () => {
      const r = await tripService.getActiveTrip();
      return ((r as { data?: { trip?: unknown } })?.data?.trip ?? null) as { _id?: string; status?: string } | null;
    },
    staleTime: 30_000,
    enabled: !!user,
  });
  const { data: pins = [] } = useQuery({
    queryKey: ['sentinel', 'pins', home?.lat?.toFixed(3), home?.lng?.toFixed(3)],
    queryFn: async (): Promise<MapPin[]> => {
      if (!home) return [];
      const d = 0.02;
      return fetchMapPins([home.lng - d, home.lat - d, home.lng + d, home.lat + d], ['safety', 'traffic', 'light_water']);
    },
    staleTime: 2 * 60_000,
    enabled: !!home,
  });

  const safety = pins.filter((p) => p.layer === 'safety');
  const liveSafety = safety.filter((p) => p.live);
  const traffic = pins.filter((p) => p.layer === 'traffic');
  const light = pins.filter((p) => p.layer === 'light_water');
  const mood = liveSafety.length ? 'alert' : safety.length || traffic.length ? 'advisory' : 'calm';
  const moodLine = { alert: 'shine your eye well well', advisory: 'shine your eye small', calm: 'all quiet for now' }[mood];
  const moodColor = { alert: '#E5484D', advisory: '#E8A33D', calm: '#00B82E' }[mood];
  const place = areaName || 'your area';

  const summary = (() => {
    const bits: string[] = [];
    if (safety.length) bits.push(`${safety.length} safety ${safety.length === 1 ? 'report' : 'reports'} near you`);
    if (traffic.length) bits.push(`go-slow: ${traffic[0].top.title}`);
    if (light.length) bits.push(`${light.length} light & water ${light.length === 1 ? 'update' : 'updates'}`);
    return bits.length ? `Today for ${place}: ${bits.join(', ')}.` : `Nothing reported around ${place} today. Wetin you wan know?`;
  })();

  return (
    <div className="flex flex-col gap-3">
      {/* Sentinel: orb, the area's mood, today in one line */}
      <div className="flex flex-col gap-2 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <div className="flex items-center gap-3">
          <span className="pointer-events-none shrink-0 scale-75">
            <SentinelOrb mood={mood} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-base font-black text-navy">Sentinel</p>
            <p className="text-xs font-bold" style={{ color: moodColor }}>
              ● {place}: {moodLine}
            </p>
          </div>
        </div>
        <p className="text-sm text-navy">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}. {summary}
        </p>
      </div>

      <SosHoldCard guardians={guardians} />

      <div className="flex flex-wrap gap-2">
        <Link href="/safety/manage#guardians" className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-extrabold text-navy shadow-sm">
          👥 {guardians} {guardians === 1 ? 'guardian' : 'guardians'}
        </Link>
        <Link href="/safety/manage#linkers" className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-extrabold text-navy shadow-sm">
          🫂 {circle} in your circle
        </Link>
        <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-extrabold ${trip ? 'bg-navy text-white' : 'bg-white text-muted shadow-sm'}`}>
          🚗 {trip ? 'Safe trip on' : 'No trip running'}
        </span>
      </div>
      <Link
        href="/safety/trips"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white"
      >
        {trip ? 'See my safe trip' : 'Start a safe trip'}
      </Link>

      {GROUPS.map((g) => (
        <section key={g.title} aria-label={g.title} className="flex flex-col gap-2">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">{g.title}</p>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex min-h-[64px] items-center gap-2.5 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-background"
              >
                <span aria-hidden className="text-xl">
                  {t.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold leading-tight text-navy">{t.label}</span>
                  <span className="text-[11px] font-semibold leading-tight text-muted">{t.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="watch-h" className="flex flex-col gap-2">
        <p id="watch-h" className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
          What Sentinel watches for you
        </p>
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          {WATCHES.map((w) => (
            <li key={w.label} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden className="text-lg">
                {w.icon}
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold text-navy">{w.label}</span>
              <span className="rounded-full bg-green-soft px-2.5 py-0.5 text-[11px] font-black text-brand-green-dark">On</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs font-bold">
          <Link href="/safety/sentinel/settings" className="text-brand-green-dark">
            Manage what Sentinel watches
          </Link>
          <Link href="/safety/how-it-works" className="text-brand-green-dark">
            How Sentinel keeps you safe
          </Link>
        </div>
      </section>
    </div>
  );
}
