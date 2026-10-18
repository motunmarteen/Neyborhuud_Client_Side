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
import { useTranslation } from '@/lib/i18n';

// Text lives in src/locales (sentinel.*): tool.<id> and tool.<id>.sub.
const GROUPS: { id: string; items: { id: string; icon: string; href: string }[] }[] = [
  {
    id: 'protect',
    items: [
      { id: 'trips', icon: '🚗', href: '/safety/trips' },
      { id: 'tracking', icon: '📍', href: '/safety/kidnapping-tracking' },
      { id: 'zones', icon: '🗺️', href: '/safety/geofences' },
      { id: 'checkins', icon: '✅', href: '/safety/manage#checkins' },
    ],
  },
  {
    id: 'network',
    items: [
      { id: 'guardians', icon: '👥', href: '/safety/manage#guardians' },
      { id: 'circle', icon: '🫂', href: '/safety/manage#linkers' },
      { id: 'status', icon: '📡', href: '/safety/manage#status' },
      { id: 'alerts', icon: '🔔', href: '/safety/manage#alerts' },
    ],
  },
  {
    id: 'tools',
    items: [
      { id: 'panic', icon: '🔢', href: '/safety/panic-pin' },
      { id: 'fakecall', icon: '📞', href: '/safety/fake-call' },
      { id: 'emergency', icon: '🆘', href: '/safety/emergency' },
      { id: 'community', icon: '📣', href: '/community-emergency' },
      { id: 'incidents', icon: '🚨', href: '/incident-reports' },
      { id: 'history', icon: '🕘', href: '/safety/trips/history' },
    ],
  },
];

const WATCHES = [
  { id: 'chats', icon: '💬' },
  { id: 'posts', icon: '📰' },
  { id: 'sellers', icon: '🛒' },
  { id: 'zones', icon: '📍' },
  { id: 'trust', icon: '🤝' },
];

const HOLD_MS = 3000;

const greetingKey = (d = new Date()) => (d.getHours() < 12 ? 'sentinel.morning' : d.getHours() < 17 ? 'sentinel.afternoon' : 'sentinel.evening');

const countOf = (res: unknown, key: string) => {
  const d = (res as { data?: Record<string, unknown> })?.data ?? (res as Record<string, unknown>);
  const v = d?.[key];
  return Array.isArray(v) ? v.length : 0;
};

/** Hold the button for 3 seconds to start an SOS (the usual countdown still lets you cancel). */
function SosHoldCard({ guardians }: { guardians: number }) {
  const { t } = useTranslation();
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
        aria-label={active ? t('sentinel.sosOn') : t('sentinel.sosHoldAria')}
        className="relative grid h-20 w-20 shrink-0 touch-none select-none place-items-center rounded-full bg-[#E5484D] text-lg font-black text-white shadow-[0_6px_18px_rgba(229,72,77,0.45)]"
        style={{ background: `conic-gradient(#8E1B1F ${p * 360}deg, #E5484D 0deg)` }}
      >
        <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#E5484D]">SOS</span>
      </button>
      <div className="min-w-0">
        <p className="font-heading text-base font-black text-navy">{active ? t('sentinel.sosOn') : t('sentinel.sosHold')}</p>
        <p className="text-sm text-navy">
          {active ? (
            <Link href="/sos" className="font-bold text-[#B42318] underline">
              {t('sentinel.openSos')}
            </Link>
          ) : guardians > 0 ? (
            t('sentinel.sosGuardians', { count: guardians })
          ) : (
            <>
              {t('sentinel.sosNoGuardians')}{' '}
              <Link href="/safety/manage#guardians" className="font-bold text-[#B42318] underline">
                {t('sentinel.addGuardian')}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function SentinelHub({ user, areaName }: { user: unknown; areaName?: string | null }) {
  const { t } = useTranslation();
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
  const moodLine = t(`sentinel.mood.${mood}`);
  const moodColor = { alert: '#E5484D', advisory: '#E8A33D', calm: '#00B82E' }[mood];
  const place = areaName || t('sentinel.yourArea');

  const summary = (() => {
    const bits: string[] = [];
    if (safety.length) bits.push(t('sentinel.sumSafety', { count: safety.length }));
    if (traffic.length) bits.push(t('sentinel.sumTraffic', { road: traffic[0].top.title }));
    if (light.length) bits.push(t('sentinel.sumLight', { count: light.length }));
    return bits.length ? t('sentinel.today', { place, items: bits.join(', ') }) : t('sentinel.quiet', { place });
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
          {t(greetingKey())}
          {firstName ? `, ${firstName}` : ''}. {summary}
        </p>
      </div>

      <SosHoldCard guardians={guardians} />

      <div className="flex flex-wrap gap-2">
        <Link href="/safety/manage#guardians" className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-extrabold text-navy shadow-sm">
          👥 {t('sentinel.guardians', { count: guardians })}
        </Link>
        <Link href="/safety/manage#linkers" className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-extrabold text-navy shadow-sm">
          🫂 {t('sentinel.circle', { count: circle })}
        </Link>
        <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-extrabold ${trip ? 'bg-navy text-white' : 'bg-white text-muted shadow-sm'}`}>
          🚗 {trip ? t('sentinel.tripOn') : t('sentinel.tripOff')}
        </span>
      </div>
      <Link
        href="/safety/trips"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white"
      >
        {trip ? t('sentinel.seeTrip') : t('sentinel.startTrip')}
      </Link>

      {GROUPS.map((g) => (
        <section key={g.id} aria-label={t(`sentinel.group.${g.id}`)} className="flex flex-col gap-2">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">{t(`sentinel.group.${g.id}`)}</p>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map((it) => (
              <Link
                key={it.id}
                href={it.href}
                className="flex min-h-[64px] items-center gap-2.5 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-background"
              >
                <span aria-hidden className="text-xl">
                  {it.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold leading-tight text-navy">{t(`sentinel.tool.${it.id}`)}</span>
                  <span className="text-[11px] font-semibold leading-tight text-muted">{t(`sentinel.tool.${it.id}.sub`)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="watch-h" className="flex flex-col gap-2">
        <p id="watch-h" className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
          {t('sentinel.watchesTitle')}
        </p>
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          {WATCHES.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden className="text-lg">
                {w.icon}
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold text-navy">{t(`sentinel.watch.${w.id}`)}</span>
              <span className="rounded-full bg-green-soft px-2.5 py-0.5 text-[11px] font-black text-brand-green-dark">{t('common.on')}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs font-bold">
          <Link href="/safety/sentinel/settings" className="text-brand-green-dark">
            {t('sentinel.manage')}
          </Link>
          <Link href="/safety/how-it-works" className="text-brand-green-dark">
            {t('sentinel.howItWorks')}
          </Link>
        </div>
      </section>
    </div>
  );
}
