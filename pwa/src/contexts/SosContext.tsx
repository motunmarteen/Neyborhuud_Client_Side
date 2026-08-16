'use client';

/**
 * App-wide SOS state — single socket + single activeSos record for BottomNav, /sos, Sentinel hub.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient, { shouldConnectSocket } from '@/lib/api-client';
import socketService from '@/lib/socket';
import { safetyService, type SosEvent } from '@/services/safety.service';
import type { IncidentSummary } from '@/types/api';
import { getGeolocation } from '@/lib/nativeGeolocation';
import { useSosOfflineQueue, type SosQueueStatus } from '@/hooks/useSosOfflineQueue';
import { newIdempotencyKey } from '@/lib/idempotency';
import { toast } from 'sonner';

export type SosPhase = 'idle' | 'pending' | 'active' | 'resolved' | 'cancelled';

export interface SosTriggerOptions {
  silent?: boolean;
  countdownSeconds?: number;
  emergencyServicesEnabled?: boolean;
  deviceInfo?: Record<string, unknown>;
}

export type SosNotifyMeta = {
  guardiansTotal: number;
  emergencyId: string | null;
  sosEventId: string;
};

export interface UseSosReturn {
  phase: SosPhase;
  activeSos: SosEvent | null;
  /** Set from POST /safety/sos/trigger — how many guardians the server queued to notify. */
  notifyMeta: SosNotifyMeta | null;
  secondsRemaining: number;
  lastSummary: IncidentSummary | null;
  loading: boolean;
  error: string | null;
  /**
   * 'queued' means the trigger couldn't reach the server (no signal) and is
   * saved locally, retrying automatically as soon as connectivity returns —
   * the UI should show this as "help is on the way once you're back online",
   * not as a failure.
   */
  offlineQueueStatus: SosQueueStatus;
  triggerSos: (opts?: SosTriggerOptions) => Promise<void>;
  cancelSos: (reason?: string) => Promise<void>;
  resolveSos: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const SosContext = createContext<UseSosReturn | null>(null);

const DEFAULT_COUNTDOWN = 5;

