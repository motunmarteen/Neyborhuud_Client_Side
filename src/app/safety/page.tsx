'use client';

/**
 * Sentinel hub — the safety control center.
 *
 * Replaces the legacy flat safety page. Existing rich functionality
 * (guardians, status feed, activity log, etc.) lives at /safety/manage.
 *
 * Layout: 6 themed sections of action tiles. Each tile is a Link to a
 * dedicated route. SOS itself is the floating button in BottomNav, NOT
 * a tile here.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { useSos } from '@/hooks/useSos';
import { safetyService } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

interface Tile {
  icon: string;
  label: string;
  href: string;
  /** tailwind text color class for the icon */
  iconClass?: string;
  description?: string;
  badge?: string;
}

interface Section {
  title: string;
  subtitle: string;
  tiles: Tile[];
}

const SECTIONS: Section[] = [
  {
    title: 'Active protection',
    subtitle: 'Things keeping you safe right now',
    tiles: [
      { icon: 'route',          label: 'Trips',         href: '/safety/trips',               iconClass: 'text-emerald-400', description: 'Plan & monitor journeys' },
      { icon: 'check_circle',   label: 'Check-ins',     href: '/safety/manage#checkins',     iconClass: 'text-emerald-400', description: 'Scheduled wellness pings' },
      { icon: 'my_location',    label: 'Live tracking', href: '/safety/kidnapping-tracking', iconClass: 'text-amber-400',   description: 'Share location with guardians' },
      { icon: 'fence',          label: 'Geofences',     href: '/safety/geofences',           iconClass: 'text-amber-400',   description: 'Safe & restricted zones' },
    ],
  },
  {
    title: 'Network',
    subtitle: 'People who watch out for you',
    tiles: [
      { icon: 'shield_person', label: 'Guardians',     href: '/safety/manage#guardians', iconClass: 'text-blue-400', description: 'Trusted contacts list' },
      { icon: 'group',         label: 'Safety Circle', href: '/safety/manage#linkers',   iconClass: 'text-blue-400', description: 'Mutual-follow network' },
      { icon: 'forum',         label: 'Status feed',   href: '/safety/manage#status',    iconClass: 'text-blue-400', description: 'What your circle is doing' },
    ],
  },
  {
    title: 'Intelligence',
    subtitle: 'Sentinel AI watching for threats',
    tiles: [
      { icon: 'psychology',         label: 'Threat scanning',   href: '/sentinel',             iconClass: 'text-violet-400', description: 'AI content + risk analysis' },
      { icon: 'warning',            label: 'Risk zones',        href: '/safety/geofences',     iconClass: 'text-violet-400', description: 'Reported danger areas' },
      { icon: 'nightlight',         label: 'Late-night alerts', href: '/safety/manage#alerts', iconClass: 'text-violet-400', description: 'Auto-warnings after hours' },
    ],
  },
  {
    title: 'History',
    subtitle: 'Past incidents & alerts',
    tiles: [
      { icon: 'history',         label: 'Incident log',    href: '/safety/manage#history',    iconClass: 'text-slate-400', description: 'Resolved & cancelled SOS' },
      { icon: 'route',           label: 'Trip log',        href: '/safety/trips?tab=past',    iconClass: 'text-slate-400', description: 'Completed journeys' },
      { icon: 'task_alt',        label: 'Resolved alerts', href: '/safety/manage#resolved',   iconClass: 'text-slate-400', description: 'Past emergencies' },
    ],
  },
  {
    title: 'Tools',
    subtitle: 'Get out of risky situations',
    tiles: [
      { icon: 'phone_in_talk', label: 'Fake call',          href: '/safety/fake-call',       iconClass: 'text-green-400', description: 'Stage an incoming call' },
      { icon: 'mic',           label: 'Silent recording',   href: '/safety/manage#record',   iconClass: 'text-green-400', description: 'Quietly record evidence' },
      { icon: 'pin',           label: 'Panic PIN',          href: '/safety/panic-pin',       iconClass: 'text-red-400',   description: 'Duress code → silent SOS' },
      { icon: 'contact_phone', label: 'Emergency contacts', href: '/safety/manage#contacts', iconClass: 'text-green-400', description: 'Police, fire, medical' },
    ],
  },
  {
    title: 'Settings',
    subtitle: 'How Sentinel behaves for you',
    tiles: [
      { icon: 'tune',                 label: 'Auto-trigger rules', href: '/safety/manage#rules',   iconClass: 'text-slate-400', description: 'When SOS fires automatically' },
      { icon: 'notifications_active', label: 'Notifications',      href: '/safety/manage#notifs',  iconClass: 'text-slate-400', description: 'Alerts & sounds' },
      { icon: 'lock',                 label: 'Data & privacy',     href: '/safety/manage#privacy', iconClass: 'text-slate-400', description: 'Retention & sharing' },
      { icon: 'medical_services',     label: 'Emergency services', href: '/safety/manage#agency', iconClass: 'text-slate-400', description: 'Auto-dispatch toggle' },
    ],
  },
];

