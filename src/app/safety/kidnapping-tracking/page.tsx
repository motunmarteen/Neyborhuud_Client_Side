'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useKidnappingTracking } from '@/hooks/useKidnappingTracking';
import {
  kidnappingTrackingService,
  type KidnappingTrackingSession,
  type TrackingLocationPoint,
  type KidnappingEmergencyType,
} from '@/services/safety.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiBase =
    envUrl && envUrl !== 'undefined'
      ? envUrl
      : 'https://neyborhuud-serverside.onrender.com/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: KidnappingTrackingSession['status']): string {
  switch (status) {
    case 'active':
      return 'bg-red-900/60 text-red-300 border border-red-600';
    case 'lost_signal':
      return 'bg-orange-900/60 text-orange-300 border border-orange-600';
    case 'ended':
      return 'bg-gray-700 text-gray-400 border border-gray-600';
    default:
      return 'bg-gray-700 text-gray-400 border border-gray-600';
  }
}

// ─── WS event payload types ───────────────────────────────────────────────────

interface TrackingLocationUpdatePayload {
  sessionId: string;
  location: { lat: number; lng: number; address?: string };
  source: string;
  accuracy?: number;
  speed?: number;
  timestamp: string;
}

interface TrackingStartedPayload {
  sessionId: string;
  userId: string;
  emergencyType: string;
  timestamp: string;
}

