'use client';

import { useEffect, useRef } from 'react';
import type { UseKidnappingTrackingReturn } from '@/hooks/useKidnappingTracking';
import type { KidnappingTrackingSession } from '@/services/safety.service';
import {
  emergencyTypeLabel,
  formatTrackingDistance,
  formatTrackingDuration,
  formatTrackingTime,
} from '@/lib/liveTrackingFormat';

type LiveTrackingActivePanelProps = {
  session: KidnappingTrackingSession;
  tracking: UseKidnappingTrackingReturn;
  onStop: () => void | Promise<void>;
  onRefreshSummary: () => void | Promise<void>;
};

export function LiveTrackingActivePanel({
  session,
  tracking,
  onStop,
  onRefreshSummary,
}: LiveTrackingActivePanelProps) {
  const summary = tracking.summary;
  const latest = tracking.latestLocation;
  const autoSummaryRequested = useRef(false);

  useEffect(() => {
    if (summary || autoSummaryRequested.current) return;
    autoSummaryRequested.current = true;
    void onRefreshSummary();
  }, [session._id, summary, onRefreshSummary]);

  const handleStopClick = () => {
    if (tracking.stopping) return;
    const confirmed = window.confirm(
      'Stop live tracking? Guardians will no longer receive new location updates.',
    );
    if (!confirmed) return;
    void onStop();
  };

  return (
    <div className="relative z-20 space-y-4 pb-28">
      <div className="mod-card space-y-4 overflow-visible rounded-2xl border border-brand-red/25 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-red">Active session</p>
            <p className="mt-1 text-sm font-bold capitalize" style={{ color: 'var(--neu-text)' }}>
              {emergencyTypeLabel(session.emergencyType)} · {session.status.replace('_', ' ')}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--neu-text-muted)' }}>
              …{session._id.slice(-8)}
            </p>
          </div>
          <div className="relative z-30 flex flex-wrap gap-2">
            {tracking.queuedCount > 0 && tracking.isOnline ? (
              <button
                type="button"
                onClick={() => void tracking.flushOfflineQueue()}
                className="mod-chip touch-manipulation rounded-full px-3 py-1.5 text-xs font-bold text-primary"
              >
                Sync {tracking.queuedCount} queued
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleStopClick}
              disabled={tracking.stopping}
              className="touch-manipulation rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-2.5 text-xs font-bold text-brand-red disabled:opacity-50"
            >
              {tracking.stopping ? 'Stopping…' : 'Stop tracking'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Interval
            </p>
            <p className="mt-0.5 text-sm font-semibold">{session.intervalSeconds}s</p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Missed pings
            </p>
            <p className={`mt-0.5 text-sm font-semibold ${session.missedPings > 0 ? 'text-brand-red' : ''}`}>
              {session.missedPings}
            </p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Activated
            </p>
            <p className="mt-0.5 text-xs font-semibold capitalize">{session.activatedBy}</p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Last ping
            </p>
            <p className="mt-0.5 text-xs font-semibold">
              {session.lastPingAt ? formatTrackingTime(session.lastPingAt) : '—'}
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-xs ${
            session.authorityNotified
              ? 'border border-primary/30 bg-primary/10 text-primary'
              : 'mod-inset'
          }`}
          style={session.authorityNotified ? undefined : { color: 'var(--neu-text-muted)' }}
        >
          {session.authorityNotified
            ? `Authorities notified${session.assignedAgencies.length ? ` — ${session.assignedAgencies.join(', ')}` : ''}`
            : 'Awaiting authority notification from server…'}
        </div>

        {latest ? (
          <div className="mod-inset rounded-xl p-3 text-xs">
            <p className="font-bold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
              Latest ping
            </p>
            <p className="mt-1 font-mono text-sm" style={{ color: 'var(--neu-text)' }}>
              {latest.location.lat.toFixed(6)}, {latest.location.lng.toFixed(6)}
            </p>
            <p className="mt-1 flex flex-wrap gap-3" style={{ color: 'var(--neu-text-muted)' }}>
              <span className="capitalize">{latest.source.replace(/_/g, ' ')}</span>
              {latest.accuracy != null ? <span>±{Math.round(latest.accuracy)} m</span> : null}
              {latest.speed != null ? <span>{(latest.speed * 3.6).toFixed(1)} km/h</span> : null}
              <span>{formatTrackingTime(latest.timestamp)}</span>
            </p>
          </div>
        ) : null}

        {summary ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="mod-inset rounded-xl p-2">
              <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                Distance
              </p>
              <p className="text-sm font-semibold">{formatTrackingDistance(summary.totalDistanceMeters)}</p>
            </div>
            <div className="mod-inset rounded-xl p-2">
              <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                Points
              </p>
              <p className="text-sm font-semibold">{summary.totalPoints}</p>
            </div>
            <div className="mod-inset rounded-xl p-2">
              <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                Duration
              </p>
              <p className="text-sm font-semibold">{formatTrackingDuration(summary.durationSeconds)}</p>
            </div>
          </div>
        ) : (
          <div className="relative z-30">
            <button
              type="button"
              onClick={() => void onRefreshSummary()}
              disabled={tracking.summaryLoading}
              className="touch-manipulation w-full rounded-full border border-primary/30 bg-primary/10 py-3 text-sm font-bold text-primary disabled:opacity-50"
            >
              {tracking.summaryLoading ? 'Loading summary…' : 'Load session summary'}
            </button>
            <p className="mt-2 text-center text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
              Tap above — not the red SOS button at the bottom of the screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
