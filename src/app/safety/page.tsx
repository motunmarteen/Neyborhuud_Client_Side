'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import {
  safetyService,
  type GuardianRelationship,
  type GuardianStatus,
  type SosEvent,
  type UserStatus,
  type EmergencySource,
  type AgencyName,
} from '@/services/safety.service';

const STATUS_OPTIONS: Array<{ value: GuardianStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'removed', label: 'Removed' },
];

const LIVE_STATUS_OPTIONS: UserStatus['currentStatus'][] = [
  'safe',
  'on_the_move',
  'in_transit',
  'unsafe',
  'heading_home',
  'arrived',
  'need_attention',
];

function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiBase = envUrl && envUrl !== 'undefined'
    ? envUrl
    : 'https://neyborhuud-serverside.onrender.com/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

// ─── Emergency alert payload (from safety:emergency_alert WS event) ──────────
interface EmergencyAlertPayload {
  emergencyId: string;
  userId: string;
  type: string;
  severity: string;
  source?: EmergencySource;
  status: string;
  assignedAgency?: AgencyName;
  location: { lat: number; lng: number; address?: string };
  locationStr: string;
  title: string;
  body: string;
  timestamp: string;
}

const SOURCE_ICON: Record<string, string> = {
  manual_report:   '📋',
  manual_sos:      '📱',
  trip_monitoring: '🚗',
  geofence:        '🗺️',
};

const SEVERITY_COLOR: Record<string, string> = {
  low:      'border-green-700 bg-green-950/40',
  medium:   'border-yellow-700 bg-yellow-950/40',
  high:     'border-orange-700 bg-orange-950/40',
  critical: 'border-red-700 bg-red-950/40',
};

