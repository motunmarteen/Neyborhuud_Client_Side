/**
 * useTripMonitor
 *
 * Central hook for the Safe-Trip system.
 * Handles:
 *  - Loading / starting / ending a trip
 *  - Continuous background GPS pinging (every 30 s by default)
 *  - Automatic check-in at each checkIn window
 *  - Pause / resume tracking
 *  - Real-time WebSocket events (trip:update, trip:escalation, trip:missed_checkin, trip:completed)
 *  - Escalation state exposed for UI warnings
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { tripService, type Trip, type StartTripPayload, type TripLocation } from "@/services/trip.service";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiBase =
    envUrl && envUrl !== "undefined"
      ? envUrl
      : "https://neyborhuud-serverside.onrender.com/api/v1";
  return apiBase.replace(/\/api\/v1\/?$/, "");
}

function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    }
  });
}

// ─── types ────────────────────────────────────────────────────────────────────

export interface TripMonitorState {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  /** Last GPS coords captured */
  currentLocation: TripLocation | null;
  /** Whether the background GPS watcher is running */
  tracking: boolean;
  /** Countdown to next check-in (seconds, 0 when due) */
  checkInCountdown: number | null;
  /** UI flag: user just missed a check-in escalation ping arrived */
  escalationAlert: { level: number; message: string } | null;
  /**
   * True when the backend automatically triggered a silent SOS from this trip
   * (level-3 escalation). The SOS is live — show a prominent "SOS Activated"
   * banner and keep the manual SOS button accessible.
   */
  autoSosTriggered: boolean;
  /** The sosEventId when autoSosTriggered is true */
  autoSosEventId: string | null;
}

