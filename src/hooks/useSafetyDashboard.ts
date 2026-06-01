'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import socketService from '@/lib/socket';
import apiClient, { shouldConnectSocket } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { fetchEligibleGuardianCandidates, type GuardianCandidate } from '@/lib/guardianEligibleFollowers';
import {
  safetyService,
  type GuardianRelationship,
  type GuardianStatus,
  type UserStatus,
} from '@/services/safety.service';

export function useSafetyDashboard() {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<GuardianRelationship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<GuardianRelationship[]>([]);
  const [statusFeed, setStatusFeed] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<GuardianStatus | 'all'>('all');
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0);

  const [linkers, setLinkers] = useState<GuardianCandidate[]>([]);
  const [linkersLoading, setLinkersLoading] = useState(false);
  const [linkersLoaded, setLinkersLoaded] = useState(false);
  const [linkersMessage, setLinkersMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, incomingRes, feedRes, activeEmRes] = await Promise.all([
        safetyService.getGuardians(statusFilter === 'all' ? undefined : statusFilter),
        safetyService.getIncomingGuardianRequests(),
        safetyService.getGuardiansFeed(),
        safetyService.getActiveEmergencies().catch(() => null),
      ]);
      setGuardians(gRes.data?.guardians ?? []);
      setIncomingRequests(incomingRes.data?.requests ?? []);
      setStatusFeed(feedRes.data?.feed ?? []);
      setActiveEmergencyCount((activeEmRes?.data?.emergencies ?? []).length);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load dashboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadLinkers = useCallback(async () => {
    if (!user?.id) {
      setLinkersMessage('Sign in to load your followers.');
      setLinkers([]);
      setLinkersLoaded(true);
      return;
    }

    setLinkersLoading(true);
    setLinkersMessage(null);
    try {
      const result = await fetchEligibleGuardianCandidates(user.id, guardians);
      setLinkers(result.candidates);
      setLinkersLoaded(true);
      if (result.error) {
        setLinkersMessage(result.error);
      } else if (result.candidates.length === 0) {
        setLinkersMessage('No mutual followers available to add as guardians.');
      } else if (result.source === 'mutual-followers') {
        setLinkersMessage('Showing mutual followers (people you follow who follow you back).');
      }
    } catch (err: unknown) {
      setLinkers([]);
      setLinkersLoaded(true);
      setLinkersMessage(
        (err as Error)?.message || 'Failed to load followers. Check your connection and try again.',
      );
    } finally {
      setLinkersLoading(false);
    }
  }, [user?.id, guardians]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user?.id) return;

    const onStatusUpdate = (payload: UserStatus) => {
      setStatusFeed((prev) => {
        const idx = prev.findIndex((s) => String(s.userId) === String(payload.userId));
        if (idx === -1) return [payload, ...prev];
        const next = [...prev];
        next[idx] = payload;
        return next;
      });
    };

    const onLocationUpdate = (payload: {
      userId: string;
      location: { latitude: number; longitude: number; address?: string };
      lastUpdatedAt: string;
    }) => {
      setStatusFeed((prev) =>
        prev.map((s) =>
          String(s.userId) === String(payload.userId)
            ? {
                ...s,
                location: {
                  type: 'Point',
                  coordinates: [payload.location.longitude, payload.location.latitude],
                  address: payload.location.address,
                },
                lastUpdatedAt: payload.lastUpdatedAt,
                isLocationStale: false,
              }
            : s,
        ),
      );
    };

    const bind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.on('status:update', onStatusUpdate);
      socket.on('location:update', onLocationUpdate);
    };

    const unbind = () => {
      const socket = socketService.getSocket();
      if (!socket) return;
      socket.off('status:update', onStatusUpdate);
      socket.off('location:update', onLocationUpdate);
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

  const acceptedGuardianList = useMemo(
    () => guardians.filter((g) => g.status === 'accepted'),
    [guardians],
  );

  const acceptedGuardianCount = acceptedGuardianList.length;
  const pendingIncoming = incomingRequests.length;

  return {
    guardians,
    incomingRequests,
    statusFeed,
    loading,
    error,
    setError,
    statusFilter,
    setStatusFilter,
    activeEmergencyCount,
    linkers,
    linkersLoading,
    linkersLoaded,
    linkersMessage,
    loadLinkers,
    fetchData,
    acceptedGuardianList,
    acceptedGuardianCount,
    pendingIncoming,
  };
}