function useSosState(): UseSosReturn {
  const { user } = useAuth();
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [lastSummary, setLastSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyMeta, setNotifyMeta] = useState<SosNotifyMeta | null>(null);

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);

  // When a queued SOS trigger finally sends (connectivity restored), pull
  // the real server state so the UI reflects it instead of staying on
  // whatever locally-optimistic state was shown while offline.
  const { status: offlineQueueStatus, enqueue: enqueueOfflineSos } = useSosOfflineQueue(() => {
    void refreshRef.current();
  });

  const phase: SosPhase = useMemo(() => {
    if (!activeSos) return 'idle';
    if (activeSos.status === 'pending') return 'pending';
    if (activeSos.status === 'active' || activeSos.status === 'triggered') return 'active';
    if (activeSos.status === 'resolved') return 'resolved';
    return 'cancelled';
  }, [activeSos]);

  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = null;
    if (phase !== 'pending' || !activeSos?.pendingUntil) {
      setSecondsRemaining(0);
      return;
    }
    const target = new Date(activeSos.pendingUntil).getTime();
    const tick = () => setSecondsRemaining(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
    tick();
    tickerRef.current = setInterval(tick, 250);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [phase, activeSos?.pendingUntil]);

  const refresh = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    try {
      const res = await safetyService.getActiveSos();
      setActiveSos(res.data?.sosEvent ?? null);
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) {
      setActiveSos(null);
      setNotifyMeta(null);
      return;
    }
    void refresh();
  }, [user?.id, refresh]);

  useEffect(() => {
    if (!user?.id) return;

    const onPending = (payload: {
      sosEventId: string;
      countdownSeconds: number;
      pendingUntil: string;
      visibilityMode: 'normal' | 'silent';
    }) => {
      setActiveSos((prev) => {
        if (prev && prev._id === payload.sosEventId) {
          return {
            ...prev,
            status: 'pending',
            pendingUntil: payload.pendingUntil,
            countdownSeconds: payload.countdownSeconds,
          };
        }
        void refreshRef.current();
        return prev;
      });
    };

    const onActivated = (payload: { sosEventId: string }) => {
      setActiveSos((prev) =>
        prev && prev._id === payload.sosEventId
          ? { ...prev, status: 'active', pendingUntil: null }
          : prev,
      );
      void refreshRef.current();
    };

    const onCancelledPending = (payload: { sosEventId: string; reason: string }) => {
      setActiveSos((prev) =>
        prev && prev._id === payload.sosEventId
          ? { ...prev, status: 'cancelled', cancelledDuringPending: true, cancelReason: payload.reason }
          : prev,
      );
      setTimeout(() => {
        setActiveSos((prev) => (prev && prev._id === payload.sosEventId ? null : prev));
      }, 1500);
    };

    const onAlert = (payload: { sosEventId: string; escalationLevel: number }) => {
      setActiveSos((prev) =>
        prev && prev._id === payload.sosEventId
          ? { ...prev, escalationLevel: payload.escalationLevel }
          : prev,
      );
    };

    const onEmergencyDispatched = () => {
      void refreshRef.current();
    };

    const bind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.on('safety:sos_pending', onPending);
      socket.on('safety:sos_activated', onActivated);
      socket.on('safety:sos_cancelled_pending', onCancelledPending);
      socket.on('safety:sos_alert', onAlert);
      socket.on('safety:emergency_services_dispatched', onEmergencyDispatched);
    };

    const unbind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.off('safety:sos_pending', onPending);
      socket.off('safety:sos_activated', onActivated);
      socket.off('safety:sos_cancelled_pending', onCancelledPending);
      socket.off('safety:sos_alert', onAlert);
      socket.off('safety:emergency_services_dispatched', onEmergencyDispatched);
    };

    if (shouldConnectSocket() && apiClient.isAuthenticated()) {
      socketService.connect();
      socketService.authenticate(user.id);
    }

    bind();
    const socket = socketService.getSocket();
    const onConnect = () => bind();
    socket?.on('connect', onConnect);

    return () => {
      unbind();
      socket?.off('connect', onConnect);
    };
  }, [user?.id]);

  // ── Live location heartbeat during an active SOS ───────────────────────
  //
  // The server's whole emergency-tracking pipeline (encrypted
  // EmergencyTrackingLog forensic trail, sos:location_update fanout to
  // guardians, and the live location card in the incident chat) is driven by
  // this one socket event. Nothing else in the app emits it, so without this
  // effect a real SOS produces no live location at all.
  //
  // watchPosition rather than a setInterval+getCurrentPosition loop: the OS
  // decides when the fix is meaningfully new, which is both more accurate and
  // far cheaper on battery — and battery matters a lot mid-emergency. The
  // server throttles what it persists, so a chatty watch is fine.
  const heartbeatDeniedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'active' || !user?.id) return;

    const geo = getGeolocation();
    if (!geo) {
      toast.error('Location sharing unavailable on this device. Your guardians cannot see your position.');
      return;
    }

    let lastEmitAt = 0;
    // Floor between emitted pings. watchPosition can fire several times a
    // second; the server only persists one per 30s anyway.
    const MIN_EMIT_INTERVAL_MS = 5_000;

    const watchId = geo.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastEmitAt < MIN_EMIT_INTERVAL_MS) return;
        lastEmitAt = now;
        socketService.emit('location_heartbeat', {
          userId: user.id,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        // Only warn once per SOS — watchPosition can re-fire the same error
        // repeatedly and we must not spam a toast at someone in an emergency.
        if (heartbeatDeniedRef.current) return;
        heartbeatDeniedRef.current = true;
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked. Your guardians cannot see where you are — enable location to share it.'
            : 'Could not get your location. Your guardians cannot see where you are.',
        );
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 10_000 },
    );

    return () => {
      geo.clearWatch(watchId);
      heartbeatDeniedRef.current = false;
    };
  }, [phase, user?.id]);

  const getCoords = useCallback(
    () =>
      new Promise<GeolocationCoordinates>((resolve, reject) => {
        const geo = getGeolocation();
        if (!geo) {
          reject(new Error('Geolocation not supported on this device'));
          return;
        }
        geo.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(new Error(err.message || 'Unable to fetch location')),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
        );
      }),
    [],
  );

  const triggerSos = useCallback(
    async (opts: SosTriggerOptions = {}) => {
      setError(null);
      setLoading(true);
      try {
        // Try to get a real GPS fix, but a panic button must still work
        // with zero signal — fall back to the last coordinates the app
        // knows about rather than blocking the whole trigger on a
        // geolocation call that has nothing to talk to.
        const coords: { latitude: number; longitude: number; accuracy?: number } =
          await getCoords().catch(() => {
            const last = activeSos?.location;
            if (last) return { latitude: last.lat, longitude: last.lng };
            throw new Error('Unable to get your location. Move to an open area and try again.');
          });
        const clientId = newIdempotencyKey();
        const payload = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          visibilityMode: opts.silent ? ('silent' as const) : ('normal' as const),
          countdownSeconds: opts.silent ? 0 : (opts.countdownSeconds ?? DEFAULT_COUNTDOWN),
          emergencyServicesEnabled: opts.emergencyServicesEnabled,
          deviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            accuracy: coords.accuracy,
            triggeredAt: new Date().toISOString(),
            ...(opts.deviceInfo ?? {}),
          },
          clientId,
        };

        let res;
        try {
          res = await safetyService.triggerSos(payload);
        } catch (err: unknown) {
          const httpStatus = (err as { response?: { status?: number } })?.response?.status;
          // No response at all reached us — genuine no-signal/offline
          // failure, not the server rejecting the request. Queue it for
          // automatic retry instead of surfacing a dead-end error: the
          // person pressing this button may have no time to try again.
          if (httpStatus === undefined) {
            void enqueueOfflineSos(payload).catch((queueErr) => {
              console.error('[SosContext] Failed to queue offline SOS:', queueErr);
            });
            setActiveSos({
              _id: clientId,
              userId: user?.id ?? '',
              status: 'triggered',
              visibilityMode: payload.visibilityMode,
              escalationLevel: 0,
              countdownSeconds: 0,
              pendingUntil: null,
              emergencyServicesEnabled: payload.emergencyServicesEnabled,
              location: { lat: payload.latitude, lng: payload.longitude },
              createdAt: new Date().toISOString(),
            });
            setNotifyMeta(null);
            return;
          }
          throw err;
        }

        const data = res.data;
        if (!data) return;

        setNotifyMeta({
          guardiansTotal: data.guardiansTotal ?? 0,
          emergencyId: data.emergencyId ?? null,
          sosEventId: data.sosEventId,
        });

        if (data.status === 'pending') {
          setActiveSos({
            _id: data.sosEventId,
            userId: user?.id ?? '',
            status: 'pending',
            visibilityMode: data.visibilityMode,
            escalationLevel: 0,
            countdownSeconds: data.countdownSeconds,
            pendingUntil: data.pendingUntil ?? null,
            emergencyServicesEnabled: data.emergencyServicesEnabled,
            preSosContext: data.preSosContext ?? undefined,
            location: { lat: payload.latitude, lng: payload.longitude },
            createdAt: new Date().toISOString(),
          });
        } else {
          await refresh();
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to trigger SOS';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [getCoords, user, refresh, enqueueOfflineSos, activeSos],
  );

  const cancelSos = useCallback(
    async (reason?: string) => {
      if (!activeSos?._id) return;
      setError(null);
      try {
        const res = await safetyService.cancelSos(activeSos._id, reason);
        setActiveSos(res.data?.sosEvent ?? null);
        setTimeout(() => {
          setActiveSos((prev) => (prev?.status === 'cancelled' ? null : prev));
          setNotifyMeta(null);
        }, 1500);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to cancel SOS';
        setError(msg);
      }
    },
    [activeSos],
  );

  const resolveSos = useCallback(async () => {
    if (!activeSos?._id) return;
    setError(null);
    try {
      const res = await safetyService.resolveSos(activeSos._id);
      setActiveSos(res.data?.sosEvent ?? null);
      if (res.data?.summary) setLastSummary(res.data.summary);
      setTimeout(() => {
        setActiveSos((prev) => (prev?.status === 'resolved' ? null : prev));
        setNotifyMeta(null);
      }, 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to resolve SOS';
      setError(msg);
    }
  }, [activeSos]);

  const clearError = useCallback(() => setError(null), []);

  return {
    phase,
    activeSos,
    notifyMeta,
    secondsRemaining,
    lastSummary,
    loading,
    error,
    offlineQueueStatus,
    triggerSos,
    cancelSos,
    resolveSos,
    refresh,
    clearError,
  };
}

export function SosProvider({ children }: { children: ReactNode }) {
  const value = useSosState();
  return <SosContext.Provider value={value}>{children}</SosContext.Provider>;
}

export function useSosContext(): UseSosReturn {
  const ctx = useContext(SosContext);
  if (!ctx) {
    throw new Error('useSos must be used within SosProvider');
  }
  return ctx;
}