export interface UseTripMonitor {
  state: TripMonitorState;
  startTrip: (payload: StartTripPayload) => Promise<Trip | null>;
  checkIn: () => Promise<void>;
  completeTrip: () => Promise<void>;
  cancelTrip: (reason?: string) => Promise<void>;
  pauseTrip: () => Promise<void>;
  resumeTrip: () => Promise<void>;
  refreshTrip: () => Promise<void>;
  dismissEscalationAlert: () => void;
  /**
   * Immediately navigate to the SOS panic page.
   * This is the manual override — bypasses all trip state.
   * Must always be callable regardless of trip/escalation state.
   */
  triggerManualSos: () => void;
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useTripMonitor(): UseTripMonitor {
  const { user } = useAuth();
  const router = useRouter();
  const { enqueue } = useOfflineQueue();

  const [state, setState] = useState<TripMonitorState>({
    trip: null,
    loading: false,
    error: null,
    currentLocation: null,
    tracking: false,
    checkInCountdown: null,
    escalationAlert: null,
    autoSosTriggered: false,
    autoSosEventId: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const locationPingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLocationRef = useRef<(TripLocation & { timestamp: string }) | null>(null);

  // ── state helpers ────────────────────────────────────────────────────────────

  const setTrip = useCallback((trip: Trip | null) => {
    setState((s) => ({ ...s, trip }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((s) => ({ ...s, loading }));
  }, []);

  // ── GPS background pinger ────────────────────────────────────────────────────

  const stopTracking = useCallback(() => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    if (locationPingRef.current) {
      clearInterval(locationPingRef.current);
      locationPingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setState((s) => ({ ...s, tracking: false, checkInCountdown: null }));
  }, []);

  const startTracking = useCallback(
    (trip: Trip) => {
      if (!navigator.geolocation) return;

      const pingLocation = async (lat: number, lng: number, accuracy?: number) => {
        const location: TripLocation = { latitude: lat, longitude: lng };
        setState((s) => ({ ...s, currentLocation: location }));

        // If offline, queue the update for later replay
        if (!navigator.onLine) {
          enqueue({ type: 'location', tripId: trip._id, latitude: lat, longitude: lng });
          prevLocationRef.current = { ...location, timestamp: new Date().toISOString() };
          return;
        }

        try {
          const result = await tripService.updateLocation(trip._id, location, prevLocationRef.current ?? undefined);
          if (result.data?.trip) {
            setState((s) => ({ ...s, trip: result.data!.trip }));
          }
        } catch {
          // Non-fatal: queue for retry
          enqueue({ type: 'location', tripId: trip._id, latitude: lat, longitude: lng });
        }

        prevLocationRef.current = { ...location, timestamp: new Date().toISOString() };
      };

      // High-accuracy watch — fires on significant movement
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          pingLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );

      // Interval fallback — ensures we ping even when stationary
      locationPingRef.current = setInterval(async () => {
        try {
          const pos = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
          pingLocation(pos.coords.latitude, pos.coords.longitude);
        } catch {}
      }, 30_000);

      // Check-in countdown timer
      const updateCountdown = () => {
        setState((s) => {
          if (!s.trip?.nextCheckInDue) return { ...s, checkInCountdown: null };
          const secs = Math.max(0, Math.round((new Date(s.trip.nextCheckInDue).getTime() - Date.now()) / 1000));
          return { ...s, checkInCountdown: secs };
        });
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      setState((s) => ({ ...s, tracking: true }));
    },
    [enqueue],
  );

  // ── load active trip on mount ─────────────────────────────────────────────

  const refreshTrip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripService.getActiveTrip();
      const trip = res.data?.trip ?? null;
      setTrip(trip);
      // Sync autoSos from persisted linkedSosEventId
      if (trip?.linkedSosEventId) {
        setState((s) => ({
          ...s,
          autoSosTriggered: true,
          autoSosEventId: trip.linkedSosEventId as string,
        }));
      }
      if (trip && (trip.status === "active" || trip.status === "escalated") && !trip.pausedAt) {
        startTracking(trip);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load trip");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTrip, startTracking]);

  useEffect(() => {
    if (user?.id) void refreshTrip();
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Page Visibility — resume GPS on tab focus ──────────────────────────────
  //
  // Mobile browsers often suspend JS timers and the GPS watchPosition listener
  // when the page is backgrounded. When the user returns, we immediately grab
  // the current position so the trip location record stays accurate.
  //
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      setState((s) => {
        // Only ping if there is an active, non-paused trip
        if (
          !s.trip ||
          s.trip.status === 'completed' ||
          s.trip.status === 'cancelled' ||
          !!s.trip.pausedAt
        ) {
          return s;
        }

        // Fire async GPS capture (state update happens inside)
        void getCurrentPosition({ enableHighAccuracy: false, timeout: 10_000 }).then((pos) => {
          const loc: TripLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setState((inner) => ({ ...inner, currentLocation: loc }));
          // Best-effort location ping — don't block on error
          void tripService
            .updateLocation(s.trip!._id, loc)
            .then((r) => {
              if (r.data?.trip) setState((inner) => ({ ...inner, trip: r.data!.trip }));
            })
            .catch(() => {});
          prevLocationRef.current = { ...loc, timestamp: new Date().toISOString() };
        }).catch(() => {});

        return s;
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  // Intentionally no state in deps — handler reads latest state via setState updater
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(getSocketBaseUrl(), {
      transports: ["websocket"],
      withCredentials: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("authenticate", user.id);
    });

    // Server broadcast after every location update / escalation tick
    // NOTE: trip:update is also handled below (after sos_triggered listener)

    socket.on("trip:started", (payload: Trip) => {
      setTrip(payload);
    });

    socket.on(
      "trip:escalation",
      (payload: { tripId: string; level: number; message?: string }) => {
        setState((s) => ({
          ...s,
          escalationAlert: {
            level: payload.level,
            message: payload.message ?? `Escalation level ${payload.level} — guardians notified`,
          },
          trip: s.trip ? { ...s.trip, escalationLevel: payload.level } : s.trip,
        }));
      },
    );

    socket.on("trip:missed_checkin", (payload: { tripId: string; missedCount: number }) => {
      setState((s) => ({
        ...s,
        escalationAlert: {
          level: s.trip?.escalationLevel ?? 1,
          message: `Missed check-in #${payload.missedCount} — your guardians have been alerted`,
        },
        trip: s.trip ? { ...s.trip, missedCheckIns: payload.missedCount } : s.trip,
      }));
    });

    socket.on("trip:completed", (payload: { tripId: string }) => {
      setState((s) => ({
        ...s,
        trip: s.trip?._id === payload.tripId ? { ...s.trip, status: "completed" } : s.trip,
        tracking: false,
      }));
      stopTracking();
    });

    socket.on("trip:route_deviation", (payload: { tripId: string; deviationMeters: number }) => {
      setState((s) => ({
        ...s,
        trip: s.trip ? { ...s.trip, routeDeviationMeters: payload.deviationMeters } : s.trip,
      }));
    });

    /**
     * Fired by sosService.trigger() when source = "trip_monitoring".
     * Updates state to show the "SOS Activated Automatically" UI layer.
     */
    socket.on(
      "trip:sos_triggered",
      (payload: { tripId: string; sosEventId: string; escalationLevel: number; message?: string }) => {
        setState((s) => ({
          ...s,
          autoSosTriggered: true,
          autoSosEventId: payload.sosEventId,
          // Keep escalationAlert cleared — the autoSos banner takes over
          escalationAlert: null,
          trip: s.trip
            ? { ...s.trip, linkedSosEventId: payload.sosEventId, escalationLevel: payload.escalationLevel }
            : s.trip,
        }));
      },
    );

    // Also derive autoSos from trip.linkedSosEventId on any trip:update
    socket.on("trip:update", (payload: Partial<Trip> & { tripId?: string }) => {
      setState((s) => {
        if (!s.trip) return s;
        const updated = { ...s.trip, ...payload };
        const autoSos = !!updated.linkedSosEventId;
        return {
          ...s,
          trip: updated,
          autoSosTriggered: autoSos || s.autoSosTriggered,
          autoSosEventId: (updated.linkedSosEventId as string | undefined) ?? s.autoSosEventId,
        };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, setTrip, stopTracking]);

  // ── actions ───────────────────────────────────────────────────────────────────

  const startTrip = useCallback(
    async (payload: StartTripPayload): Promise<Trip | null> => {
      setLoading(true);
      setError(null);
      try {
        // Try to attach current GPS to origin if not provided
        if (!payload.originLocation && navigator.geolocation) {
          try {
            const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
            payload = {
              ...payload,
              originLocation: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            };
          } catch {}
        }

        const res = await tripService.startTrip(payload);
        const trip = res.data?.trip ?? null;
        setTrip(trip);
        if (trip) startTracking(trip);
        return trip;
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to start trip");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setTrip, startTracking],
  );

  const checkIn = useCallback(async () => {
    const tripId = state.trip?._id;
    if (!tripId) return;
    setError(null);
    try {
      let location: TripLocation | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await getCurrentPosition({ enableHighAccuracy: false, timeout: 6000 });
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setState((s) => ({ ...s, currentLocation: location ?? s.currentLocation }));
        } catch {}
      }

      // If offline, queue check-in for later
      if (!navigator.onLine) {
        enqueue({ type: 'checkin', tripId, location });
        return;
      }

      const res = await tripService.checkIn(tripId, location);
      if (res.data?.trip) {
        setTrip(res.data.trip);
        setState((s) => ({ ...s, escalationAlert: null }));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Check-in failed");
    }
  }, [state.trip?._id, setError, setTrip, enqueue]);

  const completeTrip = useCallback(async () => {
    const tripId = state.trip?._id;
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      await tripService.completeTrip(tripId);
      stopTracking();
      setState((s) => ({
        ...s,
        trip: s.trip ? { ...s.trip, status: "completed" } : s.trip,
        loading: false,
        escalationAlert: null,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to complete trip");
      setLoading(false);
    }
  }, [state.trip?._id, setLoading, setError, stopTracking]);

  const cancelTrip = useCallback(
    async (reason?: string) => {
      const tripId = state.trip?._id;
      if (!tripId) return;
      setLoading(true);
      setError(null);
      try {
        await tripService.cancelTrip(tripId, reason);
        stopTracking();
        setState((s) => ({
          ...s,
          trip: s.trip ? { ...s.trip, status: "cancelled" } : s.trip,
          loading: false,
          escalationAlert: null,
        }));
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to cancel trip");
        setLoading(false);
      }
    },
    [state.trip?._id, setLoading, setError, stopTracking],
  );

  const pauseTrip = useCallback(async () => {
    const tripId = state.trip?._id;
    if (!tripId) return;
    setError(null);
    try {
      const res = await tripService.pauseTrip(tripId);
      if (res.data?.trip) setTrip(res.data.trip);
      stopTracking();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to pause trip");
    }
  }, [state.trip?._id, setError, setTrip, stopTracking]);

  const resumeTrip = useCallback(async () => {
    const tripId = state.trip?._id;
    if (!tripId) return;
    setError(null);
    try {
      const res = await tripService.resumeTrip(tripId);
      const trip = res.data?.trip ?? null;
      if (trip) {
        setTrip(trip);
        startTracking(trip);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to resume trip");
    }
  }, [state.trip?._id, setError, setTrip, startTracking]);

  const dismissEscalationAlert = useCallback(() => {
    setState((s) => ({ ...s, escalationAlert: null }));
  }, []);

  /**
   * Manual SOS override — always navigates to /safety regardless of trip state.
   * This bypasses all trip logic. Must never be gated behind trip conditions.
   */
  const triggerManualSos = useCallback(() => {
    router.push("/safety");
  }, [router]);

  return {
    state,
    startTrip,
    checkIn,
    completeTrip,
    cancelTrip,
    pauseTrip,
    resumeTrip,
    refreshTrip,
    dismissEscalationAlert,
    triggerManualSos,
  };
}
