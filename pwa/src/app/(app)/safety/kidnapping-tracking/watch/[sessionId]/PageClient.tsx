'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SentinelHowItWorks } from '@/components/sentinel/SentinelHowItWorks';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';
import {
  kidnappingTrackingService,
  type KidnappingTrackingSession,
  type TrackingLocationPoint,
} from '@/services/safety.service';
import {
  emergencyTypeLabel,
  formatTrackingDistance,
  formatTrackingDuration,
  isSessionLive,
} from '@/lib/liveTrackingFormat';
import socketService from '@/lib/socket';

// ─── helpers ──────────────────────────────────────────────────────────────────

function minsAgo(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function statusColor(status: KidnappingTrackingSession['status']): string {
  if (status === 'active') return '#FF0000';
  if (status === 'lost_signal') return '#f97316';
  if (status === 'ended') return '#6b7280';
  return '#eab308';
}

// ─── component ────────────────────────────────────────────────────────────────

function GuardianTrackingViewInner({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<KidnappingTrackingSession | null>(null);
  const [latest, setLatest] = useState<TrackingLocationPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionRes, latestRes] = await Promise.all([
        kidnappingTrackingService.getSession(sessionId),
        kidnappingTrackingService.getLatestLocation(sessionId).catch(() => null),
      ]);
      setSession(sessionRes.data?.session ?? null);
      setLatest(latestRes?.data?.location ?? null);
      setLastRefresh(new Date());
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('You are not an accepted guardian of this user.');
      } else if (err?.response?.status === 404) {
        setError('This tracking session was not found.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load tracking data');
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
    // Fallback poll for guardians whose socket isn't connected — the live
    // event listener below is the primary update path when it is.
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Live updates: a tracked session pushes a new point far more often than a
  // 30s poll would catch, and the whole point of this screen is to follow
  // someone in a high-risk moment in as close to real time as possible.
  useEffect(() => {
    const onLocationUpdate = (payload: { sessionId: string; location: TrackingLocationPoint['location']; timestamp: string }) => {
      if (payload.sessionId !== sessionId) return;
      setLatest((prev) => ({
        _id: `${payload.timestamp}`,
        location: payload.location,
        source: prev?.source ?? 'gps',
        timestamp: payload.timestamp,
      }));
    };
    const onSignalLost = (payload: { sessionId: string }) => {
      if (payload.sessionId !== sessionId) return;
      setSession((prev) => (prev ? { ...prev, status: 'lost_signal' } : prev));
    };

    const bind = () => {
      const socket = socketService.getSocket();
      socket?.on('kidnapping:location_update', onLocationUpdate);
      socket?.on('kidnapping:signal_lost', onSignalLost);
    };
    const unbind = () => {
      const socket = socketService.getSocket();
      socket?.off('kidnapping:location_update', onLocationUpdate);
      socket?.off('kidnapping:signal_lost', onSignalLost);
    };

    bind();
    const t = setTimeout(bind, 1000);
    return () => {
      unbind();
      clearTimeout(t);
    };
  }, [sessionId]);

  if (loading && !session) {
    return (
      <div className="neu-card-sm rounded-2xl p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading tracking session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neu-card-sm rounded-2xl p-4">
        <p className="text-sm text-brand-red">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="neu-card-sm rounded-2xl p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Session not found.</p>
      </div>
    );
  }

  const live = isSessionLive(session);
  const color = statusColor(session.status);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-2xl p-4 border-2"
        style={{
          background: live ? '#fef2f2' : 'var(--neu-bg)',
          borderColor: color,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm capitalize" style={{ color: 'var(--neu-text)' }}>
              {emergencyTypeLabel(session.emergencyType)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              Session …{session._id.slice(-8)}
            </p>
          </div>
          <span
            className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: color + '22', color }}
          >
            {session.status.replace('_', ' ')}
          </span>
        </div>

        {session.status === 'lost_signal' && (
          <div className="mt-2 rounded-xl p-2" style={{ background: '#f9731622' }}>
            <p className="text-xs font-semibold" style={{ color: '#f97316' }}>
              No location update in a while — last seen {minsAgo(session.lastPingAt)}.
            </p>
          </div>
        )}
      </div>

      {latest && (
        <div className="neu-socket rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
            Last known location
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--neu-text)' }}>
            {latest.location.address || `${latest.location.lat.toFixed(5)}, ${latest.location.lng.toFixed(5)}`}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            Updated {minsAgo(latest.timestamp)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Distance covered</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
            {formatTrackingDistance(session.summary.totalDistanceMeters)}
          </p>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Points logged</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
            {session.summary.totalPoints}
          </p>
        </div>
        <div className="neu-socket rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Missed pings</p>
          <p
            className="text-sm font-semibold mt-0.5"
            style={{ color: session.missedPings > 0 ? '#f97316' : 'var(--neu-text)' }}
          >
            {session.missedPings}
          </p>
        </div>
        {session.summary.stationarySeconds > 0 && (
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Stationary for</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
              {formatTrackingDuration(session.summary.stationarySeconds)}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
          {live ? 'Live — updates as they arrive' : 'Session ended'} · last checked {lastRefresh ? minsAgo(lastRefresh.toISOString()) : '—'}
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl mod-chip text-xs"
          style={{ color: 'var(--primary)' }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

// ─── Standalone page (/safety/kidnapping-tracking/watch/[sessionId]) ─────────

function GuardianTrackingViewPageInner({ sessionId }: { sessionId: string }) {
  return (
    <SentinelSubpageLayout
      pageTitle="Live tracking — guardian view"
      pageSubtitle="Follow someone you protect in real time during a high-risk moment."
      icon="my_location"
      iconAccent="red"
      backFallback={{ href: '/safety/kidnapping-tracking', label: 'Live tracking' }}
    >
      <SentinelHowItWorks>
        This updates as new location pings arrive from their device. If the status changes to
        &quot;lost signal,&quot; reach out to them directly and consider contacting emergency
        services.
      </SentinelHowItWorks>
      <GuardianTrackingViewInner sessionId={sessionId} />
    </SentinelSubpageLayout>
  );
}

export default function GuardianTrackingViewPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? '';
  return (
    <Suspense>
      <GuardianTrackingViewPageInner sessionId={sessionId} />
    </Suspense>
  );
}
