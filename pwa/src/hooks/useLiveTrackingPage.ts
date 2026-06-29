'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import socketService from '@/lib/socket';
import apiClient, { shouldConnectSocket } from '@/lib/api-client';
import {
  extractLocationPoints,
  extractTrackingSession,
  normalizeTrackingPoint,
} from '@/lib/liveTrackingApi';
import { extractApiError } from '@/lib/safetyLocation';
import { useAuth } from '@/hooks/useAuth';
import { useKidnappingTracking } from '@/hooks/useKidnappingTracking';
import {
  kidnappingTrackingService,
  type KidnappingTrackingSession,
  type TrackingLocationPoint,
} from '@/services/safety.service';

type LocationUpdatePayload = {
  sessionId: string;
  location: { lat: number; lng: number; address?: string };
  source: string;
  accuracy?: number;
  speed?: number;
  timestamp: string;
};

type TrackingStartedPayload = {
  sessionId: string;
  userId: string;
  emergencyType: string;
  timestamp: string;
};

type SignalLostPayload = {
  sessionId: string;
  userId: string;
  missedPings: number;
  lastPingAt?: string;
};

export function useLiveTrackingPage() {
  const { user } = useAuth();
  const [initialSession, setInitialSession] = useState<KidnappingTrackingSession | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [locationHistory, setLocationHistory] = useState<TrackingLocationPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [wsAlert, setWsAlert] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const tracking = useKidnappingTracking(initialSession);
  const refreshSummaryRef = useRef(tracking.refreshSummary);
  refreshSummaryRef.current = tracking.refreshSummary;

  const session = tracking.session;
  const sessionId = session?._id;

  const mergeTrailPoints = useCallback((incoming: TrackingLocationPoint[]) => {
    const map = new Map<string, TrackingLocationPoint>();
    for (const raw of incoming) {
      const p = normalizeTrackingPoint(raw);
      if (!p) continue;
      map.set(`${p.timestamp}-${p.location.lat}-${p.location.lng}`, p);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, []);

  const loadHistory = useCallback(
    async (id: string) => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const hist = await kidnappingTrackingService.getLocationHistory(id, { limit: 80 });
        let points = extractLocationPoints(hist);

        if (points.length === 0) {
          const latestRes = await kidnappingTrackingService.getLatestLocation(id);
          const latest = extractLocationPoints(latestRes);
          if (latest.length > 0) {
            points = latest;
          } else {
            const locPayload = (latestRes as { data?: { location?: unknown } })?.data?.location;
            const one = normalizeTrackingPoint(locPayload);
            if (one) points = [one];
          }
        }

        setLocationHistory(mergeTrailPoints(points));

        if (points.length === 0) {
          const msg =
            (typeof hist.message === 'string' && hist.message) ||
            'No trail points on server yet — wait for the next ping or stay on Live tab.';
          if (!hist.success) {
            setHistoryError(msg);
          }
        }
      } catch (err: unknown) {
        setLocationHistory([]);
        setHistoryError(extractApiError(err, 'Failed to load location trail'));
      } finally {
        setHistoryLoading(false);
      }
    },
    [mergeTrailPoints],
  );

  const refreshActiveSession = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await kidnappingTrackingService.getActiveSession();
      const active = extractTrackingSession(res);
      setInitialSession(active);
      if (active?._id) {
        await loadHistory(active._id);
        void refreshSummaryRef.current();
      } else {
        setLocationHistory([]);
      }
    } catch {
      setInitialSession(null);
      setLocationHistory([]);
    } finally {
      setPageLoading(false);
    }
  }, [loadHistory]);

  useEffect(() => {
    void refreshActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionId) {
      void loadHistory(sessionId);
    }
  }, [sessionId, loadHistory]);

  useEffect(() => {
    if (tracking.latestLocation) {
      setLocationHistory((prev) =>
        mergeTrailPoints([tracking.latestLocation!, ...prev]),
      );
    }
  }, [tracking.latestLocation, mergeTrailPoints]);

  useEffect(() => {
    if (!user?.id) return;

    if (shouldConnectSocket() && apiClient.isAuthenticated()) {
      socketService.connect();
      socketService.authenticate(user.id);
    }

    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);

    const onLocationUpdate = (payload: LocationUpdatePayload) => {
      const point = normalizeTrackingPoint({
        location: payload.location,
        source: payload.source,
        accuracy: payload.accuracy,
        speed: payload.speed,
        timestamp: payload.timestamp,
      });
      if (!point) return;
      setLocationHistory((prev) => mergeTrailPoints([point, ...prev]));
    };

    const onStarted = (payload: TrackingStartedPayload) => {
      setWsAlert(`Tracking started (${payload.emergencyType.replace(/_/g, ' ')})`);
      setTimeout(() => setWsAlert(null), 8000);
    };

    const onSignalLost = (payload: SignalLostPayload) => {
      setWsAlert(
        `Signal lost — ${payload.missedPings} missed ping${payload.missedPings === 1 ? '' : 's'}`,
      );
    };

    const socket = socketService.getSocket();
    socket?.on('connect', onConnect);
    socket?.on('disconnect', onDisconnect);
    if (socket?.connected) setWsConnected(true);

    socketService.on('kidnapping:location_update', onLocationUpdate);
    socketService.on('kidnapping:tracking_started', onStarted);
    socketService.on('kidnapping:signal_lost', onSignalLost);

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socketService.off('kidnapping:location_update', onLocationUpdate);
      socketService.off('kidnapping:tracking_started', onStarted);
      socketService.off('kidnapping:signal_lost', onSignalLost);
    };
  }, [user?.id, mergeTrailPoints]);

  const handleStop = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const result = await tracking.stopTracking();
    if (!result.ok) {
      return result;
    }
    setInitialSession(null);
    setLocationHistory([]);
    await refreshActiveSession();
    return { ok: true };
  }, [tracking, refreshActiveSession]);

  return {
    user,
    pageLoading,
    session,
    locationHistory,
    historyLoading,
    historyError,
    wsAlert,
    setWsAlert,
    wsConnected,
    tracking,
    refreshActiveSession,
    loadHistory,
    handleStop,
  };
}
