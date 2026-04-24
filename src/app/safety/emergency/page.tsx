'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import {
  safetyService,
  type Emergency,
  type EmergencyType,
  type AgencyName,
  type EmergencySource,
  type DispatchStatus,
} from '@/services/safety.service';
import type { IncidentReplay } from '@/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMERGENCY_TYPES: Array<{ value: EmergencyType; label: string; icon: string; agency: AgencyName }> = [
  { value: 'armed_robbery',     label: 'Armed Robbery',       icon: '🔫', agency: 'NPF' },
  { value: 'kidnapping',        label: 'Kidnapping',          icon: '🚨', agency: 'DSS' },
  { value: 'fire',              label: 'Fire',                icon: '🔥', agency: 'Fire Service' },
  { value: 'fire_emergency',    label: 'Fire Emergency',      icon: '🧯', agency: 'Fire Service' },
  { value: 'medical',           label: 'Medical',             icon: '🏥', agency: 'NEMA' },
  { value: 'medical_emergency', label: 'Medical Emergency',   icon: '🚑', agency: 'NEMA' },
  { value: 'accident',          label: 'Accident',            icon: '🚗', agency: 'NPF' },
  { value: 'crime',             label: 'Crime',               icon: '🚔', agency: 'NPF' },
  { value: 'natural_disaster',  label: 'Natural Disaster',    icon: '🌊', agency: 'NEMA' },
  { value: 'security',          label: 'Security Threat',     icon: '🛡️', agency: 'NPF' },
  { value: 'harassment',        label: 'Harassment',          icon: '⚠️', agency: 'NPF' },
  { value: 'sos',               label: 'SOS (General)',       icon: '📡', agency: 'NPF' },
  { value: 'panic_button',      label: 'Panic Button',        icon: '🆘', agency: 'NPF' },
  { value: 'other',             label: 'Other',               icon: '❓', agency: 'NPF' },
];

