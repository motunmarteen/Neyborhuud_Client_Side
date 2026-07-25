'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { kidnappingTrackingService, type GuardianWatchableSession } from '@/services/safety.service';
import { emergencyTypeLabel } from '@/lib/liveTrackingFormat';

const LINKS = [
  {
    href: '/safety/manage#guardians',
    icon: 'group_add',
    title: 'Manage guardians',
    body: 'Only accepted guardians receive live tracking pings and alerts.',
  },
  {
    href: '/sos',
    icon: 'emergency',
    title: 'SOS command center',
    body: 'Pair tracking with SOS if the situation escalates.',
  },
  {
    href: '/safety/trips',
    icon: 'route',
    title: 'Safe trips',
    body: 'For planned journeys with check-ins — lighter than live tracking.',
  },
] as const;

function ActiveSessionsList() {
  const [sessions, setSessions] = useState<GuardianWatchableSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await kidnappingTrackingService.getActiveSessionsForGuardian();
        if (!cancelled) setSessions(res.data?.sessions ?? []);
      } catch {
        if (!cancelled) setError('Could not load active sessions.');
      }
    };
    void load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error) return null;
  if (sessions === null) {
    return (
      <div className="mod-card rounded-2xl p-4 text-center">
        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>Checking for active sessions…</p>
      </div>
    );
  }
  if (sessions.length === 0) return null;

  return (
    <div className="grid gap-2">
      {sessions.map((s) => {
        const user = typeof s.userId === 'object' ? s.userId : null;
        const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Someone you protect';
        const live = s.status === 'active' || s.status === 'lost_signal';
        return (
          <Link
            key={s._id}
            href={`/safety/kidnapping-tracking/watch/${s._id}`}
            className="mod-card flex items-center gap-3 rounded-2xl border-2 p-4 no-underline"
            style={{ borderColor: live ? '#FF0000' : 'var(--neu-border, transparent)' }}
          >
            <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-red">
              <span className="material-symbols-outlined text-[22px]">my_location</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {name} — {emergencyTypeLabel(s.emergencyType)}
              </p>
              <p className="mt-0.5 text-xs capitalize" style={{ color: live ? '#FF0000' : 'var(--neu-text-muted)' }}>
                {s.status.replace('_', ' ')}
              </p>
            </div>
            <span className="material-symbols-outlined shrink-0 self-center text-primary">chevron_right</span>
          </Link>
        );
      })}
    </div>
  );
}

export function LiveTrackingGuardianPanel() {
  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="For guardians"
        subtitle="You protect someone when they add you as an accepted guardian."
      />
      <ActiveSessionsList />
      <div className="grid gap-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mod-card flex gap-3 rounded-2xl p-4 no-underline"
          >
            <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-red">
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {item.body}
              </p>
            </div>
            <span className="material-symbols-outlined shrink-0 self-center text-primary">chevron_right</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