function PendingBanner() {
  const sos = useSos();
  if (sos.phase === 'idle') return null;
  if (sos.phase === 'pending') {
    return (
      <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/40 p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-yellow-200">SOS arming…</div>
          <div className="text-xs text-yellow-300/80">{sos.secondsRemaining}s before guardians are notified</div>
        </div>
        <button
          type="button"
          onClick={() => void sos.cancelSos('User cancelled from hub banner')}
          className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }
  if (sos.phase === 'active') {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-red-200">SOS ACTIVE</div>
          <div className="text-xs text-red-300/80">Guardians have been notified.</div>
        </div>
        <div className="flex gap-2">
          {sos.activeSos?._id && (
            <Link
              href={`/safety/incident/${sos.activeSos._id}`}
              className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium"
            >
              View incident
            </Link>
          )}
          <button
            type="button"
            onClick={() => void sos.resolveSos()}
            className="px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium"
          >
            I'm safe
          </button>
        </div>
      </div>
    );
  }
  return null;
}

function PanicPinHint() {
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getPanicPinStatus()
      .then((res) => {
        if (!cancelled) setPinSet(Boolean(res?.data?.panicPinSet));
      })
      .catch(() => {
        if (!cancelled) setPinSet(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (pinSet !== false) return null;
  return (
    <Link
      href="/safety/panic-pin"
      className="block rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 p-4 mb-4 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-red-400 text-3xl">pin</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-200">Set up your Panic PIN</div>
          <div className="text-xs text-red-300/80">A duress code that silently triggers SOS when entered.</div>
        </div>
        <span className="material-symbols-outlined text-red-300">chevron_right</span>
      </div>
    </Link>
  );
}

function Tile({ tile }: { tile: Tile }) {
  return (
    <Link
      href={tile.href}
      className="group relative rounded-xl neu-card p-4 hover:bg-white/5 transition-colors flex flex-col gap-2 min-h-[110px]"
    >
      <span className={`material-symbols-outlined text-[28px] ${tile.iconClass ?? ''}`}>
        {tile.icon}
      </span>
      <div className="text-sm font-semibold leading-tight">{tile.label}</div>
      {tile.description && (
        <div className="text-[11px] text-white/60 leading-snug">{tile.description}</div>
      )}
      {tile.badge && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
          {tile.badge}
        </span>
      )}
    </Link>
  );
}

export default function SentinelHubPage() {
  const sos = useSos();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6 pt-4 pb-20">
        <aside className="hidden lg:block sticky top-20 self-start">
          <LeftSidebar />
        </aside>
        <main className="min-w-0">
          <header className="mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-purple-400 text-4xl">shield</span>
              <div>
                <h1 className="text-2xl font-bold">Sentinel</h1>
                <p className="text-sm text-white/60">Your safety control center</p>
              </div>
            </div>
          </header>

          <PendingBanner />
          <PanicPinHint />

          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="mb-3">
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="text-xs text-white/50">{section.subtitle}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {section.tiles.map((tile) => (
                    <Tile key={tile.label} tile={tile} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/safety/manage"
              className="text-sm text-white/60 hover:text-white underline"
            >
              Open advanced safety dashboard →
            </Link>
          </div>
        </main>
        <aside className="hidden lg:block sticky top-20 self-start">
          <RightSidebar />
        </aside>
      </div>
      <BottomNav />
    </div>
  );
}