const SEVERITY_LEVELS = [
  { value: 'low',      label: 'Low',      color: 'text-green-400',  bg: 'bg-green-900/30 border-green-700' },
  { value: 'medium',   label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700' },
  { value: 'high',     label: 'High',     color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700' },
  { value: 'critical', label: 'Critical', color: 'text-red-400',    bg: 'bg-red-900/30 border-red-700' },
] as const;

const STATUS_BADGE: Record<Emergency['status'], string> = {
  active:      'bg-red-900/50 text-red-300 border border-red-700',
  responding:  'bg-orange-900/50 text-orange-300 border border-orange-700',
  resolved:    'bg-green-900/50 text-green-300 border border-green-700',
  false_alarm: 'bg-gray-700 text-gray-400 border border-gray-600',
};

const SOURCE_LABEL: Record<EmergencySource, { icon: string; label: string }> = {
  manual_report:   { icon: '📋', label: 'Manual Report' },
  manual_sos:      { icon: '📱', label: 'Manual SOS' },
  trip_monitoring: { icon: '🚗', label: 'Trip Monitor' },
  geofence:        { icon: '🗺️', label: 'Geofence' },
};

const DISPATCH_BADGE: Record<DispatchStatus, string> = {
  pending:      'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
  sent:         'bg-green-900/40 text-green-300 border border-green-700',
  failed:       'bg-red-900/40 text-red-300 border border-red-700',
  not_required: 'bg-gray-800 text-gray-500 border border-gray-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmergencyPage() {
  // Form state
  const [type, setType]             = useState<EmergencyType>('crime');
  const [severity, setSeverity]     = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [description, setDesc]      = useState('');
  const [contact, setContact]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState<Emergency | null>(null);

  // History
  const [history, setHistory]         = useState<Emergency[]>([]);
  const [historyLoading, setHLoading] = useState(false);

  // Active emergencies
  const [active, setActive]         = useState<Emergency[]>([]);
  const [activeLoading, setALoading] = useState(false);

  // Escalation
  const [escalating, setEscalating]   = useState<string | null>(null);

  // Incident Replay
  const [replayData, setReplayData]       = useState<Record<string, IncidentReplay | null>>({});
  const [replayLoading, setReplayLoading] = useState<Record<string, boolean>>({});
  const [replayOpen, setReplayOpen]       = useState<Record<string, boolean>>({});

  const loadReplay = useCallback(async (emergencyId: string) => {
    if (replayLoading[emergencyId]) return;
    setReplayLoading((prev) => ({ ...prev, [emergencyId]: true }));
    setReplayOpen((prev) => ({ ...prev, [emergencyId]: true }));
    try {
      const res = await safetyService.getIncidentReplay(emergencyId);
      setReplayData((prev) => ({ ...prev, [emergencyId]: res.data ?? null }));
    } catch {
      setReplayData((prev) => ({ ...prev, [emergencyId]: null }));
    } finally {
      setReplayLoading((prev) => ({ ...prev, [emergencyId]: false }));
    }
  }, [replayLoading]);

  const selectedType = EMERGENCY_TYPES.find((t) => t.value === type)!;

  const loadHistory = useCallback(async () => {
    setHLoading(true);
    try {
      const res = await safetyService.getRecentEmergencies(10);
      setHistory(res.data?.emergencies || []);
    } catch {
      setHistory([]);
    } finally {
      setHLoading(false);
    }
  }, []);

  const loadActive = useCallback(async () => {
    setALoading(true);
    try {
      const res = await safetyService.getActiveEmergencies();
      setActive(res.data?.emergencies || []);
    } catch {
      setActive([]);
    } finally {
      setALoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); loadActive(); }, [loadHistory, loadActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    if (!navigator.geolocation) {
      setSubmitError('Geolocation is not supported on this device.');
      setSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await safetyService.reportEmergency({
            type,
            severity,
            description: description.trim() || undefined,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            reporterContact: contact.trim() || undefined,
            deviceInfo: {
              userAgent: navigator.userAgent,
              accuracy: pos.coords.accuracy,
              triggeredAt: new Date().toISOString(),
            },
          });
          setSubmitted(res.data?.report ?? null);
          setDesc('');
          setContact('');
          loadHistory();
          loadActive();
        } catch (err: any) {
          setSubmitError(err?.response?.data?.message || err?.message || 'Failed to report emergency');
        } finally {
          setSubmitting(false);
        }
      },
      (err) => {
        setSubmitError(err.message || 'Unable to get your location. Please enable GPS.');
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleEscalate = async (emergencyId: string) => {
    setEscalating(emergencyId);
    try {
      await safetyService.escalateEmergency(emergencyId);
      loadHistory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Escalation failed');
    } finally {
      setEscalating(null);
    }
  };

  const handleResolve = async (emergencyId: string) => {
    try {
      await safetyService.resolveEmergency(emergencyId);
      loadHistory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to resolve');
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">

            {/* Header */}
            <div className="neu-card-sm rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Link href="/safety" className="text-sm text-blue-400 hover:underline">← Safety</Link>
              </div>
              <h1 className="mt-2 text-xl font-bold text-[var(--neu-text)]">🚨 Report Emergency</h1>
              <p className="mt-1 text-sm text-[var(--neu-text-muted)]">
                Report an emergency and the correct Nigerian agency (NPF / NEMA / DSS / Fire Service) will be automatically notified for high-severity incidents.
              </p>
            </div>

            {/* Active Emergencies panel */}
            {(activeLoading || active.length > 0) && (
              <div className="neu-card-sm rounded-2xl p-5 border border-red-800/50">
                <h2 className="mb-3 font-semibold text-red-300">🔴 Active Emergencies</h2>
                {activeLoading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {active.map((em) => {
                      const typeInfo = EMERGENCY_TYPES.find((t) => t.value === em.type);
                      const src = em.source ? SOURCE_LABEL[em.source] : null;
                      return (
                        <div key={em._id} className="flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-950/20 px-4 py-3">
                          <span className="text-lg">{typeInfo?.icon ?? '⚠️'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-100 text-sm">{typeInfo?.label ?? em.type}</p>
                            <p className="text-xs text-gray-500 truncate">{em.description || em.location?.address || '—'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {src && (
                              <span className="rounded-full bg-gray-800 border border-gray-700 px-2 py-0.5 text-xs text-gray-400">
                                {src.icon} {src.label}
                              </span>
                            )}
                            {em.dispatchStatus && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DISPATCH_BADGE[em.dispatchStatus]}`}>
                                {em.dispatchStatus === 'sent' ? '✓ Dispatched' :
                                 em.dispatchStatus === 'failed' ? '✗ Dispatch Failed' :
                                 em.dispatchStatus === 'pending' ? '⏳ Pending' : 'Not Required'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Success banner */}
            {submitted && (
              <div className="rounded-2xl border border-green-700 bg-green-900/30 p-4">
                <p className="font-semibold text-green-300">✅ Emergency reported successfully</p>
                <p className="mt-1 text-sm text-green-400">
                  Assigned agency: <strong>{submitted.assignedAgency || '—'}</strong>
                  {submitted.agencyNotified && (
                    <span className="ml-2 text-green-300">· Agency notified ✓</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-green-500">Emergency ID: {submitted._id}</p>
                <button
                  className="mt-2 text-xs text-green-400 underline"
                  onClick={() => setSubmitted(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Report form */}
            <div className="neu-card-sm rounded-2xl p-5">
              <h2 className="mb-4 font-semibold text-[var(--neu-text)]">New Emergency Report</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Type selector */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--neu-text-muted)]">
                    Emergency Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {EMERGENCY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          type === t.value
                            ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                            : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span className="leading-tight">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--neu-text-muted)]">
                    Will notify: <strong className="text-blue-400">{selectedType.agency}</strong>
                  </p>
                </div>

                {/* Severity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--neu-text-muted)]">
                    Severity
                  </label>
                  <div className="flex gap-2">
                    {SEVERITY_LEVELS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          severity === s.value ? s.bg + ' ' + s.color : 'border-gray-700 bg-gray-800/40 text-gray-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {(severity === 'high' || severity === 'critical') && (
                    <p className="mt-1 text-xs text-orange-400">
                      ⚡ Agency will be automatically notified for {severity} severity
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neu-text-muted)]">
                    Description <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Brief description of the situation…"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Reporter contact */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neu-text-muted)]">
                    Your Contact Number <span className="text-gray-500">(optional, shared with agency)</span>
                  </label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {submitError && (
                  <p className="rounded-xl bg-red-900/30 px-3 py-2 text-sm text-red-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? '📡 Getting location & reporting…' : '🚨 Report Emergency'}
                </button>
              </form>
            </div>

            {/* Recent emergencies */}
            <div className="neu-card-sm rounded-2xl p-5">
              <h2 className="mb-4 font-semibold text-[var(--neu-text)]">Recent Emergencies</h2>

              {historyLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-500">No recent emergencies.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((em) => {
                    const typeInfo = EMERGENCY_TYPES.find((t) => t.value === em.type);
                    return (
                      <div
                        key={em._id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-700 bg-gray-800/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeInfo?.icon ?? '⚠️'}</span>
                            <div>
                              <p className="font-medium text-gray-100">
                                {typeInfo?.label ?? em.type}
                                {em.severity && (
                                  <span className={`ml-2 text-xs ${SEVERITY_LEVELS.find((s) => s.value === em.severity)?.color ?? ''}`}>
                                    [{em.severity}]
                                  </span>
                                )}
                              </p>
                              {em.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{em.description}</p>
                              )}
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[em.status]}`}>
                            {em.status}
                          </span>
                        </div>

                        {/* Agency + source + dispatch info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          {em.assignedAgency && (
                            <span className="flex items-center gap-1">
                              🏛️ <strong className="text-blue-400">{em.assignedAgency}</strong>
                            </span>
                          )}
                          {em.source && SOURCE_LABEL[em.source] && (
                            <span className="rounded-full bg-gray-800 border border-gray-700 px-2 py-0.5">
                              {SOURCE_LABEL[em.source].icon} {SOURCE_LABEL[em.source].label}
                            </span>
                          )}
                          {em.dispatchStatus && em.dispatchStatus !== 'not_required' && (
                            <span className={`rounded-full px-2 py-0.5 font-medium ${DISPATCH_BADGE[em.dispatchStatus]}`}>
                              {em.dispatchStatus === 'sent' ? '✓ Dispatched' :
                               em.dispatchStatus === 'failed' ? '✗ Failed' : '⏳ Pending'}
                            </span>
                          )}
                          {em.agencyNotified ? (
                            <span className="text-green-400">✓ Agency notified</span>
                          ) : null}
                          <span className="ml-auto">{new Date(em.createdAt).toLocaleString()}</span>
                        </div>

                        {/* Actions */}
                        {em.status === 'active' && (
                          <div className="flex gap-2 mt-1">
                            {!em.agencyNotified && (
                              <button
                                onClick={() => handleEscalate(em._id)}
                                disabled={escalating === em._id}
                                className="flex-1 rounded-lg bg-orange-700 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                              >
                                {escalating === em._id ? 'Escalating…' : '📢 Escalate to Agency'}
                              </button>
                            )}
                            <button
                              onClick={() => handleResolve(em._id)}
                              className="flex-1 rounded-lg bg-gray-700 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-600"
                            >
                              ✓ Resolve
                            </button>
                          </div>
                        )}

                        {/* Timeline replay (not shown for false alarms) */}
                        {(em.type as string) !== 'false_alarm' && (
                          <div className="mt-1">
                            <button
                              onClick={() => {
                                if (replayOpen[em._id] && replayData[em._id] !== undefined) {
                                  setReplayOpen((prev) => ({ ...prev, [em._id]: false }));
                                } else {
                                  loadReplay(em._id);
                                }
                              }}
                              className="w-full rounded-lg border border-gray-600 py-1.5 text-xs font-medium text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
                            >
                              {replayLoading[em._id]
                                ? '⏳ Loading timeline…'
                                : replayOpen[em._id]
                                ? '▲ Hide Timeline'
                                : '🎬 View Incident Timeline'}
                            </button>

                            {replayOpen[em._id] && !replayLoading[em._id] && (
                              <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900 p-3">
                                {!replayData[em._id] ? (
                                  <p className="text-xs text-red-400">Failed to load timeline.</p>
                                ) : (
                                  <>
                                    {/* Summary stats */}
                                    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                      {[
                                        { label: 'Total Events', value: replayData[em._id]!.summary.totalEvents },
                                        { label: 'Location Pings', value: replayData[em._id]!.summary.locationPings },
                                        { label: 'Chat Messages', value: replayData[em._id]!.summary.chatMessages },
                                        { label: 'System Events', value: replayData[em._id]!.summary.systemEvents },
                                      ].map(({ label, value }) => (
                                        <div key={label} className="rounded-lg bg-gray-800 p-2 text-center">
                                          <p className="text-base font-bold text-blue-400">{value}</p>
                                          <p className="text-[10px] text-gray-500">{label}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Clock drift warning */}
                                    {replayData[em._id]!.summary.clockDriftFlaggedPings > 0 && (
                                      <div className="mb-3 rounded-lg bg-yellow-950/40 p-2 text-xs text-yellow-300">
                                        ⚠️ {replayData[em._id]!.summary.clockDriftFlaggedPings} location ping(s) flagged for clock drift — timestamps may be inaccurate.
                                      </div>
                                    )}

                                    {/* Timeline entries */}
                                    <div className="flex flex-col gap-1.5">
                                      {replayData[em._id]!.timeline.map((entry, idx) => {
                                        const icon =
                                          entry.type === 'location_ping' ? '📍'
                                          : entry.type === 'chat_message' ? '💬'
                                          : '⚙️';
                                        return (
                                          <div
                                            key={idx}
                                            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${
                                              entry.clockDriftFlagged
                                                ? 'bg-yellow-950/30 border border-yellow-800/40'
                                                : 'bg-gray-800/60'
                                            }`}
                                          >
                                            <span className="shrink-0 text-sm">{icon}</span>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-xs text-gray-200">
                                                {entry.data?.content
                                                  ?? entry.data?.event
                                                  ?? entry.data?.address
                                                  ?? `${entry.source} · ${entry.type.replace('_', ' ')}`}
                                              </p>
                                              <p className="text-[10px] text-gray-500">
                                                {new Date(entry.timestamp).toLocaleTimeString('en-NG', {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  second: '2-digit',
                                                })}
                                                {entry.clockDriftFlagged && (
                                                  <span className="ml-1 text-yellow-400">⚠️ drift</span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>

        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
