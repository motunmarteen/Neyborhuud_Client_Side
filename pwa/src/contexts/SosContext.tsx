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

  refreshRef.current = refresh;

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
        const coords = await getCoords();
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
        };
        const res = await safetyService.triggerSos(payload);
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
    [getCoords, user?.id, refresh],
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
    [activeSos?._id],
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
  }, [activeSos?._id]);

  const clearError = useCallback(() => setError(null), []);

  return {
    phase,
    activeSos,
    notifyMeta,
    secondsRemaining,
    lastSummary,
    loading,
    error,
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
