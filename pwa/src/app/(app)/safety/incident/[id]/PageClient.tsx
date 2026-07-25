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
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';
import { safetyService } from '@/services/safety.service';
import type { IncidentSummary } from '@/types/api';

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
  agency_dispatched: 'Agency assigned (not contacted — dispatch not connected)',
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
    pending:   { label: 'Pending',   cls: 'bg-status-warning/12 text-status-warning border-status-warning/40' },
    triggered: { label: 'Triggered', cls: 'bg-status-danger/12 text-status-danger border-status-danger/40' },
    active:    { label: 'Active',    cls: 'bg-status-danger/20 text-status-danger border-status-danger/50' },
    resolved:  { label: 'Resolved',  cls: 'bg-status-success/12 text-status-success border-status-success/40' },
    cancelled: {
      label: cancelledDuringPending ? 'Cancelled (no alert sent)' : 'Cancelled (false alarm)',
      cls: 'bg-status-neutral/12 text-status-neutral border-status-neutral/40',
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
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await safetyService.getSosSummary(id);
        if (!cancelled) {
          setSummary(res?.data?.summary ?? null);
          setNoteDraft(res?.data?.summary?.note ?? '');
        }
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

  const saveNote = async () => {
    if (!id || !noteDraft.trim()) return;
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      const res = await safetyService.addSosIncidentNote(id, noteDraft.trim());
      setNoteSaved(true);
      const note = res.data?.note ?? noteDraft.trim();
      const noteUpdatedAt = res.data?.noteUpdatedAt ?? new Date().toISOString();
      setSummary((prev) => (prev ? { ...prev, note, noteUpdatedAt } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <SentinelSubpageLayout
      pageTitle="Incident recap"
      pageSubtitle="Timeline of what happened, who responded, and how it ended."
      icon="history"
      iconAccent="red"
    >
        {loading && (
          <div className="mod-card py-12 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            Loading incident…
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-status-danger/10 border border-status-danger/40 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        )}

        {summary && (
          <>
            {summary.isDrill && (
              <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-600">
                🧪 This was a drill — a practice run to test guardian alerts. No real emergency occurred.
              </div>
            )}

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
                  Fastest response: <span className="text-primary font-medium">{formatDuration(summary.guardians.fastestResponseMs)}</span>
                </div>
              )}
              {summary.guardians.tiersNotified && summary.guardians.tiersNotified.length > 0 && (
                <div className="mt-2 text-xs text-white/60">
                  Escalated through priority tier{summary.guardians.tiersNotified.length === 1 ? '' : 's'}:{' '}
                  <span className="text-primary font-medium">{summary.guardians.tiersNotified.join(', ')}</span>
                </div>
              )}
              {summary.guardians.details.length > 0 && (
                <ul className="mt-3 divide-y divide-white/5">
                  {summary.guardians.details.map((g) => (
                    <li key={g.guardianId} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-white/70 font-mono truncate">
                        {g.guardianId}
                        {g.priorityLevel !== null && (
                          <span className="ml-1.5 rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/50">
                            tier {g.priorityLevel}
                          </span>
                        )}
                      </span>
                      <span className={g.acknowledgedAt ? 'text-primary' : g.notifiedAt ? 'text-primary400' : 'text-white/40'}>
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
              {summary.agencyDispatch ? (
                <>
                  <div className="text-sm flex items-center justify-between">
                    <span className="text-white/70">{summary.agencyDispatch.agency || 'No agency'} (assigned for records only)</span>
                    <span className="text-white/50">
                      {summary.agencyDispatch.status === 'sent' ? 'logged' : summary.agencyDispatch.status.replace('_', ' ')}
                    </span>
                  </div>
                  {summary.agencyDispatch.dispatchedAt && (
                    <div className="text-xs text-white/50 mt-1">
                      Logged {new Date(summary.agencyDispatch.dispatchedAt).toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-brand-red mt-1">
                    Automatic agency notification isn&apos;t connected yet — this agency was never actually contacted.
                  </div>
                </>
              ) : (
                <div className="text-xs text-white/50">No emergency services were contacted for this incident.</div>
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

            {/* ── Personal note ───────────────────────────────────────── */}
            <div className="rounded-xl neu-card p-4 mt-4">
              <h2 className="text-sm font-semibold mb-2">Your note</h2>
              <p className="text-xs text-white/50 mb-2">
                Add a short note or correction — e.g. &quot;actually I was fine, this was a training exercise.&quot;
              </p>
              <textarea
                value={noteDraft}
                onChange={(e) => {
                  setNoteDraft(e.target.value.slice(0, 1000));
                  setNoteSaved(false);
                }}
                maxLength={1000}
                rows={3}
                placeholder="Add a note about this incident…"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-white/40">
                  {summary.noteUpdatedAt ? `Last saved ${new Date(summary.noteUpdatedAt).toLocaleString()}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  {noteSaved && <span className="text-[11px] text-primary">Saved</span>}
                  <button
                    type="button"
                    onClick={() => void saveNote()}
                    disabled={noteSaving || !noteDraft.trim() || noteDraft.trim() === (summary.note ?? '')}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {noteSaving ? 'Saving…' : 'Save note'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
    </SentinelSubpageLayout>
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
