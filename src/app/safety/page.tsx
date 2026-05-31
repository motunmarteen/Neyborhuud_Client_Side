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
      { icon: 'route',          label: 'Trips',         href: '/safety/trips',               iconClass: 'text-primary', description: 'Plan & monitor journeys' },
      { icon: 'check_circle',   label: 'Check-ins',     href: '/safety/manage#checkins',     iconClass: 'text-primary', description: 'Scheduled wellness pings' },
      { icon: 'my_location',    label: 'Live tracking', href: '/safety/kidnapping-tracking', iconClass: 'text-primary',   description: 'Share location with guardians' },
      { icon: 'fence',          label: 'Geofences',     href: '/safety/geofences',           iconClass: 'text-primary',   description: 'Safe & restricted zones' },
    ],
  },
  {
    title: 'Network',
    subtitle: 'People who watch out for you',
    tiles: [
      { icon: 'shield_person', label: 'Guardians',     href: '/safety/manage#guardians', iconClass: 'text-brand-blue', description: 'Trusted contacts list' },
      { icon: 'group',         label: 'Safety Circle', href: '/safety/manage#linkers',   iconClass: 'text-brand-blue', description: 'Mutual-follow network' },
      { icon: 'forum',         label: 'Status feed',   href: '/safety/manage#status',    iconClass: 'text-brand-blue', description: 'What your circle is doing' },
    ],
  },
  {
    title: 'Intelligence',
    subtitle: 'Sentinel AI watching for threats',
    tiles: [
      { icon: 'psychology',         label: 'Threat scanning',   href: '/sentinel',             iconClass: 'text-brand-blue', description: 'AI content + risk analysis' },
      { icon: 'warning',            label: 'Risk zones',        href: '/safety/geofences',     iconClass: 'text-brand-blue', description: 'Reported danger areas' },
      { icon: 'nightlight',         label: 'Late-night alerts', href: '/safety/manage#alerts', iconClass: 'text-brand-blue', description: 'Auto-warnings after hours' },
    ],
  },
  {
    title: 'History',
    subtitle: 'Past incidents & alerts',
    tiles: [
      { icon: 'history',         label: 'Incident log',    href: '/safety/manage#history',    iconClass: 'text-[var(--neu-text-muted)]', description: 'Resolved & cancelled SOS' },
      { icon: 'route',           label: 'Trip log',        href: '/safety/trips?tab=past',    iconClass: 'text-[var(--neu-text-muted)]', description: 'Completed journeys' },
      { icon: 'task_alt',        label: 'Resolved alerts', href: '/safety/manage#resolved',   iconClass: 'text-[var(--neu-text-muted)]', description: 'Past emergencies' },
    ],
  },
  {
    title: 'Tools',
    subtitle: 'Get out of risky situations',
    tiles: [
      { icon: 'phone_in_talk', label: 'Fake call',          href: '/safety/fake-call',       iconClass: 'text-primary', description: 'Stage an incoming call' },
      { icon: 'mic',           label: 'Silent recording',   href: '/safety/manage#record',   iconClass: 'text-primary', description: 'Quietly record evidence' },
      { icon: 'pin',           label: 'Panic PIN',          href: '/safety/panic-pin',       iconClass: 'text-brand-red',   description: 'Duress code → silent SOS' },
      { icon: 'contact_phone', label: 'Emergency contacts', href: '/safety/manage#contacts', iconClass: 'text-primary', description: 'Police, fire, medical' },
    ],
  },
  {
    title: 'Settings',
    subtitle: 'How Sentinel behaves for you',
    tiles: [
      { icon: 'tune',                 label: 'Auto-trigger rules', href: '/safety/manage#rules',   iconClass: 'text-[var(--neu-text-muted)]', description: 'When SOS fires automatically' },
      { icon: 'notifications_active', label: 'Notifications',      href: '/safety/manage#notifs',  iconClass: 'text-[var(--neu-text-muted)]', description: 'Alerts & sounds' },
      { icon: 'lock',                 label: 'Data & privacy',     href: '/safety/manage#privacy', iconClass: 'text-[var(--neu-text-muted)]', description: 'Retention & sharing' },
      { icon: 'medical_services',     label: 'Emergency services', href: '/safety/manage#agency', iconClass: 'text-[var(--neu-text-muted)]', description: 'Auto-dispatch toggle' },
    ],
  },
];

function PendingBanner() {
  const sos = useSos();
  if (sos.phase === 'idle') return null;
  if (sos.phase === 'pending') {
    return (
      <div className="rounded-xl border border-yellow-500/40 bg-primary950/40 p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-primary200">SOS arming…</div>
          <div className="text-xs text-primary/80">{sos.secondsRemaining}s before guardians are notified</div>
        </div>
        <button
          type="button"
          onClick={() => void sos.cancelSos('User cancelled from hub banner')}
          className="px-3 py-1.5 rounded-lg bg-brand-green-dark hover:bg-primary text-white text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }
  if (sos.phase === 'active') {
    return (
      <div className="rounded-xl border border-brand-red/50 bg-red-950/40 p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-brand-red">SOS ACTIVE</div>
          <div className="text-xs text-brand-red/80">Guardians have been notified.</div>
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
            className="px-3 py-1.5 rounded-lg bg-green-700 hover:bg-brand-green-dark text-white text-sm font-medium"
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
      className="block rounded-xl border border-brand-red/30 bg-red-950/20 hover:bg-red-950/40 p-4 mb-4 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-brand-red text-3xl">pin</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-brand-red">Set up your Panic PIN</div>
          <div className="text-xs text-brand-red/80">A duress code that silently triggers SOS when entered.</div>
        </div>
        <span className="material-symbols-outlined text-brand-red">chevron_right</span>
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
        <div className="text-[11px] text-[var(--neu-text-muted)] leading-snug">{tile.description}</div>
      )}
      {tile.badge && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-brand-red text-white text-[10px] font-bold">
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
              <span className="material-symbols-outlined text-brand-blue text-4xl">shield</span>
              <p className="text-sm text-[var(--neu-text-muted)]">Your safety control center</p>
            </div>
          </header>

          <PendingBanner />
          <PanicPinHint />

          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="mb-3">
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="text-xs text-[var(--neu-text-muted)]">{section.subtitle}</p>
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
              className="text-sm text-[var(--neu-text-muted)] hover:text-foreground underline"
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
