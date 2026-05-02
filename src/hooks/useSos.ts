"use client";

/**
 * useSos — central hook for the SOS lifecycle.
 *
 * Drives:
 *   • triggerSos / cancelSos / resolveSos calls
 *   • countdown ticker (driven by pendingUntil from server)
 *   • socket events: safety:sos_pending, safety:sos_activated, safety:sos_cancelled_pending,
 *     safety:guardian_acknowledged, safety:emergency_services_dispatched
 *   • boot recovery via GET /sos/active
 *
 * Design:
 *   • Single source of truth for emergency-mode state across the app.
 *   • Components subscribe via the returned object and never own a duplicate Socket connection.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { safetyService, type SosEvent } from "@/services/safety.service";
import type { IncidentSummary } from "@/types/api";

function getSocketBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL;
  const apiBase =
    envUrl && envUrl !== "undefined"
      ? envUrl
      : "https://neyborhuud-serverside.onrender.com/api/v1";
  return apiBase.replace(/\/api\/v1\/?$/, "");
}

export type SosPhase = "idle" | "pending" | "active" | "resolved" | "cancelled";

export interface SosTriggerOptions {
  /** Force silent (long-press): server clamps countdownSeconds=0. */
  silent?: boolean;
  /** Override countdown (0..30). Ignored when silent=true. */
  countdownSeconds?: number;
  emergencyServicesEnabled?: boolean;
  deviceInfo?: Record<string, unknown>;
}

export interface UseSosReturn {
  phase: SosPhase;
  activeSos: SosEvent | null;
  /** Seconds remaining on the pending countdown; 0 if not pending. */
  secondsRemaining: number;
  /** Most recent post-incident summary (after resolve). */
  lastSummary: IncidentSummary | null;
  loading: boolean;
  error: string | null;
  /** Resolve current geolocation and POST /sos/trigger. */
  triggerSos: (opts?: SosTriggerOptions) => Promise<void>;
  cancelSos: (reason?: string) => Promise<void>;
  resolveSos: () => Promise<void>;
  /** Force re-fetch of /sos/active (e.g. on app foreground). */
  refresh: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_COUNTDOWN = 5;

export function useSos(): UseSosReturn {
  const { user } = useAuth();
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [lastSummary, setLastSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase: SosPhase = useMemo(() => {
    if (!activeSos) return "idle";
    if (activeSos.status === "pending") return "pending";
    if (activeSos.status === "active" || activeSos.status === "triggered") return "active";
    if (activeSos.status === "resolved") return "resolved";
    return "cancelled";
  }, [activeSos]);

  // ── Countdown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    if (phase !== "pending" || !activeSos?.pendingUntil) {
      setSecondsRemaining(0);
      return;
    }
    const target = new Date(activeSos.pendingUntil).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };
    tick();
    tickerRef.current = setInterval(tick, 250);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [phase, activeSos?.pendingUntil]);

  // ── Boot recovery ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const res = await safetyService.getActiveSos();
      setActiveSos(res.data?.sosEvent || null);
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void refresh();
  }, [user?.id, refresh]);

  // ── Socket subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(getSocketBaseUrl(), {
      transports: ["websocket"],
      withCredentials: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("authenticate", user.id));

    socket.on(
      "safety:sos_pending",
      (payload: {
        sosEventId: string;
        countdownSeconds: number;
        pendingUntil: string;
        visibilityMode: "normal" | "silent";
      }) => {
        // Multi-device sync: a pending SOS started elsewhere.
        setActiveSos((prev) => {
          if (prev && prev._id === payload.sosEventId) {
            return { ...prev, status: "pending", pendingUntil: payload.pendingUntil, countdownSeconds: payload.countdownSeconds };
          }
          // Fetch full record asynchronously; render placeholder meanwhile.
          void refresh();
          return prev;
        });
      },
    );

    socket.on(
      "safety:sos_activated",
      (payload: { sosEventId: string; emergencyId: string; conversationId: string | null }) => {
        setActiveSos((prev) =>
          prev && prev._id === payload.sosEventId
            ? { ...prev, status: "active", pendingUntil: null }
            : prev,
        );
        void refresh();
      },
    );

    socket.on(
      "safety:sos_cancelled_pending",
      (payload: { sosEventId: string; reason: string }) => {
        setActiveSos((prev) =>
          prev && prev._id === payload.sosEventId
            ? { ...prev, status: "cancelled", cancelledDuringPending: true, cancelReason: payload.reason }
            : prev,
        );
        // Clear after a brief moment so the UI can show a "cancelled" toast.
        setTimeout(() => {
          setActiveSos((prev) =>
            prev && prev._id === payload.sosEventId ? null : prev,
          );
        }, 1500);
      },
    );

    socket.on(
      "safety:sos_alert",
      (payload: { sosEventId: string; escalationLevel: number }) => {
        setActiveSos((prev) =>
          prev && prev._id === payload.sosEventId
            ? { ...prev, escalationLevel: payload.escalationLevel }
            : prev,
        );
      },
    );

    socket.on("safety:emergency_services_dispatched", () => {
      void refresh();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, refresh]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const getCoords = useCallback(
    () =>
      new Promise<GeolocationCoordinates>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported on this device"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(new Error(err.message || "Unable to fetch location")),
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
          visibilityMode: opts.silent ? ("silent" as const) : ("normal" as const),
          countdownSeconds: opts.silent ? 0 : opts.countdownSeconds ?? DEFAULT_COUNTDOWN,
          emergencyServicesEnabled: opts.emergencyServicesEnabled,
          deviceInfo: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
            accuracy: coords.accuracy,
            triggeredAt: new Date().toISOString(),
            ...(opts.deviceInfo ?? {}),
          },
        };
        const res = await safetyService.triggerSos(payload);
        const data = res.data;
        if (!data) return;

        if (data.status === "pending") {
          setActiveSos({
            _id: data.sosEventId,
            userId: user?.id ?? "",
            status: "pending",
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
          // 'active' or 'already_active' — pull canonical record.
          await refresh();
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Failed to trigger SOS";
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
        // Auto-clear soon after.
        setTimeout(() => setActiveSos((prev) => (prev?.status === "cancelled" ? null : prev)), 1500);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Failed to cancel SOS";
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
      setTimeout(() => setActiveSos((prev) => (prev?.status === "resolved" ? null : prev)), 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to resolve SOS";
      setError(msg);
    }
  }, [activeSos?._id]);

  const clearError = useCallback(() => setError(null), []);

  return {
    phase,
    activeSos,
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
