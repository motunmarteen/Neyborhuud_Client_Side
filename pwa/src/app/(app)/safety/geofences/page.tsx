'use client';

/**
 * Geofences Management Page
 *
 * Users can:
 *  — View all their geofences on an interactive map
 *  — Create geofences by clicking the map and setting radius + type
 *  — Edit / delete existing geofences
 *  — See live WebSocket alerts (entry/exit/alert events)
 *
 * Guardians see alerts in the Safety page real-time feed.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from 'react';
import dynamicImport from 'next/dynamic';
import { SentinelHowItWorks } from '@/components/sentinel/SentinelHowItWorks';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';

// Force dynamic rendering to avoid pre-rendering issues
export const dynamic = 'force-dynamic';
import { useAuth } from '@/hooks/useAuth';
import {
  safetyService,
  type Geofence,
  type GeofenceType,
  type CreateGeofencePayload,
  type GeofenceAlertEvent,
} from '@/services/safety.service';
import { io, type Socket } from 'socket.io-client';
import { getGeolocation } from '@/lib/nativeGeolocation';

// ─── Lazy-load map (SSR-incompatible) ─────────────────────────────────────────
const GeofenceMap = dynamicImport(() => import('@/components/safety/GeofenceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-xl bg-brand-black animate-pulse flex items-center justify-center text-[var(--neu-text-muted)] text-sm">
      Loading map…
    </div>
  ),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<GeofenceType, string> = {
  safe_zone: 'Safe Zone',
  alert_zone: 'Alert Zone',
  restricted_zone: 'Restricted Zone',
};

const TYPE_COLORS: Record<GeofenceType, string> = {
  safe_zone: '#006F35',   // green
  alert_zone: '#00D431',  // amber
  restricted_zone: '#FF0000', // red
};

const TYPE_DOT_CLASS: Record<GeofenceType, string> = {
  safe_zone: 'bg-primary/10 border-2 border-primary',
  alert_zone: 'bg-status-warning/10 border-2 border-status-warning',
  restricted_zone: 'bg-brand-red/10 border-2 border-brand-red',
};

const TYPE_DESCRIPTIONS: Record<GeofenceType, string> = {
  safe_zone: 'Receive a notification when you arrive home or leave your safe area.',
  alert_zone: 'Get alerted when you or your guardians enter an unfamiliar area.',
  restricted_zone: 'High-risk area. Guardians are notified automatically. Can trigger SOS.',
};

function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiBase =
    envUrl && envUrl !== 'undefined'
      ? envUrl
      : 'https://neyborhuud-serverside.onrender.com/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

// ─── Default form values ──────────────────────────────────────────────────────

const DEFAULT_FORM: CreateGeofencePayload = {
  label: '',
  latitude: 6.5244,
  longitude: 3.3792,
  radiusMeters: 200,
  type: 'safe_zone',
  notifyOnEntry: true,
  notifyOnExit: true,
  notifyGuardians: false,
  triggerSos: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeofencesPage() {
  const { user } = useAuth();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateGeofencePayload>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Live alerts
  const [alerts, setAlerts] = useState<GeofenceAlertEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // ── Load geofences ────────────────────────────────────────────────────

  const loadGeofences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safetyService.listGeofences();
      setGeofences(res.data?.geofences ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load geofences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadGeofences();
  }, [user, loadGeofences]);

  // ── WebSocket (live alerts) ───────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const socket = io(getSocketBaseUrl(), {
      path: '/socket.io',
      auth: { userId: user.id },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const handleAlert = (payload: GeofenceAlertEvent) => {
      setAlerts((prev) => [payload, ...prev].slice(0, 20));
    };

    socket.on('geofence:entry', handleAlert);
    socket.on('geofence:exit', handleAlert);
    socket.on('geofence:alert', handleAlert);

    return () => {
      socket.off('geofence:entry', handleAlert);
      socket.off('geofence:exit', handleAlert);
      socket.off('geofence:alert', handleAlert);
      socket.disconnect();
    };
  }, [user]);

  // ── Map click: prefill lat/lng in the form ────────────────────────────

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setShowForm(true);
    setEditingId(null);
  }, []);

  // ── Form submit ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!form.label.trim()) return;

      setSubmitting(true);
      setError(null);
      try {
        if (editingId) {
          await safetyService.updateGeofence(editingId, form);
        } else {
          await safetyService.createGeofence(form);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(DEFAULT_FORM);
        await loadGeofences();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to save geofence');
      } finally {
        setSubmitting(false);
      }
    },
    [form, editingId, loadGeofences],
  );

  // ── Edit ──────────────────────────────────────────────────────────────

  const handleEdit = useCallback((fence: Geofence) => {
    setForm({
      label: fence.label,
      latitude: fence.latitude,
      longitude: fence.longitude,
      radiusMeters: fence.radiusMeters,
      type: fence.type,
      notifyOnEntry: fence.notifyOnEntry,
      notifyOnExit: fence.notifyOnExit,
      notifyGuardians: fence.notifyGuardians,
      triggerSos: fence.triggerSos,
    });
    setEditingId(fence._id);
    setShowForm(true);
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (fenceId: string) => {
      if (!confirm('Delete this geofence?')) return;
      try {
        await safetyService.deleteGeofence(fenceId);
        setGeofences((prev) => prev.filter((f) => f._id !== fenceId));
      } catch {
        setError('Failed to delete geofence');
      }
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────

  return (
    <SentinelSubpageLayout
      pageTitle="Geofences"
      pageSubtitle="Safe, alert, and restricted zones that react when you enter or leave."
      icon="fence"
      iconAccent="blue"
      maxWidth="920"
      header={
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setEditingId(null);
            setForm(DEFAULT_FORM);
          }}
          className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white"
        >
          + New zone
        </button>
      }
    >
      <SentinelHowItWorks>
        Tap the map to place a pin, set radius and zone type, then save. Safe zones confirm arrivals;
        alert zones warn on unfamiliar areas; restricted zones can notify guardians and trigger SOS.
      </SentinelHowItWorks>

      {error && (
        <div className="mod-card rounded-2xl border border-brand-red/30 bg-brand-red/10 px-4 py-2 text-sm text-brand-red">
          {error}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Live alerts</p>
              {alerts.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className={`flex gap-3 items-start rounded-xl px-4 py-3 border text-sm ${
                    a.type === 'restricted_zone'
                      ? 'border-status-danger/50 bg-status-danger/10 text-status-danger'
                      : a.type === 'alert_zone'
                      ? 'border-status-warning/70 bg-status-warning/15 text-status-warning'
                      : 'border-status-success/40 bg-status-success/8 text-status-success'
                  }`}
                >
                  <span className="text-lg">
                    {a.type === 'restricted_zone' ? '🚨' : a.event === 'entry' ? '✅' : '📍'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{a.message}</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setAlerts((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs opacity-40 hover:opacity-80"
                  >
                    ✕
                  </button>
                </div>
              ))}
        </div>
      )}

      <div className="mod-card overflow-hidden rounded-2xl p-0">
            <GeofenceMap
              geofences={geofences}
              onMapClick={handleMapClick}
              pendingPin={showForm && !editingId ? { lat: form.latitude!, lng: form.longitude! } : null}
              pendingRadius={form.radiusMeters ?? 200}
              pendingType={form.type ?? 'safe_zone'}
            />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mod-card space-y-4 rounded-2xl p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
            {editingId ? 'Edit geofence' : 'New geofence'}
          </p>

              {/* Label */}
              <div>
                <label className="block text-xs text-[var(--neu-text-muted)] mb-1">Name</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Home, Office, School"
                  maxLength={100}
                  required
                  className="mod-inset w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ color: 'var(--neu-text)' }}
                />
              </div>

              {/* Coordinates (readonly — set by map click or GPS) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--neu-text-muted)] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    title="Latitude coordinate"
                    placeholder="6.5244"
                    value={form.latitude}
                    onChange={(e) => setForm((p) => ({ ...p, latitude: parseFloat(e.target.value) }))}
                    className="mod-inset w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ color: 'var(--neu-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--neu-text-muted)] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    title="Longitude coordinate"
                    placeholder="3.3792"
                    value={form.longitude}
                    onChange={(e) => setForm((p) => ({ ...p, longitude: parseFloat(e.target.value) }))}
                    className="mod-inset w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ color: 'var(--neu-text)' }}
                  />
                </div>
              </div>

              {/* Use my current location */}
              <button
                type="button"
                onClick={() => {
                  getGeolocation()?.getCurrentPosition(
                    (pos) =>
                      setForm((p) => ({
                        ...p,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                      })),
                    () => setError('Could not get location'),
                  );
                }}
                className="text-xs text-primary hover:text-primary underline"
              >
                📍 Use my current location
              </button>

              {/* Radius */}
              <div>
                <label className="block text-xs text-[var(--neu-text-muted)] mb-1">
                  Radius: {form.radiusMeters}m
                </label>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  title="Geofence radius in metres"
                  value={form.radiusMeters}
                  onChange={(e) => setForm((p) => ({ ...p, radiusMeters: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-[var(--neu-text-muted)] mt-0.5">
                  <span>50m</span>
                  <span>5km</span>
                </div>
              </div>

              {/* Zone Type */}
              <div>
                <label className="block text-xs text-[var(--neu-text-muted)] mb-2">Zone Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['safe_zone', 'alert_zone', 'restricted_zone'] as GeofenceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        form.type === t
                          ? 'border-primary bg-status-success/10 text-primary'
                          : 'border-black/[0.08] text-[var(--neu-text-muted)] hover:border-black/[0.08]'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--neu-text-muted)] mt-2">{TYPE_DESCRIPTIONS[form.type ?? 'safe_zone']}</p>
              </div>

              {/* Notification toggles */}
              <div className="space-y-2">
                {(
                  [
                    { key: 'notifyOnEntry', label: 'Notify me on entry' },
                    { key: 'notifyOnExit', label: 'Notify me on exit' },
                    { key: 'notifyGuardians', label: 'Alert my guardians' },
                    { key: 'triggerSos', label: 'Auto-trigger SOS on entry (restricted zones)' },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 cursor-pointer ${
                      key === 'triggerSos' && form.type !== 'restricted_zone'
                        ? 'opacity-30 pointer-events-none'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-[var(--neu-text-muted)]">{label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-green-dark hover:bg-primary disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
                >
                  {submitting ? 'Saving…' : editingId ? 'Update Zone' : 'Create Zone'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(DEFAULT_FORM);
                  }}
                  className="px-4 py-2 bg-brand-black hover:bg-brand-surface rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
      )}

      {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-brand-black animate-pulse" />
              ))}
            </div>
      ) : geofences.length === 0 ? (
        <div className="mod-card rounded-2xl py-12 text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>
            No geofences yet
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            Tap &quot;+ New zone&quot; or click the map to draw your first boundary.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {geofences.map((fence) => (
            <GeofenceCard
              key={fence._id}
              fence={fence}
              onEdit={() => handleEdit(fence)}
              onDelete={() => handleDelete(fence._id)}
            />
          ))}
        </div>
      )}
    </SentinelSubpageLayout>
  );
}

