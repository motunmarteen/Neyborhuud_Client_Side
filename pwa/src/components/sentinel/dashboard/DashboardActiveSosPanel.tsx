'use client';

import Link from 'next/link';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { SosGuardiansNotifiedCard } from '@/components/sentinel/sos/SosGuardiansNotifiedCard';
import type { UseSosReturn } from '@/hooks/useSos';
import { SosResponders } from '@/components/sentinel/sos/SosResponders';

type DashboardActiveSosPanelProps = {
  sos: UseSosReturn;
};

export function DashboardActiveSosPanel({ sos }: DashboardActiveSosPanelProps) {
  if (sos.phase === 'idle' && !sos.notifyMeta) {
    return (
      <div className="mod-card rounded-2xl p-4 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          No active SOS. Use{' '}
          <Link href="/sos" className="font-semibold text-primary no-underline">
            Open SOS
          </Link>{' '}
          to arm or trigger an alert.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SosGuardiansNotifiedCard notifyMeta={sos.notifyMeta} phase={sos.phase} />

      {sos.phase === 'pending' && (
        <div className="mod-card rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-bold text-primary">
            SOS arming — {sos.secondsRemaining}s remaining
          </p>
          <button
            type="button"
            onClick={() => void sos.cancelSos('Cancelled from dashboard')}
            className="mt-3 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary"
          >
            Cancel countdown
          </button>
        </div>
      )}

      {sos.phase === 'active' && sos.activeSos && (
        <section
          className={`mod-card space-y-3 rounded-2xl border p-4 ${
            sos.activeSos.visibilityMode === 'silent' ? 'border-black/[0.08]' : 'border-brand-red/25'
          }`}
        >
          <SentinelSectionHeader
            title={sos.activeSos.visibilityMode === 'silent' ? 'Status' : sos.activeSos.isDrill ? 'Practice SOS' : 'Active SOS'}
            subtitle="Who was alerted and who is coming"
            action={
              <Link
                href={`/safety/incident/${sos.activeSos._id}`}
                className="text-xs font-semibold text-primary no-underline hover:underline"
              >
                Full timeline
              </Link>
            }
          />
          <SosResponders
            sosEventId={sos.activeSos._id}
            isDrill={sos.activeSos.isDrill === true}
            silent={sos.activeSos.visibilityMode === 'silent'}
            className="!p-0 !shadow-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sos.resolveSos()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              {sos.activeSos.isDrill ? 'End practice' : <>I&apos;m safe</>}
            </button>
            <Link href="/sos" className="mod-chip px-4 py-2 text-sm font-semibold text-primary no-underline">
              SOS command center
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
