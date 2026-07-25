'use client';

/**
 * Sentinel AI red-zone alerts — geo-scoped safety alerts pushed to users whose
 * home LGA (or a saved "work" place's LGA) matches an AI-flagged threat.
 * Listens app-wide via the shared socketService, mirroring GuardianAlertsContext.
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
import socketService from '@/lib/socket';
import { notificationsService } from '@/services/notifications.service';
import type { Notification as ApiNotification } from '@/types/api';

export type RedZoneAlert = {
  id: string;
  title: string;
  message: string;
  location: { lat?: number; lng?: number; address?: string; lga?: string; state?: string };
  severity: 'critical' | 'high' | 'warning';
  threatScore: number;
  alertId?: string;
  /**
   * The per-user Notification document's own _id — distinct from alertId
   * (the shared RedZoneAlert every recipient's copy points back to).
   * Dismissing must mark THIS read on the backend, or it reappears on the
   * next refresh/reload since the server has no idea it was dismissed.
   * Undefined for alerts that only ever arrived over the socket and were
   * never fetched from /notifications (no persisted copy to mark read yet).
   */
  notificationId?: string;
  /** Why this user received it — home LGA resident, or work-area commuter. */
  reason: 'home' | 'work';
  timestamp: string;
};

type RedZoneAlertsContextValue = {
  alerts: RedZoneAlert[];
  loading: boolean;
  refresh: () => Promise<void>;
  dismissAlert: (id: string) => void;
};

const RedZoneAlertsContext = createContext<RedZoneAlertsContextValue | null>(null);

function normalizeSocketPayload(
  raw: Record<string, unknown>,
  notificationId?: string,
): RedZoneAlert | null {
  const title = String(raw.title ?? '');
  const message = String(raw.message ?? '');
  if (!title && !message) return null;

  const timestamp = String(raw.timestamp ?? new Date().toISOString());
  return {
    id: String(raw.alertId ?? `${timestamp}-${title}`),
    title: title || '⚠️ Security Advisory',
    message: message || 'Unusual activity detected nearby.',
    location: (raw.location as RedZoneAlert['location']) ?? {},
    severity: (raw.severity as RedZoneAlert['severity']) ?? 'warning',
    threatScore: Number(raw.threatScore ?? 0),
    alertId: raw.alertId as string | undefined,
    notificationId,
    reason: raw.reason === 'work' ? 'work' : 'home',
    timestamp,
  };
}

function dedupeAlerts(alerts: RedZoneAlert[]): RedZoneAlert[] {
  const seen = new Set<string>();
  const out: RedZoneAlert[] = [];
  for (const a of alerts) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

export function RedZoneAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RedZoneAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    setLoading(true);
    try {
      const res = await notificationsService.getRedZoneAlerts(10);
      const payload = (res as any)?.data ?? res;
      const items = (payload?.data ?? []) as ApiNotification[];
      const incoming = items
        .filter((n) => !n.isRead)
        .map((n) => {
          const data = n.data ?? {};
          return normalizeSocketPayload(
            {
              title: n.title,
              message: n.message,
              location: data.location,
              severity: data.severity,
              threatScore: data.threatScore,
              alertId: (data.alertId as string) ?? n.id,
              reason: data.reason,
              timestamp: n.createdAt,
            },
            n.id,
          );
        })
        .filter((a): a is RedZoneAlert => a !== null && !dismissedRef.current.has(a.id));
      setAlerts((prev) => dedupeAlerts([...incoming, ...prev]));
    } catch {
      // No history yet — keep any socket-fed alerts already in state.
    } finally {
      setLoading(false);
    }
  }, []);

  const pushAlert = useCallback((alert: RedZoneAlert) => {
    if (dismissedRef.current.has(alert.id)) return;
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

    const onRedZone = (payload: Record<string, unknown>) => {
      const alert = normalizeSocketPayload(payload);
      if (!alert) return;
      pushAlert(alert);

      const isCritical = alert.severity === 'critical';
      const near = alert.reason === 'work' ? 'your work area' : 'your area';
      const toastFn = isCritical ? toast.error : toast.warning;
      toastFn(alert.title, {
        description: `Near ${near}: ${alert.message}`,
        duration: isCritical ? 15_000 : 8_000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/safety/sentinel';
          },
        },
      });
    };

    const bind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.on('safety:red_zone', onRedZone);
    };
    const unbind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.off('safety:red_zone', onRedZone);
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
  }, [user?.id, pushAlert]);

  const dismissAlert = useCallback((id: string) => {
    dismissedRef.current.add(id);
    setAlerts((prev) => {
      const target = prev.find((a) => a.id === id);
      // Persist the dismissal so it doesn't reappear on the next refresh or
      // page reload — previously this only updated an in-memory ref, so the
      // "dismissed" alert would come right back the moment refresh() ran
      // again (e.g. on next app open).
      if (target?.notificationId) {
        void notificationsService.markAsRead(target.notificationId).catch(() => {
          // Best-effort — the alert is still hidden client-side for this
          // session even if the persist call fails.
        });
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const value = useMemo(
    () => ({ alerts, loading, refresh, dismissAlert }),
    [alerts, loading, refresh, dismissAlert],
  );

  return (
    <RedZoneAlertsContext.Provider value={value}>{children}</RedZoneAlertsContext.Provider>
  );
}

export function useRedZoneAlerts(): RedZoneAlertsContextValue {
  const ctx = useContext(RedZoneAlertsContext);
  if (!ctx) {
    throw new Error('useRedZoneAlerts must be used within RedZoneAlertsProvider');
  }
  return ctx;
}