// ─── GeofenceCard ─────────────────────────────────────────────────────────────

function GeofenceCard({
  fence,
  onEdit,
  onDelete,
}: {
  fence: Geofence;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColor =
    fence.lastStatus === 'inside'
      ? 'bg-primary'
      : fence.lastStatus === 'outside'
      ? 'bg-brand-surface'
      : 'bg-brand-black';
  const statusLabel = fence.lastStatus === 'inside' ? 'Inside' : fence.lastStatus === 'outside' ? 'Outside' : 'Unknown';

  return (
    <div className="mod-card flex items-center gap-3 rounded-2xl px-4 py-3">
      {/* Colour dot — Tailwind classes per type to avoid inline styles */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${TYPE_DOT_CLASS[fence.type]}`}
      >
        {fence.type === 'safe_zone' ? '🏠' : fence.type === 'alert_zone' ? '⚠️' : '🚨'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{fence.label}</p>
        <p className="text-xs text-[var(--neu-text-muted)] truncate">
          {TYPE_LABELS[fence.type]} · {fence.radiusMeters}m radius
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-[var(--neu-text-muted)]">{statusLabel}</span>
          {fence.notifyGuardians && (
            <span className="text-xs text-primary">Guardians alerted</span>
          )}
          {fence.triggerSos && (
            <span className="text-xs text-brand-red">Auto SOS</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button type="button" onClick={onEdit} className="mod-chip px-3 py-1.5 text-xs font-semibold">
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="mod-chip px-3 py-1.5 text-xs font-semibold text-brand-red"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
