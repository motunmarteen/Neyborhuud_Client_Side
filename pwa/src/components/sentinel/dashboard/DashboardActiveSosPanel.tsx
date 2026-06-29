'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { SosGuardiansNotifiedCard } from '@/components/sentinel/sos/SosGuardiansNotifiedCard';
import type { UseSosReturn } from '@/hooks/useSos';
import { safetyService } from '@/services/safety.service';

type DashboardActiveSosPanelProps = {
  sos: UseSosReturn;
};

export function DashboardActiveSosPanel({ sos }: DashboardActiveSosPanelProps) {
  const [activity, setActivity] = useState<
    Array<{ _id: string; guardianId: unknown; action: string; timestamp: string }>
  >([]);

  useEffect(() => {
    if (!sos.activeSos?._id || sos.phase !== 'active') {
      setActivity([]);
      return;
    }
    let cancelled = false;
    void safetyService.getGuardianActivity(sos.activeSos._id).then((res) => {
      if (!cancelled) setActivity(res.data?.logs ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [sos.activeSos?._id, sos.phase]);

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
        <section className="mod-card space-y-3 rounded-2xl border border-brand-red/25 p-4">
          <SentinelSectionHeader
            title="Active SOS — guardian activity"
            subtitle="See who was notified and who responded"
            action={
              <Link
                href={`/safety/incident/${sos.activeSos._id}`}
                className="text-xs font-semibold text-primary no-underline hover:underline"
              >
                Full timeline
              </Link>
            }
          />
          {activity.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              Waiting for guardian responses…
            </p>
          ) : (
            <ul className="space-y-1">
              {activity.slice(0, 10).map((log) => (
                <li key={log._id} className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                  {new Date(log.timestamp).toLocaleTimeString()} · {log.action.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sos.resolveSos()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              I&apos;m safe
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
