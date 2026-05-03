'use client';

/**
 * Incident recap — post-incident summary for a single SOS event.
 *
 * Renders the IncidentSummary returned by GET /safety/sos/:id/summary or by
 * the resolve endpoint. Shows duration, guardians notified/acknowledged,
 * agency dispatch status, location, and the full event timeline.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { safetyService } from '@/services/safety.service';
import type { IncidentSummary } from '@/types/api';

export const dynamic = 'force-dynamic';

const TIMELINE_ICON: Record<IncidentSummary['timeline'][number]['event'], string> = {
  sos_created: 'flag',
  countdown_ended: 'timer',
  guardian_notified: 'notifications_active',
  guardian_acknowledged_alert: 'how_to_reg',
  guardian_viewed_location: 'visibility',
  guardian_ignored_alert: 'notifications_off',
  agency_dispatched: 'local_police',
  sos_resolved: 'task_alt',
  sos_cancelled: 'cancel',
};

const TIMELINE_LABEL: Record<IncidentSummary['timeline'][number]['event'], string> = {
  sos_created: 'SOS created',
  countdown_ended: 'Countdown ended',
  guardian_notified: 'Guardian notified',
  guardian_acknowledged_alert: 'Guardian acknowledged',
  guardian_viewed_location: 'Guardian viewed location',
  guardian_ignored_alert: 'Guardian ignored alert',
  agency_dispatched: 'Agency dispatched',
  sos_resolved: 'SOS resolved',
  sos_cancelled: 'SOS cancelled',
};

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function StatusPill({ status, cancelledDuringPending }: { status: IncidentSummary['status']; cancelledDuringPending: boolean }) {
  const map: Record<IncidentSummary['status'], { label: string; cls: string }> = {
    pending:   { label: 'Pending',   cls: 'bg-yellow-700/40 text-yellow-200 border-yellow-600/50' },
    triggered: { label: 'Triggered', cls: 'bg-orange-700/40 text-orange-200 border-orange-600/50' },
    active:    { label: 'Active',    cls: 'bg-red-700/40 text-red-200 border-red-600/50' },
    resolved:  { label: 'Resolved',  cls: 'bg-green-700/40 text-green-200 border-green-600/50' },
    cancelled: {
      label: cancelledDuringPending ? 'Cancelled (no alert sent)' : 'Cancelled (false alarm)',
      cls: 'bg-slate-700/40 text-slate-200 border-slate-600/50',
    },
  };
  const v = map[status];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
}

export default function IncidentRecapPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await safetyService.getSosSummary(id);
        if (!cancelled) setSummary(res?.data?.summary ?? null);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load incident.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-20">
        <button
          type="button"
          onClick={() => router.push('/safety')}
          className="text-sm text-white/60 hover:text-white mb-4 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Sentinel
        </button>

        <header className="mb-6">
          <h1 className="text-2xl font-bold">Incident recap</h1>
          <p className="text-sm text-white/60">A timeline of what happened, who responded, and how it ended.</p>
        </header>

        {loading && <div className="text-center text-white/60 py-12">Loading incident…</div>}
        {error && (
          <div className="rounded-lg bg-red-950/40 border border-red-700/50 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {summary && (
          <>
            {/* ── Header card ─────────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <StatusPill status={summary.status} cancelledDuringPending={summary.cancelledDuringPending} />
                <span className="text-xs text-white/50">
                  {summary.visibilityMode === 'silent' ? '🤫 Silent SOS' : 'Normal SOS'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-white/50">Started</div>
                  <div>{new Date(summary.startedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Resolved</div>
                  <div>{summary.resolvedAt ? new Date(summary.resolvedAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Duration</div>
                  <div>{formatDuration(summary.durationMs)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Location</div>
                  <div className="truncate">
                    {summary.location.address || `${summary.location.lat.toFixed(4)}, ${summary.location.lng.toFixed(4)}`}
                  </div>
                </div>
              </div>
              {summary.cancelReason && (
                <div className="mt-3 text-xs text-white/60">
                  <span className="text-white/40">Reason: </span>{summary.cancelReason}
                </div>
              )}
            </div>

            {/* ── Guardians ───────────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4 mb-4">
              <h2 className="text-sm font-semibold mb-3">Guardians</h2>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Stat label="Total"        value={summary.guardians.total} />
                <Stat label="Notified"     value={summary.guardians.notifiedCount} />
                <Stat label="Responded"    value={summary.guardians.acknowledgedCount} />
              </div>
              {summary.guardians.fastestResponseMs !== null && (
                <div className="text-xs text-white/60">
                  Fastest response: <span className="text-green-400 font-medium">{formatDuration(summary.guardians.fastestResponseMs)}</span>
                </div>
              )}
              {summary.guardians.details.length > 0 && (
                <ul className="mt-3 divide-y divide-white/5">
                  {summary.guardians.details.map((g) => (
                    <li key={g.guardianId} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-white/70 font-mono truncate">{g.guardianId}</span>
                      <span className={g.acknowledgedAt ? 'text-green-400' : g.notifiedAt ? 'text-yellow-400' : 'text-white/40'}>
                        {g.acknowledgedAt
                          ? `Acked in ${formatDuration(g.responseMs ?? 0)}`
                          : g.notifiedAt
                          ? 'Notified, no response'
                          : 'Not notified'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Agency dispatch ─────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4 mb-4">
              <h2 className="text-sm font-semibold mb-2">Emergency services</h2>
              <div className="text-sm flex items-center justify-between">
                <span className="text-white/70">{summary.agencyDispatch.agency || 'No agency'}</span>
                <span
                  className={
                    summary.agencyDispatch.status === 'sent'
                      ? 'text-green-400'
                      : summary.agencyDispatch.status === 'failed'
                      ? 'text-red-400'
                      : 'text-white/50'
                  }
                >
                  {summary.agencyDispatch.status.replace('_', ' ')}
                </span>
              </div>
              {summary.agencyDispatch.dispatchedAt && (
                <div className="text-xs text-white/50 mt-1">
                  Dispatched {new Date(summary.agencyDispatch.dispatchedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* ── Tracking ────────────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4 mb-4">
              <h2 className="text-sm font-semibold mb-2">Tracking</h2>
              <div className="text-sm">
                {summary.tracking.pingsLogged} location ping{summary.tracking.pingsLogged === 1 ? '' : 's'} recorded
              </div>
            </div>

            {/* ── Timeline ────────────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4">
              <h2 className="text-sm font-semibold mb-3">Timeline</h2>
              {summary.timeline.length === 0 ? (
                <div className="text-xs text-white/50">No events recorded.</div>
              ) : (
                <ol className="relative border-l border-white/10 ml-2 space-y-4">
                  {summary.timeline.map((evt, idx) => (
                    <li key={`${evt.at}-${idx}`} className="ml-4">
                      <span className="absolute -left-[7px] flex w-3.5 h-3.5 rounded-full bg-white/10 border border-white/20 items-center justify-center" />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-base text-white/70">
                          {TIMELINE_ICON[evt.event] ?? 'circle'}
                        </span>
                        <span className="font-medium">{TIMELINE_LABEL[evt.event] ?? evt.event}</span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {new Date(evt.at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