interface TrackingSignalLostPayload {
  sessionId: string;
  userId: string;
  missedPings: number;
  lastPingAt?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KidnappingTrackingPage() {
  const { user } = useAuth();

  // ── Controlled active session (loaded on mount) ──
  const [loadedSession, setLoadedSession] = useState<KidnappingTrackingSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [locationHistory, setLocationHistory] = useState<TrackingLocationPoint[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [wsAlert, setWsAlert] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [emergencyType, setEmergencyType] = useState<KidnappingEmergencyType>('kidnapping');
  const [intervalSeconds, setIntervalSeconds] = useState(30);

  const socketRef = useRef<Socket | null>(null);

  // ── Tracking hook ──
  const tracking = useKidnappingTracking(loadedSession);

  // ── Load active session on mount ──
  useEffect(() => {
    (async () => {
      try {
        const res = await kidnappingTrackingService.getActiveSession();
        const activeSession = res.data?.session ?? null;
        setLoadedSession(activeSession);
        if (activeSession) {
          // Also fetch latest history
          const hist = await kidnappingTrackingService.getLocationHistory(activeSession._id, {
            limit: 50,
          });
          setLocationHistory(hist.data?.points ?? []);
        }
      } catch {
        setLoadedSession(null);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  // ── Socket.io: real-time guardian events ──
  useEffect(() => {
    if (!user) return;

    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;
    setWsStatus('connecting');

    socket.on('connect', () => {
      setWsStatus('connected');
      socket.emit('authenticate', { userId: user.id });
    });

    socket.on('disconnect', () => setWsStatus('disconnected'));

    socket.on('kidnapping:location_update', (payload: TrackingLocationUpdatePayload) => {
      // Guardian view: someone being tracked just sent a location update
      setLocationHistory((prev) => [
        {
          _id: '',
          location: payload.location,
          source: payload.source as any,
          accuracy: payload.accuracy,
          speed: payload.speed,
          timestamp: payload.timestamp,
        },
        ...prev.slice(0, 99),
      ]);
    });

    socket.on('kidnapping:tracking_started', (payload: TrackingStartedPayload) => {
      setWsAlert(
        `Tracking started for session ${payload.sessionId.slice(-6)} (${payload.emergencyType})`,
      );
      setTimeout(() => setWsAlert(null), 8000);
    });

    socket.on('kidnapping:signal_lost', (payload: TrackingSignalLostPayload) => {
      setWsAlert(
        `⚠️ Signal lost! ${payload.missedPings} missed pings. Last seen: ${
          payload.lastPingAt ? formatTimestamp(payload.lastPingAt) : 'unknown'
        }`,
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // ── Sync locationHistory when hook receives a new latestLocation ──
  useEffect(() => {
    if (tracking.latestLocation) {
      setLocationHistory((prev) => {
        if (prev[0]?.timestamp === tracking.latestLocation!.timestamp) return prev;
        return [tracking.latestLocation!, ...prev.slice(0, 99)];
      });
    }
  }, [tracking.latestLocation]);

  // ── Start tracking handler ──
  const handleStart = useCallback(async () => {
    setStartError(null);
    try {
      await tracking.startTracking({ emergencyType, intervalSeconds });
      // Refresh history
      const sess = tracking.session;
      if (sess) {
        try {
          const hist = await kidnappingTrackingService.getLocationHistory(sess._id, { limit: 50 });
          setLocationHistory(hist.data?.points ?? []);
        } catch {}
      }
    } catch (err: any) {
      setStartError(err?.message || 'Failed to start tracking');
    }
  }, [tracking, emergencyType, intervalSeconds]);

  // ── Stop tracking handler ──
  const handleStop = useCallback(async () => {
    await tracking.stopTracking();
    setLocationHistory([]);
    setLoadedSession(null);
  }, [tracking]);

  // ── Refresh summary ──
  const handleRefreshSummary = useCallback(() => {
    tracking.refreshSummary();
  }, [tracking]);

  const activeSession = tracking.session;
  const summary = tracking.summary;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="flex max-w-7xl mx-auto">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 border-x border-gray-800 px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/safety"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Safety
              </Link>
              <h1 className="text-xl font-bold text-red-400">🚨 Kidnapping Tracker</h1>
            </div>

            {/* WS Status */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                wsStatus === 'connected'
                  ? 'bg-green-900/40 text-green-400 border-green-700'
                  : wsStatus === 'connecting'
                  ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700'
                  : 'bg-gray-800 text-gray-500 border-gray-700'
              }`}
            >
              {wsStatus === 'connected' ? '● Live' : wsStatus === 'connecting' ? '◐ Connecting…' : '○ Offline'}
            </span>
          </div>

          {/* WS alert banner */}
          {wsAlert && (
            <div className="bg-orange-900/40 border border-orange-600 rounded-lg px-4 py-3 text-orange-300 text-sm flex items-start justify-between gap-2">
              <span>{wsAlert}</span>
              <button
                onClick={() => setWsAlert(null)}
                className="text-orange-400 hover:text-orange-200 shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {loadingSession ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Loading session…
            </div>
          ) : (
            <>
              {/* ── Session Status Card ── */}
              {activeSession ? (
                <div className="bg-gray-900 border border-red-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(activeSession.status)}`}>
                        {activeSession.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        Session <span className="font-mono text-gray-300">{activeSession._id.slice(-8)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Online / queue indicator */}
                      {!tracking.isOnline && (
                        <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-700 px-2 py-0.5 rounded-full">
                          Offline · {tracking.queuedCount} queued
                        </span>
                      )}
                      {tracking.isOnline && tracking.queuedCount > 0 && (
                        <button
                          onClick={() => tracking.flushOfflineQueue()}
                          className="text-xs bg-blue-900/40 text-blue-400 border border-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-900/60"
                        >
                          Sync {tracking.queuedCount} queued
                        </button>
                      )}
                      <button
                        onClick={handleStop}
                        className="text-sm bg-red-900/50 hover:bg-red-900/80 text-red-300 border border-red-700 px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Stop Tracking
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-500 mb-0.5">Type</div>
                      <div className="text-white capitalize">{activeSession.emergencyType.replace('_', ' ')}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-500 mb-0.5">Interval</div>
                      <div className="text-white">{activeSession.intervalSeconds}s</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-500 mb-0.5">Activated by</div>
                      <div className="text-white capitalize">{activeSession.activatedBy}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-500 mb-0.5">Missed pings</div>
                      <div className={activeSession.missedPings > 0 ? 'text-orange-400' : 'text-white'}>
                        {activeSession.missedPings}
                      </div>
                    </div>
                  </div>

                  {/* Authority notification */}
                  <div
                    className={`text-xs px-3 py-2 rounded-lg ${
                      activeSession.authorityNotified
                        ? 'bg-green-900/30 border border-green-700 text-green-400'
                        : 'bg-gray-800 border border-gray-700 text-gray-400'
                    }`}
                  >
                    {activeSession.authorityNotified ? (
                      <>
                        ✅ Authorities notified
                        {activeSession.authorityNotifiedAt &&
                          ` at ${formatTimestamp(activeSession.authorityNotifiedAt)}`}
                        {activeSession.assignedAgencies.length > 0 &&
                          ` — ${activeSession.assignedAgencies.join(', ')}`}
                      </>
                    ) : (
                      '⏳ Awaiting authority notification…'
                    )}
                  </div>

                  {/* Latest location */}
                  {tracking.latestLocation && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
                      <div className="text-gray-400 mb-1">Latest location</div>
                      <div className="text-white font-mono">
                        {tracking.latestLocation.location.lat.toFixed(6)},{' '}
                        {tracking.latestLocation.location.lng.toFixed(6)}
                      </div>
                      <div className="flex gap-4 mt-1 text-gray-500">
                        <span>Source: {tracking.latestLocation.source}</span>
                        {tracking.latestLocation.accuracy && (
                          <span>±{Math.round(tracking.latestLocation.accuracy)}m</span>
                        )}
                        {tracking.latestLocation.speed != null && (
                          <span>{(tracking.latestLocation.speed * 3.6).toFixed(1)} km/h</span>
                        )}
                        <span>{formatTimestamp(tracking.latestLocation.timestamp)}</span>
                      </div>
                    </div>
                  )}

                  {/* Summary card */}
                  {summary ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Distance</div>
                        <div className="text-white">{formatDistance(summary.totalDistanceMeters)}</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Points</div>
                        <div className="text-white">{summary.totalPoints}</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Duration</div>
                        <div className="text-white">{formatDuration(summary.durationSeconds)}</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Avg speed</div>
                        <div className="text-white">{summary.avgSpeedKmh.toFixed(1)} km/h</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Max speed</div>
                        <div className="text-white">{summary.maxSpeedKmh.toFixed(1)} km/h</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-gray-500 mb-0.5">Stationary</div>
                        <div className="text-white">{formatDuration(summary.stationarySeconds)}</div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRefreshSummary}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Load summary
                    </button>
                  )}
                </div>
              ) : (
                /* ── Start Tracking Panel ── */
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-red-400">Start Emergency Tracking</h2>
                  <p className="text-sm text-gray-400">
                    This will begin continuous location tracking, notify your guardians, and alert
                    the appropriate Nigerian security agencies (DSS / NPF).
                  </p>

                  {startError && (
                    <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm">
                      {startError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm text-gray-300">
                      Emergency type
                      <select
                        value={emergencyType}
                        onChange={(e) => setEmergencyType(e.target.value as KidnappingEmergencyType)}
                        className="mt-1 block w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="kidnapping">🚨 Kidnapping</option>
                        <option value="armed_robbery">🔫 Armed Robbery</option>
                        <option value="other_critical">⚠️ Other Critical</option>
                      </select>
                    </label>

                    <label className="block text-sm text-gray-300">
                      Ping interval (seconds)
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                        className="mt-1 block w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      />
                      <span className="text-gray-500 text-xs">Lower = more precise, higher battery use</span>
                    </label>
                  </div>

                  <button
                    onClick={handleStart}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    🚨 Start Tracking
                  </button>
                </div>
              )}

              {/* ── Location History ── */}
              {locationHistory.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-300">
                      Location Trail ({locationHistory.length})
                    </h2>
                  </div>
                  <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                    {locationHistory.map((point, idx) => (
                      <div
                        key={point._id || idx}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-start justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-mono text-gray-300">
                            {point.location.lat.toFixed(6)}, {point.location.lng.toFixed(6)}
                          </span>
                          {point.location.address && (
                            <span className="text-gray-500 ml-2 truncate max-w-[180px]">
                              {point.location.address}
                            </span>
                          )}
                          <div className="flex gap-3 mt-0.5 text-gray-500">
                            <span className="capitalize">{point.source.replace('_', ' ')}</span>
                            {point.accuracy && <span>±{Math.round(point.accuracy)}m</span>}
                            {point.speed != null && (
                              <span>{(point.speed * 3.6).toFixed(1)} km/h</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-600 shrink-0">{formatTimestamp(point.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {tracking.error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                  ⚠️ {tracking.error}
                </div>
              )}
            </>
          )}
        </main>

        <RightSidebar />
      </div>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
