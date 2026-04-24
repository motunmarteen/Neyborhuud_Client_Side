'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { tripService, type Trip } from '@/services/trip.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function escalationColor(level: number): string {
  if (level === 0) return '#22c55e';
  if (level === 1) return '#eab308';
  if (level === 2) return '#f97316';
  return '#ef4444';
}

function minsAgo(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

// ─── component ────────────────────────────────────────────────────────────────

interface GuardianTripViewProps {
  /** The userId of the person being monitored (the trip owner) */
  userId: string;
  /** Display name for context (optional) */
  displayName?: string;
}

function GuardianTripViewInner({ userId, displayName }: GuardianTripViewProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripService.getTripGuardianView(userId);
      setTrip(res.data?.trip ?? null);
      setLastRefresh(new Date());
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("You are not an accepted guardian of this user.");
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load trip data');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    // Auto-refresh every 60 s when trip is active
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !trip) {
    return (
      <div className="neu-card-sm rounded-2xl p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading trip data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neu-card-sm rounded-2xl p-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="neu-card-sm rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">🟢</p>
        <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>
          {displayName ?? 'This user'} has no active trip right now
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
          You will receive a notification when they start a safe trip.
        </p>
        {lastRefresh && (
          <p className="text-[10px] mt-3" style={{ color: 'var(--neu-text-muted)' }}>
            Updated {minsAgo(lastRefresh.toISOString())}
            {' · '}
            <button onClick={load} className="underline">Refresh</button>
          </p>
        )}
      </div>
    );
  }

  const isPaused = !!trip.pausedAt;
  const isEscalated = trip.escalationLevel > 0;
  const sosAutoTriggered = !!(trip as any).linkedSosEventId;

  return (
    <div className="flex flex-col gap-3">
      {/* Auto-SOS triggered banner — shown prominently to guardian */}
      {sosAutoTriggered && (
        <div
          className="rounded-2xl p-4 border-2 flex flex-col gap-2"
          style={{ background: '#fef2f2', borderColor: '#dc2626' }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600" style={{ fontSize: '20px' }}>emergency</span>
            <p className="font-bold text-sm text-red-600">🆘 SOS Activated — Requires Immediate Response</p>
          </div>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            <strong>Triggered automatically due to missed trip check-ins.</strong>{' '}
            {displayName ?? 'This user'} has not responded to{' '}
            {trip.missedCheckIns ?? 'multiple'} check-in alert
            {(trip.missedCheckIns ?? 0) !== 1 ? 's' : ''}.
            Their last known location and trip details have been shared with all guardians.
          </p>
          <p className="text-[11px] font-semibold" style={{ color: '#dc2626' }}>
            Please contact {displayName ?? 'them'} immediately or dispatch help.
          </p>
        </div>
      )}

      {/* Status header */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: isEscalated && trip.escalationLevel >= 3
            ? '#fef2f2'
            : isEscalated
            ? '#fffbeb'
            : 'var(--neu-bg)',
          border: isEscalated ? `1px solid ${escalationColor(trip.escalationLevel)}` : 'none',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>
              {displayName ?? 'Protégé'} is on a trip
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              {trip.originText} → {trip.destinationText}
            </p>
          </div>
          <span
            className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              background: escalationColor(trip.escalationLevel) + '22',
              color: escalationColor(trip.escalationLevel),
            }}
          >
            {trip.status}
          </span>
        </div>

        {isEscalated && !sosAutoTriggered && (
          <div className="mt-2 rounded-xl p-2" style={{ background: escalationColor(trip.escalationLevel) + '20' }}>
            <p className="text-xs font-semibold" style={{ color: escalationColor(trip.escalationLevel) }}>
              {`⚠️ Escalation Level ${trip.escalationLevel} — ${trip.missedCheckIns} missed check-in${trip.missedCheckIns !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Progress</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>{trip.progressPercent ?? 0}%</p>
          <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${trip.progressPercent ?? 0}%`, background: 'var(--primary)' }}
            />
          </div>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>ETA</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
            {trip.estimatedArrival ? fmt(trip.estimatedArrival) : fmt(trip.expectedArrival)}
          </p>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Last Check-in</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>{minsAgo(trip.lastCheckIn)}</p>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Deviation</p>
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: (trip.routeDeviationMeters ?? 0) > 300 ? '#f59e0b' : 'var(--neu-text)' }}
          >
            {trip.routeDeviationMeters ? `${trip.routeDeviationMeters.toFixed(0)} m` : '—'}
          </p>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Missed Check-ins</p>
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: (trip.missedCheckIns ?? 0) > 0 ? '#f59e0b' : 'var(--neu-text)' }}
          >
            {trip.missedCheckIns ?? 0}
          </p>
        </div>
        {isPaused && (
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Paused since</p>
            <p className="text-xs font-semibold mt-0.5 text-amber-600">{minsAgo(trip.pausedAt)}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {trip.notes && (
        <div className="neu-socket rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Trip notes</p>
          <p className="text-xs mt-1" style={{ color: 'var(--neu-text)' }}>{trip.notes}</p>
        </div>
      )}

      {/* Refresh row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
          Auto-refreshes every 60 s · last updated {lastRefresh ? minsAgo(lastRefresh.toISOString()) : '—'}
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl neu-btn text-xs"
          style={{ color: 'var(--primary)' }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

// ─── Standalone page (/safety/trips/watch/[userId]) ───────────────────────────

function GuardianTripViewPageInner({ userId }: { userId: string }) {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pb-24">
            <div
              className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ backgroundImage: "url('/doodle-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
            >
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Guardian Trip View</h1>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                  Live monitoring of a protégé&apos;s active trip.
                </p>
              </div>
              <Link
                href="/safety"
                className="px-3 py-2 rounded-xl neu-btn text-xs font-medium"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                ← Safety
              </Link>
            </div>

            <GuardianTripViewInner userId={userId} />
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}

export default async function GuardianTripViewPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return (
    <Suspense>
      <GuardianTripViewPageInner userId={userId} />
    </Suspense>
  );
}
