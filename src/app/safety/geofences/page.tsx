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
import dynamic from 'next/dynamic';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import {
  safetyService,
  type Geofence,
  type GeofenceType,
  type CreateGeofencePayload,
  type GeofenceAlertEvent,
} from '@/services/safety.service';
import { io, type Socket } from 'socket.io-client';

// ─── Lazy-load map (SSR-incompatible) ─────────────────────────────────────────
const GeofenceMap = dynamic(() => import('@/components/safety/GeofenceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-xl bg-gray-800 animate-pulse flex items-center justify-center text-gray-400 text-sm">
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
  safe_zone: '#22c55e',   // green
  alert_zone: '#f59e0b',  // amber
  restricted_zone: '#ef4444', // red
};

const TYPE_DOT_CLASS: Record<GeofenceType, string> = {
  safe_zone: 'bg-green-500/10 border-2 border-green-500',
  alert_zone: 'bg-amber-500/10 border-2 border-amber-500',
  restricted_zone: 'bg-red-500/10 border-2 border-red-500',
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
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="flex pt-16 pb-16">
        <LeftSidebar />

        <main className="flex-1 max-w-2xl mx-auto px-3 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">My Geofences</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Define safe and danger zones that react when you move.
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm((v) => !v);
                setEditingId(null);
                setForm(DEFAULT_FORM);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition"
            >
              + New Zone
            </button>
          </div>

          {/* Back to safety */}
          <Link href="/safety" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            ← Safety Dashboard
          </Link>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Live Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Live Alerts
              </h2>
              {alerts.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className={`flex gap-3 items-start rounded-xl px-4 py-3 border text-sm ${
                    a.type === 'restricted_zone'
                      ? 'border-red-700 bg-red-900/20 text-red-300'
                      : a.type === 'alert_zone'
                      ? 'border-amber-700 bg-amber-900/20 text-amber-300'
                      : 'border-green-700 bg-green-900/20 text-green-300'
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

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <GeofenceMap
              geofences={geofences}
              onMapClick={handleMapClick}
              pendingPin={showForm && !editingId ? { lat: form.latitude!, lng: form.longitude! } : null}
              pendingRadius={form.radiusMeters ?? 200}
              pendingType={form.type ?? 'safe_zone'}
            />
          </div>

          {/* Create / Edit form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4"
            >
              <h2 className="font-semibold text-lg">
                {editingId ? 'Edit Geofence' : 'New Geofence'}
              </h2>

              {/* Label */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Home, Office, School"
                  maxLength={100}
                  required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Coordinates (readonly — set by map click or GPS) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    title="Latitude coordinate"
                    placeholder="6.5244"
                    value={form.latitude}
                    onChange={(e) => setForm((p) => ({ ...p, latitude: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    title="Longitude coordinate"
                    placeholder="3.3792"
                    value={form.longitude}
                    onChange={(e) => setForm((p) => ({ ...p, longitude: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Use my current location */}
              <button
                type="button"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) =>
                      setForm((p) => ({
                        ...p,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                      })),
                    () => setError('Could not get location'),
                  );
                }}
                className="text-xs text-green-400 hover:text-green-300 underline"
              >
                📍 Use my current location
              </button>

              {/* Radius */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
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
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span>50m</span>
                  <span>5km</span>
                </div>
              </div>

              {/* Zone Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Zone Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['safe_zone', 'alert_zone', 'restricted_zone'] as GeofenceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        form.type === t
                          ? 'border-green-500 bg-green-900/30 text-green-300'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{TYPE_DESCRIPTIONS[form.type ?? 'safe_zone']}</p>
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
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
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
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Geofence list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : geofences.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="font-semibold">No geofences yet</p>
              <p className="text-sm mt-1">
                Click &quot;+ New Zone&quot; or tap on the map to create your first safety boundary.
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
        </main>

        <RightSidebar />
      </div>
      <BottomNav />
    </div>
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
      ? 'bg-green-500'
      : fence.lastStatus === 'outside'
      ? 'bg-gray-500'
      : 'bg-gray-700';
  const statusLabel = fence.lastStatus === 'inside' ? 'Inside' : fence.lastStatus === 'outside' ? 'Outside' : 'Unknown';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3">
      {/* Colour dot — Tailwind classes per type to avoid inline styles */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${TYPE_DOT_CLASS[fence.type]}`}
      >
        {fence.type === 'safe_zone' ? '🏠' : fence.type === 'alert_zone' ? '⚠️' : '🚨'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{fence.label}</p>
        <p className="text-xs text-gray-400 truncate">
          {TYPE_LABELS[fence.type]} · {fence.radiusMeters}m radius
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-gray-500">{statusLabel}</span>
          {fence.notifyGuardians && (
            <span className="text-xs text-amber-400">Guardians alerted</span>
          )}
          {fence.triggerSos && (
            <span className="text-xs text-red-400">Auto SOS</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg text-xs transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
