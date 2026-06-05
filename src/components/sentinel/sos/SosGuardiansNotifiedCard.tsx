'use client';

import Link from 'next/link';
import type { SosNotifyMeta } from '@/contexts/SosContext';

type SosGuardiansNotifiedCardProps = {
  notifyMeta: SosNotifyMeta | null;
  phase: 'idle' | 'pending' | 'active' | 'resolved' | 'cancelled';
};

export function SosGuardiansNotifiedCard({ notifyMeta, phase }: SosGuardiansNotifiedCardProps) {
  if (!notifyMeta || phase === 'idle') return null;

  const { guardiansTotal, emergencyId, sosEventId } = notifyMeta;
  const noneQueued = guardiansTotal === 0;

  return (
    <div
      className={`mod-card rounded-2xl border p-4 ${
        noneQueued ? 'border-status-warning/35 bg-status-warning/8' : 'border-primary/25 bg-primary/5'
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
        Guardian sharing
      </p>
      {noneQueued ? (
        <p className="mt-2 text-sm leading-relaxed text-status-warning/90 dark:text-status-warning/80">
          No accepted guardians were queued. Add trusted contacts under Prepare so people get your
          location when SOS fires.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--neu-text)' }}>
          Your location and SOS status are being shared with{' '}
          <strong>{guardiansTotal}</strong> guardian{guardiansTotal === 1 ? '' : 's'}.
          {phase === 'pending'
            ? ' They are notified when the countdown ends (unless you cancel).'
            : ' They can open the alert, view your map pin, and tap “I’m responding.”'}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/safety/manage#guardians"
          className="mod-chip px-3 py-1.5 text-xs font-semibold text-primary no-underline"
        >
          Manage guardians
        </Link>
        {sosEventId && phase !== 'pending' ? (
          <Link
            href={`/safety/incident/${sosEventId}`}
            className="mod-chip mod-chip-active px-3 py-1.5 text-xs font-bold text-primary no-underline"
          >
            See who responded
          </Link>
        ) : null}
        {emergencyId ? (
          <Link
            href="/safety/emergency"
            className="mod-chip px-3 py-1.5 text-xs font-semibold no-underline"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            Emergency record
          </Link>
        ) : null}
      </div>
    </div>
  );
}
