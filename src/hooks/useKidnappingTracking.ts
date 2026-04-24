'use client';

/**
 * useKidnappingTracking
 *
 * Manages continuous GPS location tracking for an active kidnapping session.
 * Features:
 *  - Configurable ping interval (default: session.intervalSeconds or 30s)
 *  - GPS → network_estimate fallback when GPS unavailable / low accuracy
 *  - Offline queue: stores location updates in localStorage when offline
 *  - Sync on reconnection: flushes queued points when back online
 *  - Battery-aware: reduces frequency when battery ≤ 20%
 *  - Real-time WebSocket events: receives guardian alerts
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  kidnappingTrackingService,
  type KidnappingTrackingSession,
  type TrackingLocationPoint,
  type TrackingSummary,
  type LocationSource,
} from '@/services/safety.service';

// ─── Offline queue helpers ────────────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = 'neyborhuud_kidnapping_offline_queue';
// 72 hours: covers extended signal-blocked / confiscated-device scenarios.
// Points older than this cannot be meaningfully sequenced even if recovered.
const MAX_QUEUE_AGE_MS = 72 * 60 * 60 * 1000;

interface QueuedPoint {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  source: LocationSource;
  batteryLevel?: number;
  networkType?: string;
  /** ISO string — device capture time (authoritative ordering for offline sync) */
  capturedAt: string;
  /** Stable client-generated UUID — prevents duplicate DB rows on retry */
  clientId: string;
  queuedAt: number;
}

function readOfflineQueue(): QueuedPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed: QueuedPoint[] = JSON.parse(raw);
    const cutoff = Date.now() - MAX_QUEUE_AGE_MS;
    return parsed.filter((p) => p.queuedAt > cutoff);
  } catch {
    return [];
  }
}

// Max points kept when storage quota is exceeded. Newest points are preserved
// because they contain the most recent (most forensically relevant) position.
const MAX_QUEUE_POINTS = 500;

function writeOfflineQueue(queue: QueuedPoint[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage quota exceeded — preserve the newest MAX_QUEUE_POINTS entries.
    // Oldest points are sacrificed; newest position is always retained.
    const trimmed = queue.slice(-MAX_QUEUE_POINTS);
    const dropped = queue.length - trimmed.length;
    if (dropped > 0) {
      console.warn(
        `[KidnappingTracking] localStorage quota exceeded — dropped ${dropped} oldest queued points. ${trimmed.length} retained.`,
      );
    }
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
      // Absolute last resort: keep only the single newest point
      console.error('[KidnappingTracking] localStorage critically full — retaining only latest point.');
      try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-1))); } catch {}
    }
  }
}

function enqueueOffline(point: QueuedPoint): void {
  const queue = readOfflineQueue();
  queue.push(point);
  writeOfflineQueue(queue);
}

function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {}
}

// ─── UUID v4 helper (no external dep needed) ─────────────────────────────────

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Battery helper ───────────────────────────────────────────────────────────

async function getBatteryInfo(): Promise<{ level?: number; charging?: boolean }> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return { level: Math.round(battery.level * 100), charging: battery.charging };
    }
  } catch {}
  return {};
}

// ─── Network type helper ──────────────────────────────────────────────────────

function getNetworkType(): 'wifi' | 'mobile' | 'offline' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  if (!navigator.onLine) return 'offline';
  const conn = (navigator as any).connection;
  if (!conn) return 'unknown';
  const type: string = conn.effectiveType || conn.type || '';
  if (type === 'wifi' || type === '4g' || type.includes('broad')) return 'wifi';
  if (type === 'cellular' || type === '3g' || type === '2g' || type === 'slow-2g') return 'mobile';
  return 'unknown';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface KidnappingTrackingState {
  session: KidnappingTrackingSession | null;
  latestLocation: TrackingLocationPoint | null;
  summary: TrackingSummary | null;
  isTracking: boolean;
  isOnline: boolean;
  queuedCount: number;
  error: string | null;
}

export interface UseKidnappingTrackingReturn extends KidnappingTrackingState {
  startTracking: (opts?: {
    emergencyType?: 'kidnapping' | 'armed_robbery' | 'other_critical';
    emergencyId?: string;
    sosEventId?: string;
    intervalSeconds?: number;
  }) => Promise<void>;
  stopTracking: () => Promise<void>;
  flushOfflineQueue: () => Promise<void>;
  refreshSummary: () => Promise<void>;
}

