'use client';

import Link from 'next/link';
import type { SosPhase } from '@/hooks/useSos';

type SentinelDashboardHeroProps = {
  acceptedGuardians: number;
  pendingIncoming: number;
  activeEmergencyCount: number;
  sosPhase: SosPhase;
  alertCount: number;
};

export function SentinelDashboardHero({
  acceptedGuardians,
  pendingIncoming,
  activeEmergencyCount,
  sosPhase,
  alertCount,
}: SentinelDashboardHeroProps) {
  const sosLive = sosPhase === 'active' || sosPhase === 'pending';

  return (
    <div className="mod-card rounded-2xl bg-gradient-to-br from-brand-blue/10 via-[var(--neu-bg)] to-primary/8 p-5">
      <div className="flex items-start gap-4">
        <div className="mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-brand-blue">
          <span
            className="material-symbols-outlined text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dashboard
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            Sentinel dashboard
          </p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug" style={{ color: 'var(--neu-text)' }}>
            Your safety control panel
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            Manage guardians, share live status, respond to alerts, and open advanced tools — everything
            that keeps your circle informed.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill label="Guardians" value={String(acceptedGuardians)} accent="primary" />
        <StatPill
          label="Requests"
          value={String(pendingIncoming)}
          accent={pendingIncoming > 0 ? 'amber' : 'muted'}
        />
        <StatPill
          label="SOS"
          value={sosLive ? 'Live' : 'Idle'}
          accent={sosLive ? 'red' : 'muted'}
        />
        <StatPill
          label="Alerts"
          value={String(alertCount + activeEmergencyCount)}
          accent={alertCount + activeEmergencyCount > 0 ? 'red' : 'muted'}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/sos"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2.5 text-sm font-bold text-white no-underline"
        >
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          Open SOS
        </Link>
        <Link
          href="/safety"
          className="mod-chip inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold no-underline"
          style={{ color: 'var(--neu-text)' }}
        >
          Feature hub
        </Link>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'primary' | 'red' | 'amber' | 'muted';
}) {
  const ring =
    accent === 'red'
      ? 'border-brand-red/30 bg-brand-red/8 text-brand-red'
      : accent === 'amber'
        ? 'border-status-warning/30 bg-status-warning/8 text-status-warning dark:text-status-warning'
        : accent === 'primary'
          ? 'border-primary/25 bg-primary/8 text-primary'
          : 'border-[var(--neu-shadow-dark)]/20';

  return (
    <div className={`mod-inset rounded-xl border px-3 py-2 text-center ${ring}`}>
      <p className="text-lg font-black tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