function SafetyPageInner() {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<GuardianRelationship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<GuardianRelationship[]>([]);
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);
  const [statusFeed, setStatusFeed] = useState<UserStatus[]>([]);
  const [guardianActivity, setGuardianActivity] = useState<Array<{ _id: string; guardianId: any; action: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<GuardianStatus | 'all'>('all');
  const [visibilityMode, setVisibilityMode] = useState<'normal' | 'silent'>('normal');
  const [emergencyServicesEnabled, setEmergencyServicesEnabled] = useState(false);

  const [myStatus, setMyStatus] = useState<UserStatus['currentStatus']>('safe');
  const [myStatusMessage, setMyStatusMessage] = useState('');

  // Real-time emergency alerts received as a guardian
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlertPayload[]>([]);
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0);

  const [linkers, setLinkers] = useState<Array<{ _id: string; firstName: string; lastName: string; username: string; avatarUrl?: string }>>([]);
  const [linkersLoading, setLinkersLoading] = useState(false);
  const [linkerSearch, setLinkerSearch] = useState('');

  const loadLinkers = useCallback(async () => {
    setLinkersLoading(true);
    try {
      const res = await safetyService.getEligibleLinkers();
      setLinkers(res.data?.linkers || []);
    } catch {
      setLinkers([]);
    } finally {
      setLinkersLoading(false);
    }
  }, []);

  const [guardianForm, setGuardianForm] = useState({
    guardianId: '',
    email: '',
    phoneNumber: '',
    nickname: '',
    relationshipType: 'friend' as 'parent' | 'spouse' | 'sibling' | 'friend' | 'colleague' | 'other',
    priorityLevel: 1,
    isTemporary: false,
    expiresAt: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, incomingRes, sosRes, feedRes, activeEmRes] = await Promise.all([
        safetyService.getGuardians(statusFilter === 'all' ? undefined : statusFilter),
        safetyService.getIncomingGuardianRequests(),
        safetyService.getActiveSos(),
        safetyService.getGuardiansFeed(),
        safetyService.getActiveEmergencies().catch(() => null),
      ]);

      setGuardians(gRes.data?.guardians || []);
      setIncomingRequests(incomingRes.data?.requests || []);
      setActiveSos(sosRes.data?.sosEvent || null);
      setStatusFeed(feedRes.data?.feed || []);
      setActiveEmergencyCount((activeEmRes?.data?.emergencies || []).length);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load safety data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadGuardianActivity = useCallback(async (sosEventId: string) => {
    try {
      const res = await safetyService.getGuardianActivity(sosEventId);
      setGuardianActivity(res.data?.logs || []);
    } catch {
      setGuardianActivity([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    loadLinkers();
  }, [loadLinkers]);

  useEffect(() => {
    if (activeSos?._id) {
      loadGuardianActivity(activeSos._id);
    } else {
      setGuardianActivity([]);
    }
  }, [activeSos?._id, loadGuardianActivity]);

  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = io(getSocketBaseUrl(), {
      transports: ['websocket'],
      withCredentials: false,
    });

    socket.on('connect', () => {
      socket.emit('authenticate', user.id);
    });

    socket.on('status:update', (payload: UserStatus) => {
      setStatusFeed((prev) => {
        const idx = prev.findIndex((s) => String(s.userId) === String(payload.userId));
        if (idx === -1) return [payload, ...prev];
        const next = [...prev];
        next[idx] = payload;
        return next;
      });
    });

    socket.on('location:update', (payload: { userId: string; location: { latitude: number; longitude: number; address?: string }; lastUpdatedAt: string }) => {
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
    });

    socket.on('safety:guardian_acknowledged', (payload: { guardianId: string; timestamp: string }) => {
      setGuardianActivity((prev) => [
        {
          _id: `live-${Date.now()}`,
          guardianId: { _id: payload.guardianId },
          action: 'acknowledged_alert',
          timestamp: payload.timestamp,
        },
        ...prev,
      ]);
    });

    socket.on('safety:sos_alert', (payload: { sosEventId: string; escalationLevel: number }) => {
      setActiveSos((prev) =>
        prev && prev._id === payload.sosEventId
          ? { ...prev, escalationLevel: payload.escalationLevel }
          : prev,
      );
    });

    socket.on('safety:emergency_services_dispatched', () => {
      void fetchData();
    });

    // Real-time emergency alerts pushed to this user as a guardian
    socket.on('safety:emergency_alert', (payload: EmergencyAlertPayload) => {
      setEmergencyAlerts((prev) => {
        // Deduplicate by emergencyId
        if (prev.some((a) => a.emergencyId === payload.emergencyId)) return prev;
        return [payload, ...prev].slice(0, 10);
      });
    });

    // Geofence alerts — surface as toast/notification in the safety page
    socket.on('geofence:entry', (payload: { label: string; type: string; message: string }) => {
      // Non-intrusive: just log to console; the /safety/geofences page shows the full alert UI
      console.info('[Geofence] Entry:', payload.message);
    });
    socket.on('geofence:exit', (payload: { label: string; type: string; message: string }) => {
      console.info('[Geofence] Exit:', payload.message);
    });
    socket.on('geofence:alert', (payload: { label: string; type: string; message: string; userId?: string }) => {
      console.warn('[Geofence] Alert:', payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, fetchData]);

  const acceptedGuardians = useMemo(
    () => guardians.filter((g) => g.status === 'accepted'),
    [guardians],
  );

  const onAddGuardian = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!guardianForm.guardianId) {
      setError('Please select a mutual linker to add as guardian.');
      return;
    }

    try {
      await safetyService.requestGuardian({
        guardianId: guardianForm.guardianId,
        nickname: guardianForm.nickname || undefined,
        relationshipType: guardianForm.relationshipType,
        priorityLevel: guardianForm.priorityLevel,
        isTemporary: guardianForm.isTemporary,
        expiresAt: guardianForm.isTemporary && guardianForm.expiresAt ? guardianForm.expiresAt : undefined,
      });
      setGuardianForm((prev) => ({ ...prev, guardianId: '', nickname: '' }));
      setLinkerSearch('');
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to request guardian');
    }
  };

  const onRespondRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    setError(null);
    try {
      await safetyService.respondGuardian({ requestId, action });
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to respond to request');
    }
  };

  const onRemoveGuardian = async (guardianId: string) => {
    setError(null);
    try {
      await safetyService.removeGuardian(guardianId);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to remove guardian');
    }
  };

  const onUpdateStatus = async () => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device/browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await safetyService.updateStatus({
            currentStatus: myStatus,
            customMessage: myStatusMessage || undefined,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            visibility: 'guardians_only',
          });
          await fetchData();
        } catch (err: any) {
          setError(err?.response?.data?.message || err?.message || 'Failed to update status');
        }
      },
      (geoError) => setError(geoError.message || 'Unable to fetch location for status update'),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const onTriggerSos = async () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device/browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          await safetyService.triggerSos({
            latitude,
            longitude,
            visibilityMode,
            emergencyServicesEnabled,
            deviceInfo: {
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
              platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
              accuracy,
              triggeredAt: new Date().toISOString(),
            },
          });
          await fetchData();
        } catch (err: any) {
          setError(err?.response?.data?.message || err?.message || 'Failed to trigger SOS');
        }
      },
      (geoError) => {
        setError(geoError.message || 'Unable to fetch location for SOS');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const onResolveSos = async () => {
    if (!activeSos?._id) return;
    setError(null);
    try {
      await safetyService.resolveSos(activeSos._id);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to resolve SOS');
    }
  };

  const onCancelSos = async () => {
    if (!activeSos?._id) return;
    setError(null);
    try {
      await safetyService.cancelSos(activeSos._id, 'False alarm');
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to cancel SOS');
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4 pb-24">
            <div className="neu-card-sm rounded-2xl p-4">
              <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Safety Circle & SOS</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                Real-time awareness network with guardian visibility, status context, and SOS escalation.
              </p>
            </div>

            {/* Real-time emergency alerts (guardian-facing) */}
            {emergencyAlerts.length > 0 && (
              <div className="flex flex-col gap-2">
                {emergencyAlerts.map((alert) => (
                  <div
                    key={alert.emergencyId}
                    className={`rounded-2xl border p-4 flex flex-col gap-2 ${SEVERITY_COLOR[alert.severity] ?? 'border-gray-700 bg-gray-900/40'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{SOURCE_ICON[alert.source ?? ''] ?? '🚨'}</span>
                        <div>
                          <p className="font-bold text-sm text-red-300">{alert.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{alert.body}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEmergencyAlerts((prev) => prev.filter((a) => a.emergencyId !== alert.emergencyId))}
                        className="shrink-0 text-gray-500 hover:text-gray-300 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      {alert.assignedAgency && (
                        <span>🏛️ <strong className="text-blue-400">{alert.assignedAgency}</strong></span>
                      )}
                      <span>📍 {alert.locationStr}</span>
                      <span className="ml-auto">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <Link
                      href="/safety/emergency"
                      className="self-start text-xs text-blue-400 underline mt-1"
                    >
                      View Emergency Dashboard →
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Safe Trips entry point */}
            <Link href="/safety/trips" className="block">
              <div className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity cursor-pointer">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>🛡 Safe Trips</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                    Start a monitored trip — guardians are alerted, check-ins are tracked, and SOS auto-triggers if you go silent.
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            {/* Geofences entry point */}
            <Link href="/safety/geofences" className="block">
              <div className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity cursor-pointer">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>🗺️ Safety Zones</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                    Define safe zones, alert areas, and restricted zones. Get notified automatically when you enter or leave — guardians alerted on high-risk zones.
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            {/* Kidnapping Tracking entry point */}
            <Link href="/safety/kidnapping-tracking" className="block">
              <div className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity cursor-pointer border border-red-900/60">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-red-400">🚨 Kidnapping Tracker</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                    Continuous GPS tracking with offline queue, network triangulation fallback, and real-time guardian visibility. Auto-activates on kidnapping/armed robbery SOS.
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            {/* Emergency reporting entry point */}
            <Link href="/safety/emergency" className="block">
              <div className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity cursor-pointer border border-red-900/40">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-red-400">🚨 Report Emergency</h2>
                    {activeEmergencyCount > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white leading-none">
                        {activeEmergencyCount} active
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                    Report armed robbery, kidnapping, fire, medical, and other emergencies. The right Nigerian agency (NPF / NEMA / DSS / Fire Service) is automatically dispatched for high-severity incidents.
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            <section className="neu-card-sm rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Live Status Update</h2>
                  <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                    Share your state and passive location with active guardians only.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  value={myStatus}
                  onChange={(e) => setMyStatus(e.target.value as UserStatus['currentStatus'])}
                  className="neu-input rounded-xl px-3 py-2"
                >
                  {LIVE_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  value={myStatusMessage}
                  onChange={(e) => setMyStatusMessage(e.target.value)}
                  placeholder="Custom status message"
                  className="neu-input rounded-xl px-3 py-2 md:col-span-2"
                />
              </div>

              <button
                onClick={onUpdateStatus}
                className="mt-3 px-4 py-2.5 rounded-xl neu-btn-active text-primary font-semibold"
              >
                Update Live Status
              </button>
            </section>

            <section className="neu-card-sm rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>SOS Engine</h2>
                  <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                    Priority escalation + fallback emergency services integration.
                  </p>
                </div>

                <div className="neu-socket rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setVisibilityMode('normal')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${visibilityMode === 'normal' ? 'neu-btn-active text-primary' : ''}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setVisibilityMode('silent')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${visibilityMode === 'silent' ? 'neu-btn-active text-red-500' : ''}`}
                  >
                    Silent
                  </button>
                </div>
              </div>

              <label className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: 'var(--neu-text)' }}>
                <input
                  type="checkbox"
                  checked={emergencyServicesEnabled}
                  onChange={(e) => setEmergencyServicesEnabled(e.target.checked)}
                />
                Enable emergency services fallback at max escalation
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={onTriggerSos}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Trigger SOS
                </button>

                {activeSos && (
                  <>
                    <button
                      onClick={onResolveSos}
                      className="px-4 py-2.5 rounded-xl neu-btn text-primary font-semibold"
                    >
                      Resolve SOS
                    </button>
                    <button
                      onClick={onCancelSos}
                      className="px-4 py-2.5 rounded-xl neu-btn text-red-500 font-semibold"
                    >
                      Cancel SOS
                    </button>
                  </>
                )}
              </div>

              <div className="mt-3 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                {activeSos
                  ? `Active SOS: ${activeSos.visibilityMode} mode · escalation level ${activeSos.escalationLevel}`
                  : 'No active SOS event.'}
              </div>

              {activeSos && (
                <div className="mt-3 neu-socket rounded-xl p-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>SOS Timeline</p>
                  {guardianActivity.length === 0 ? (
                    <p className="text-xs mt-2" style={{ color: 'var(--neu-text-muted)' }}>No activity yet.</p>
                  ) : (
                    <div className="mt-2 flex flex-col gap-1">
                      {guardianActivity.slice(0, 8).map((log) => (
                        <div key={log._id} className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString()} · {log.action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="neu-card-sm rounded-2xl p-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Guardian Status Feed</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>Live vs last-seen status from users who added you as guardian.</p>
              <div className="mt-3 flex flex-col gap-2">
                {statusFeed.length === 0 && !loading && (
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>No status feed yet.</p>
                )}
                {statusFeed.map((s, index) => {
                  const coords = s.location?.coordinates;
                  const isLive = Date.now() - new Date(s.lastUpdatedAt).getTime() < 2 * 60 * 1000;
                  return (
                    <div key={`${String(s.userId)}-${index}`} className="neu-socket rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>
                            {String(s.userId)} · {s.currentStatus}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                            {isLive ? 'Live' : 'Last seen'} · {new Date(s.lastUpdatedAt).toLocaleString()}
                          </p>
                          {coords && (
                            <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                              {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/safety/trips/watch/${String(s.userId)}`}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium"
                          style={{ background: 'var(--primary)', color: '#fff' }}
                          title="View active trip"
                        >
                          Trip →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="neu-card-sm rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Add Guardian</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                    Only mutual linkers (people you follow <em>and</em> who follow you back) can be added as guardians.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadLinkers}
                  disabled={linkersLoading}
                  className="shrink-0 px-3 py-1.5 rounded-xl neu-btn text-xs font-medium"
                  style={{ color: 'var(--primary)', opacity: linkersLoading ? 0.6 : 1 }}
                >
                  {linkersLoading ? 'Loading…' : linkers.length > 0 ? '↻ Refresh' : 'Load Linkers'}
                </button>
              </div>

              <form onSubmit={onAddGuardian} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Linker search dropdown */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  {linkers.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                      {linkersLoading ? 'Loading your mutual linkers…' : 'Click "Load Linkers" to see who you can add as a guardian.'}
                    </p>
                  ) : (
                    <>
                      <input
                        value={linkerSearch}
                        onChange={(e) => setLinkerSearch(e.target.value)}
                        placeholder="Search linkers…"
                        className="neu-input rounded-xl px-3 py-2 text-sm"
                      />
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto neu-socket rounded-xl p-2">
                        {linkers
                          .filter((l) => {
                            const q = linkerSearch.toLowerCase();
                            return (
                              !q ||
                              l.firstName.toLowerCase().includes(q) ||
                              l.lastName.toLowerCase().includes(q) ||
                              l.username.toLowerCase().includes(q)
                            );
                          })
                          .map((linker) => (
                            <button
                              key={linker._id}
                              type="button"
                              onClick={() => setGuardianForm((p) => ({ ...p, guardianId: linker._id }))}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                guardianForm.guardianId === linker._id ? 'neu-btn-active' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {linker.avatarUrl ? (
                                <img src={linker.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                  style={{ background: 'var(--primary)' }}
                                >
                                  {linker.firstName[0]}{linker.lastName[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>
                                  {linker.firstName} {linker.lastName}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>
                                  @{linker.username}
                                </p>
                              </div>
                              {guardianForm.guardianId === linker._id && (
                                <span className="material-symbols-outlined text-green-500" style={{ fontSize: '18px' }}>check_circle</span>
                              )}
                            </button>
                          ))}
                        {linkers.filter((l) => {
                          const q = linkerSearch.toLowerCase();
                          return !q || l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) || l.username.toLowerCase().includes(q);
                        }).length === 0 && (
                          <p className="text-xs text-center py-2" style={{ color: 'var(--neu-text-muted)' }}>No linkers match your search.</p>
                        )}
                      </div>
                      {guardianForm.guardianId && (
                        <p className="text-xs" style={{ color: '#16a34a' }}>
                          ✓ Selected: {linkers.find((l) => l._id === guardianForm.guardianId)?.firstName}{' '}
                          {linkers.find((l) => l._id === guardianForm.guardianId)?.lastName}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <input
                  value={guardianForm.nickname}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, nickname: e.target.value }))}
                  placeholder="Nickname (Dad, Aunty, etc.)"
                  className="neu-input rounded-xl px-3 py-2"
                />

                <select
                  value={guardianForm.relationshipType}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, relationshipType: e.target.value as any }))}
                  className="neu-input rounded-xl px-3 py-2"
                >
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="number"
                  min={1}
                  value={guardianForm.priorityLevel}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, priorityLevel: Number(e.target.value || 1) }))}
                  placeholder="Priority Level (1 = highest)"
                  className="neu-input rounded-xl px-3 py-2"
                />

                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--neu-text)' }}>
                  <input
                    type="checkbox"
                    checked={guardianForm.isTemporary}
                    onChange={(e) => setGuardianForm((p) => ({ ...p, isTemporary: e.target.checked }))}
                  />
                  Temporary guardian
                </label>

                {guardianForm.isTemporary && (
                  <input
                    type="datetime-local"
                    value={guardianForm.expiresAt}
                    onChange={(e) => setGuardianForm((p) => ({ ...p, expiresAt: e.target.value }))}
                    className="neu-input rounded-xl px-3 py-2"
                  />
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={!guardianForm.guardianId}
                    className="px-4 py-2.5 rounded-xl neu-btn-active text-primary font-semibold disabled:opacity-50"
                  >
                    Send Guardian Request
                  </button>
                </div>
              </form>
            </section>

            <section className="neu-card-sm rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                  Guardians ({acceptedGuardians.length} active)
                </h2>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as GuardianStatus | 'all')}
                  className="neu-input rounded-xl px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {guardians.length === 0 && !loading && (
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>No guardians found for this filter.</p>
                )}
                {guardians.map((g) => {
                  const gObj = typeof g.guardianId === 'string' ? null : g.guardianId;
                  const gId = typeof g.guardianId === 'string' ? g.guardianId : g.guardianId?._id;
                  return (
                    <div key={g._id} className="neu-socket rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>
                          {g.nickname || `${gObj?.firstName || ''} ${gObj?.lastName || ''}`.trim() || gObj?.email || 'Guardian'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                          {g.relationshipType || 'friend'} · priority {g.priorityLevel} · {g.status}
                          {g.isTemporary && g.expiresAt ? ` · expires ${new Date(g.expiresAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                      {g.status !== 'removed' && gId && (
                        <button
                          onClick={() => onRemoveGuardian(gId)}
                          className="px-3 py-2 rounded-lg neu-btn text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="neu-card-sm rounded-2xl p-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Incoming Guardian Requests</h2>
              <div className="mt-3 flex flex-col gap-2">
                {incomingRequests.length === 0 && !loading && (
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>No pending incoming requests.</p>
                )}
                {incomingRequests.map((r) => {
                  const requester = typeof r.userId === 'string' ? null : r.userId;
                  return (
                    <div key={r._id} className="neu-socket rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>
                          {requester ? `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || requester.email : 'User'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                          {r.relationshipType || 'friend'} · priority {r.priorityLevel}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onRespondRequest(r._id, 'accepted')}
                          className="px-3 py-2 rounded-lg neu-btn-active text-primary text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRespondRequest(r._id, 'rejected')}
                          className="px-3 py-2 rounded-lg neu-btn text-red-500 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {loading && <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading safety data...</p>}
            {error && (
              <div className="neu-card-sm rounded-xl p-3 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default function SafetyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen neu-base flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SafetyPageInner />
    </Suspense>
  );
}
