'use client';

/**
 * Incoming SOS / emergency alerts for users acting as guardians.
 * Listens app-wide via shared socketService + polls active emergencies.
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
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import apiClient, { shouldConnectSocket } from '@/lib/api-client';
import {
  dedupeAlerts,
  emergencyToGuardianAlert,
  type GuardianEmergencyAlert,
} from '@/lib/guardian-alerts';
import socketService from '@/lib/socket';
import { safetyService } from '@/services/safety.service';

type GuardianAlertsContextValue = {
  alerts: GuardianEmergencyAlert[];
  loading: boolean;
  refresh: () => Promise<void>;
  dismissAlert: (emergencyId: string) => void;
  acknowledge: (sosEventId: string) => Promise<void>;
  acknowledgingId: string | null;
};

const GuardianAlertsContext = createContext<GuardianAlertsContextValue | null>(null);

function normalizeSocketPayload(raw: Record<string, unknown>): GuardianEmergencyAlert | null {
  const emergencyId = String(raw.emergencyId ?? raw._id ?? '');
  if (!emergencyId) return null;

  const loc = (raw.location as { lat?: number; lng?: number; address?: string }) || {};
  const lat = Number(loc.lat ?? raw.latitude ?? 0);
  const lng = Number(loc.lng ?? raw.longitude ?? 0);

  return {
    emergencyId,
    sosEventId:
      typeof raw.sosEventId === 'string'
        ? raw.sosEventId
        : typeof (raw.escalationDetails as { sosEventId?: string } | undefined)?.sosEventId === 'string'
          ? (raw.escalationDetails as { sosEventId: string }).sosEventId
          : undefined,
    userId: String(raw.userId ?? ''),
    type: String(raw.type ?? 'sos'),
    severity: String(raw.severity ?? 'critical'),
    source: raw.source as GuardianEmergencyAlert['source'],
    status: String(raw.status ?? 'active'),
    assignedAgency: raw.assignedAgency as string | undefined,
    location: { lat, lng, address: loc.address },
    locationStr:
      String(raw.locationStr ?? '') ||
      loc.address ||
      (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Location shared'),
    title: String(raw.title ?? 'Emergency alert'),
    body: String(raw.body ?? 'Someone you protect needs help.'),
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
  };
}

export function GuardianAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<GuardianEmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    setLoading(true);
    try {
      const res = await safetyService.getActiveEmergencies();
      const incoming = (res.data?.emergencies ?? [])
        .map(emergencyToGuardianAlert)
        .filter((a) => !dismissedRef.current.has(a.emergencyId));
      setAlerts((prev) => dedupeAlerts([...incoming, ...prev]));
    } catch {
      // guardians may have no active emergencies — keep socket-fed alerts
    } finally {
      setLoading(false);
    }
  }, []);

  const pushAlert = useCallback((alert: GuardianEmergencyAlert) => {
    if (dismissedRef.current.has(alert.emergencyId)) return;
    setAlerts((prev) => dedupeAlerts([alert, ...prev]));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAlerts([]);
      return;
    }
    void refresh();
  }, [user?.id, refresh]);

  useEffect(() => {
    if (!user?.id) return;

    const onEmergencyAlert = (payload: Record<string, unknown>) => {
      const alert = normalizeSocketPayload(payload);
      if (!alert) return;
      pushAlert(alert);

      const isSos =
        alert.source === 'manual_sos' ||
        alert.type === 'sos' ||
        alert.type === 'panic_button' ||
        Boolean(alert.sosEventId);

      toast.error(alert.title, {
        description: alert.body,
        duration: isSos ? 20_000 : 12_000,
        action: {
          label: 'Respond',
          onClick: () => {
            window.location.href = alert.sosEventId
              ? `/safety/incident/${alert.sosEventId}`
              : '/safety/emergency';
          },
        },
      });
    };

    const onSosActivated = () => {
      void refresh();
    };

    const bind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.on('safety:emergency_alert', onEmergencyAlert);
      socket.on('safety:sos_activated', onSosActivated);
    };

    const unbind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.off('safety:emergency_alert', onEmergencyAlert);
      socket.off('safety:sos_activated', onSosActivated);
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
  }, [user?.id, pushAlert, refresh]);

  const dismissAlert = useCallback((emergencyId: string) => {
    dismissedRef.current.add(emergencyId);
    setAlerts((prev) => prev.filter((a) => a.emergencyId !== emergencyId));
  }, []);

  const acknowledge = useCallback(async (sosEventId: string) => {
    setAcknowledgingId(sosEventId);
    try {
      await safetyService.acknowledgeSos(sosEventId);
      toast.success('Guardian response recorded', {
        description: 'They will see that you acknowledged the alert.',
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Could not acknowledge';
      toast.error(msg);
    } finally {
      setAcknowledgingId(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      loading,
      refresh,
      dismissAlert,
      acknowledge,
      acknowledgingId,
    }),
    [alerts, loading, refresh, dismissAlert, acknowledge, acknowledgingId],
  );

  return (
    <GuardianAlertsContext.Provider value={value}>{children}</GuardianAlertsContext.Provider>
  );
}

export function useGuardianAlerts(): GuardianAlertsContextValue {
  const ctx = useContext(GuardianAlertsContext);
  if (!ctx) {
    throw new Error('useGuardianAlerts must be used within GuardianAlertsProvider');
  }
  return ctx;
}