export function useKidnappingTracking(
  externalSession?: KidnappingTrackingSession | null,
): UseKidnappingTrackingReturn {
  const [state, setState] = useState<KidnappingTrackingState>({
    session: externalSession ?? null,
    latestLocation: null,
    summary: null,
    isTracking: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queuedCount: readOfflineQueue().length,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<KidnappingTrackingSession | null>(externalSession ?? null);
  const isMountedRef = useRef(true);

  // Keep sessionRef in sync with state
  useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Online / offline detection + auto-flush pre-existing queue on mount
  useEffect(() => {
    // Flush any points queued from a previous session (e.g. app killed before sync)
    if (typeof navigator !== 'undefined' && navigator.onLine && readOfflineQueue().length > 0) {
      flushOfflineQueue();
    }

    function handleOnline() {
      setState((prev) => ({ ...prev, isOnline: true }));
      flushOfflineQueue();
    }
    function handleOffline() {
      setState((prev) => ({ ...prev, isOnline: false }));
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Flush queued offline points (batched) ───────────────────────────────
  // Sends points in chunks of BATCH_SIZE to avoid request spikes after reconnect.
  // Points that fail (server error, session expired) are kept for next flush.

  const BATCH_SIZE = 50;

  const flushOfflineQueue = useCallback(async () => {
    const queue = readOfflineQueue();
    if (queue.length === 0) return;

    const session = sessionRef.current;
    if (!session) return; // no active session to flush into

    const failed: QueuedPoint[] = [];

    // Process in chunks of BATCH_SIZE
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      const chunk = queue.slice(i, i + BATCH_SIZE);
      try {
        const res = await kidnappingTrackingService.batchLogLocations(
          session._id,
          chunk.map((p) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            accuracy: p.accuracy,
            speed: p.speed ?? undefined,
            heading: p.heading ?? undefined,
            source: p.source,
            capturedAt: p.capturedAt,
            clientId: p.clientId,
            deviceInfo: { batteryLevel: p.batteryLevel, networkType: p.networkType },
          })),
        );
        // Re-queue only points the server explicitly failed (not duplicates)
        if (res.data?.summary) {
          res.data.summary.forEach((s, idx) => {
            if (s.status === 'failed') failed.push(chunk[idx]);
          });
        }
      } catch {
        // Network-level failure — re-queue the entire chunk
        failed.push(...chunk);
      }
    }

    writeOfflineQueue(failed);
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, queuedCount: failed.length }));
    }
  }, []);

  // ─── Single location ping ─────────────────────────────────────────────────

  const pingLocation = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    const battery = await getBatteryInfo();
    const networkType = getNetworkType();

    // Stable per-ping identifiers — generated at capture time, before any network attempt
    const clientId = uuidv4();
    const capturedAt = new Date().toISOString();

    let latitude: number;
    let longitude: number;
    let accuracy: number | undefined;
    let speed: number | null | undefined;
    let heading: number | null | undefined;
    let source: LocationSource = 'gps';

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 5000,
        });
      });

      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      accuracy = pos.coords.accuracy ?? undefined;
      speed = pos.coords.speed;
      heading = pos.coords.heading;

      // If accuracy is poor (> 200m), mark as network-assisted
      if (accuracy && accuracy > 200) {
        source = 'network_estimate';
      }
    } catch {
      // GPS failed — use network triangulation fallback
      try {
        const triRes = await kidnappingTrackingService.triangulate();
        if (!triRes.data) throw new Error('No triangulation data');
        latitude = triRes.data.location.latitude;
        longitude = triRes.data.location.longitude;
        accuracy = triRes.data.location.accuracy;
        source = 'network_estimate';
      } catch {
        console.warn('[KidnappingTracking] All location methods failed, skipping ping');
        return;
      }
    }

    const payload = {
      latitude,
      longitude,
      accuracy,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
      source,
      capturedAt,
      clientId,
      deviceInfo: {
        batteryLevel: battery.level,
        networkType,
      },
    };

    if (!navigator.onLine) {
      // Store offline — clientId + capturedAt ensure correct ordering on sync
      enqueueOffline({
        sessionId: session._id,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        source,
        batteryLevel: battery.level,
        networkType,
        capturedAt,
        clientId,
        queuedAt: Date.now(),
      });
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, queuedCount: readOfflineQueue().length }));
      }
      return;
    }

    try {
      await kidnappingTrackingService.logLocation(session._id, payload);

      // Update local latest location state
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          latestLocation: {
            _id: '',
            location: { lat: latitude, lng: longitude },
            source,
            accuracy,
            speed: speed ?? undefined,
            heading: heading ?? undefined,
            battery: battery.level,
            networkType,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    } catch (err: any) {
      // On failure, queue offline
      enqueueOffline({
        sessionId: session._id,
        ...payload,
        source,
        batteryLevel: battery.level,
        networkType,
        queuedAt: Date.now(),
      });
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          queuedCount: readOfflineQueue().length,
          error: err?.message || 'Location upload failed, queued offline',
        }));
      }
    }
  }, []);

  // ─── Start interval (battery-adaptive) ───────────────────────────────────

  const startInterval = useCallback(
    async (session: KidnappingTrackingSession) => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Battery-aware: double the interval when battery ≤ 20%, triple at ≤ 10%
      const battery = await getBatteryInfo();
      const baseMs = (session.intervalSeconds || 30) * 1000;
      let intervalMs = baseMs;
      if (battery.level !== undefined && battery.level <= 10 && !battery.charging) {
        intervalMs = baseMs * 3;
      } else if (battery.level !== undefined && battery.level <= 20 && !battery.charging) {
        intervalMs = baseMs * 2;
      }

      intervalRef.current = setInterval(() => {
        pingLocation();
      }, intervalMs);

      // Immediate first ping
      pingLocation();
    },
    [pingLocation],
  );

  // ─── Start tracking ───────────────────────────────────────────────────────

  const startTracking = useCallback(
    async (opts: {
      emergencyType?: 'kidnapping' | 'armed_robbery' | 'other_critical';
      emergencyId?: string;
      sosEventId?: string;
      intervalSeconds?: number;
    } = {}) => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        // Check for existing active session
        let session: KidnappingTrackingSession | null = null;
        try {
          const res = await kidnappingTrackingService.getActiveSession();
          session = res.data?.session ?? null;
        } catch {}

        if (!session) {
          // Get current GPS position for start location
          let startLat: number | undefined;
          let startLng: number | undefined;
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 8000,
              });
            });
            startLat = pos.coords.latitude;
            startLng = pos.coords.longitude;
          } catch {}

          const battery = await getBatteryInfo();
          const networkType = getNetworkType();

          const startRes = await kidnappingTrackingService.startSession({
            emergencyType: opts.emergencyType || 'kidnapping',
            emergencyId: opts.emergencyId,
            sosEventId: opts.sosEventId,
            latitude: startLat,
            longitude: startLng,
            intervalSeconds: opts.intervalSeconds,
            deviceInfo: {
              batteryLevel: battery.level,
              networkType,
            },
          });
          if (!startRes.data) throw new Error('Failed to start session');
          session = startRes.data.session;
        }

        sessionRef.current = session;
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            session,
            isTracking: true,
          }));
        }

        startInterval(session);
      } catch (err: any) {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            error: err?.message || 'Failed to start tracking',
          }));
        }
      }
    },
    [startInterval],
  );

  // ─── Stop tracking ────────────────────────────────────────────────────────

  const stopTracking = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const session = sessionRef.current;
    if (session) {
      try {
        await kidnappingTrackingService.stopSession(session._id);
      } catch {}
    }

    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, isTracking: false, session: null }));
    }
  }, []);

  // ─── Refresh summary ──────────────────────────────────────────────────────

  const refreshSummary = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      const summaryRes = await kidnappingTrackingService.getTrackingSummary(session._id);
      if (isMountedRef.current && summaryRes.data) {
        setState((prev) => ({ ...prev, summary: summaryRes.data!.summary }));
      }
    } catch {}
  }, []);

  // Auto-resume if externalSession is provided and active
  useEffect(() => {
    if (externalSession && externalSession.status === 'active' && !state.isTracking) {
      sessionRef.current = externalSession;
      setState((prev) => ({ ...prev, session: externalSession, isTracking: true }));
      startInterval(externalSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSession]);

  return {
    ...state,
    startTracking,
    stopTracking,
    flushOfflineQueue,
    refreshSummary,
  };
}
