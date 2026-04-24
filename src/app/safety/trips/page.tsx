'use client';

import { Suspense, useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useTripMonitor } from '@/hooks/useTripMonitor';
import { type Trip } from '@/services/trip.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function fmtCountdown(secs: number | null): string {
  if (secs === null) return '—';
  if (secs <= 0) return 'Due now';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusColor(status: Trip['status']): string {
  switch (status) {
    case 'active': return 'text-green-500';
    case 'escalated': return 'text-amber-500';
    case 'panic': return 'text-red-600';
    case 'completed': return 'text-blue-500';
    case 'cancelled': return 'text-gray-400';
    default: return 'text-yellow-500';
  }
}

function escalationColor(level: number): string {
  if (level === 0) return 'bg-green-500';
  if (level === 1) return 'bg-yellow-400';
  if (level === 2) return 'bg-orange-500';
  return 'bg-red-600';
}

// ─── sub-components ───────────────────────────────────────────────────────────

function EscalationBanner({
  alert,
  onDismiss,
  onCheckIn,
}: {
  alert: { level: number; message: string };
  onDismiss: () => void;
  onCheckIn: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-3"
      style={{
        background: '#fffbeb',
        borderColor: '#fcd34d',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm" style={{ color: '#d97706' }}>
            {'⚠️ Missed Check-in — Level ' + alert.level}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{alert.message}</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>
      <button
        onClick={onCheckIn}
        className="self-start px-4 py-2 rounded-xl text-white text-sm font-semibold"
        style={{ background: '#d97706' }}
      >
        I&apos;m Safe — Check In Now
      </button>
    </div>
  );
}

/**
 * Shown when the system has automatically activated a silent SOS due to
 * multiple missed check-ins. This is a distinct, prominent banner separate
 * from the warning-level EscalationBanner.
 *
 * The user must still be able to check in to de-escalate, AND the manual
 * SOS panic button must always remain visible above this.
 */
function AutoSosActivatedBanner({ onCheckIn, onGoToSos }: { onCheckIn: () => void; onGoToSos: () => void }) {
  return (
    <div
      className="rounded-2xl p-4 border-2 flex flex-col gap-3 animate-pulse"
      style={{ background: '#fef2f2', borderColor: '#dc2626' }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-red-600" style={{ fontSize: '22px' }}>emergency</span>
        <p className="font-bold text-sm text-red-600">🆘 SOS Activated Automatically</p>
      </div>
      <p className="text-xs" style={{ color: '#6b7280' }}>
        The system triggered a <strong>silent SOS</strong> because you have not responded to multiple
        check-in alerts. Your guardians are being notified with your trip details and last known location.
        You can still check in to show you are safe — this will de-escalate the situation.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onCheckIn}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: '#16a34a' }}
        >
          ✅ I&apos;m Safe — Check In Now
        </button>
        <button
          onClick={onGoToSos}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: '#dc2626' }}
        >
          🚨 View SOS Status
        </button>
      </div>
    </div>
  );
}

/**
 * Persistent floating SOS panic button.
 * Always visible during an active trip — bypasses ALL trip state.
 * Positioned bottom-right above the bottom nav.
 * Section 5 of spec: must work even during active trips, during escalation,
 * regardless of system state.
 */
function FloatingSosPanicButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Trigger SOS Emergency"
      className="fixed z-[60] flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-bold text-white text-sm"
      style={{
        bottom: '80px', // above BottomNav (h-14 = 56px + margin)
        right: '16px',
        background: '#dc2626',
        boxShadow: '0 0 0 4px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.4)',
        animation: 'sos-pulse 2s ease-in-out infinite',
      }}
    >
      <span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>sos</span>
      SOS
      <style>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(220,38,38,0.15), 0 8px 32px rgba(220,38,38,0.55); }
        }
      `}</style>
    </button>
  );
}

function ActiveTripPanel({
  trip,
  tracking,
  checkInCountdown,
  onCheckIn,
  onComplete,
  onCancel,
  onPause,
  onResume,
  currentLocation,
}: {
  trip: Trip;
  tracking: boolean;
  checkInCountdown: number | null;
  onCheckIn: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
  currentLocation: { latitude: number; longitude: number } | null;
}) {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const isPaused = !!trip.pausedAt;
  const isTerminal = trip.status === 'completed' || trip.status === 'cancelled';

  return (
    <div className="flex flex-col gap-4">
      {/* Trip header */}
      <div className="neu-card-sm rounded-2xl p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Active Safe Trip</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              {trip.originText} → {trip.destinationText}
            </p>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wide ${statusColor(trip.status)}`}>
            {trip.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>
            <span>Progress</span>
            <span>{trip.progressPercent ?? 0}%</span>
          </div>
          <div className="h-2 rounded-full neu-socket overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${trip.progressPercent ?? 0}%`,
                background: 'var(--primary)',
              }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="neu-socket rounded-xl p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>ETA</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
              {trip.estimatedArrival ? fmt(trip.estimatedArrival) : fmt(trip.expectedArrival)}
            </p>
          </div>
          <div className="neu-socket rounded-xl p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Next Check-in</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: checkInCountdown !== null && checkInCountdown <= 120 ? '#f59e0b' : 'var(--neu-text)' }}>
              {fmtCountdown(checkInCountdown)}
            </p>
          </div>
          <div className="neu-socket rounded-xl p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Deviation</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: (trip.routeDeviationMeters ?? 0) > 300 ? '#f59e0b' : 'var(--neu-text)' }}>
              {trip.routeDeviationMeters ? `${trip.routeDeviationMeters.toFixed(0)} m` : '—'}
            </p>
          </div>
          <div className="neu-socket rounded-xl p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Escalation</p>
            <div className="flex justify-center mt-1 gap-0.5">
              {[1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-3 h-3 rounded-sm transition-colors ${lvl <= trip.escalationLevel ? escalationColor(lvl) : 'bg-gray-200 dark:bg-gray-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {isPaused && (
          <div className="mt-2 text-xs text-amber-600 font-medium">⏸ Tracking paused since {fmt(trip.pausedAt)}</div>
        )}

        {currentLocation && (
          <div className="mt-2 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            📍 {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
            {tracking && <span className="ml-2 text-green-500 font-medium">● Live</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="neu-card-sm rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--neu-text)' }}>Trip Controls</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onCheckIn}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}
            >
              ✓ Check In
            </button>

            {isPaused ? (
              <button
                onClick={onResume}
                className="px-4 py-2.5 rounded-xl neu-btn text-sm font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                ▶ Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-4 py-2.5 rounded-xl neu-btn text-sm font-semibold"
                style={{ color: 'var(--neu-text)' }}
              >
                ⏸ Pause
              </button>
            )}

            <button
              onClick={onComplete}
              className="px-4 py-2.5 rounded-xl neu-btn text-sm font-semibold"
              style={{ color: '#3b82f6' }}
            >
              🏁 Arrived Safely
            </button>

            <button
              onClick={() => setShowCancel((p) => !p)}
              className="px-4 py-2.5 rounded-xl neu-btn text-sm font-semibold text-red-500"
            >
              ✕ Cancel Trip
            </button>
          </div>

          {showCancel && (
            <div className="mt-3 flex gap-2">
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                className="neu-input rounded-xl px-3 py-2 flex-1 text-sm"
              />
              <button
                onClick={() => { onCancel(); setShowCancel(false); }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}

      {isTerminal && (
        <div className="neu-card-sm rounded-2xl p-4 text-center">
          <p className="font-semibold" style={{ color: trip.status === 'completed' ? '#3b82f6' : 'var(--neu-text-muted)' }}>
            {trip.status === 'completed' ? '🏁 Trip completed safely!' : '✕ Trip was cancelled'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            {trip.status === 'completed' ? fmt(trip.completedAt) : fmt(trip.cancelledAt)}
            {trip.cancellationReason ? ` · ${trip.cancellationReason}` : ''}
          </p>
          <Link
            href="/safety/trips/history"
            className="inline-block mt-3 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            View trip history →
          </Link>
        </div>
      )}
    </div>
  );
}

function StartTripForm({ onStart }: { onStart: (payload: any) => Promise<void> }) {
  const [form, setForm] = useState({
    originText: '',
    destinationText: '',
    expectedArrival: '',
    checkInIntervalMinutes: 30,
    notes: '',
  });
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [geocodingDest, setGeocodingDest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Default expectedArrival to 2 hours from now
  const defaultArrival = () => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /** Capture user's current GPS position and reverse-geocode to an address */
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setOriginCoords({ latitude, longitude });

        // Reverse-geocode via Nominatim (OSM — free, no API key)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const address =
              data.display_name ||
              [data.address?.road, data.address?.suburb, data.address?.city]
                .filter(Boolean)
                .join(', ');
            setForm((p) => ({ ...p, originText: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          } else {
            setForm((p) => ({ ...p, originText: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          }
        } catch {
          setForm((p) => ({ ...p, originText: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
        }
        setGpsLoading(false);
      },
      (posErr) => {
        setGpsError(
          posErr.code === posErr.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access and try again.'
            : 'Could not get your location. Please type your origin manually.'
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  /** Forward-geocode destination text via Nominatim on blur */
  const handleDestinationBlur = useCallback(async () => {
    const q = form.destinationText.trim();
    if (!q || q.length < 3) return;
    setGeocodingDest(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const results = await resp.json();
        if (results.length > 0) {
          setDestCoords({ latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) });
        }
      }
    } catch {
      // Geocoding failure is non-fatal — trip can still be started without destination coords
    } finally {
      setGeocodingDest(false);
    }
  }, [form.destinationText]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.originText.trim() || !form.destinationText.trim() || !form.expectedArrival) {
      setErr('Origin, destination, and expected arrival are required');
      return;
    }
    setSubmitting(true);
    try {
      await onStart({
        originText: form.originText.trim(),
        destinationText: form.destinationText.trim(),
        expectedArrival: new Date(form.expectedArrival).toISOString(),
        checkInIntervalMinutes: form.checkInIntervalMinutes,
        notes: form.notes.trim() || undefined,
        ...(originCoords && { originLocation: { latitude: originCoords.latitude, longitude: originCoords.longitude, address: form.originText.trim() } }),
        ...(destCoords && { destinationLocation: { latitude: destCoords.latitude, longitude: destCoords.longitude, address: form.destinationText.trim() } }),
      });
    } catch (e: any) {
      setErr(e?.message || 'Failed to start trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="neu-card-sm rounded-2xl p-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Start a Safe Trip</h2>
      <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
        Your guardians will be notified and monitoring will begin immediately.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {/* Origin with GPS button */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              value={form.originText}
              onChange={(e) => {
                setForm((p) => ({ ...p, originText: e.target.value }));
                setOriginCoords(null); // reset captured coords if user types manually
              }}
              placeholder="Starting from (e.g. Home, Ikeja)"
              className="neu-input rounded-xl px-3 py-2.5 flex-1"
              required
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsLoading}
              title="Use current location"
              className="px-3 py-2.5 rounded-xl neu-btn flex items-center gap-1 text-xs font-medium shrink-0"
              style={{ color: originCoords ? '#16a34a' : 'var(--primary)', opacity: gpsLoading ? 0.6 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {gpsLoading ? 'sync' : originCoords ? 'location_on' : 'my_location'}
              </span>
              {gpsLoading ? 'Getting…' : originCoords ? 'Got it' : 'My Location'}
            </button>
          </div>
          {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
          {originCoords && !gpsLoading && (
            <p className="text-xs" style={{ color: '#16a34a' }}>
              📍 GPS captured ({originCoords.latitude.toFixed(4)}, {originCoords.longitude.toFixed(4)})
            </p>
          )}
        </div>

        {/* Destination with geocoding feedback */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              value={form.destinationText}
              onChange={(e) => {
                setForm((p) => ({ ...p, destinationText: e.target.value }));
                setDestCoords(null);
              }}
              onBlur={handleDestinationBlur}
              placeholder="Going to (e.g. Work, Lekki)"
              className="neu-input rounded-xl px-3 py-2.5 w-full"
              required
            />
            {geocodingDest && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin"
                style={{ fontSize: '16px', color: 'var(--neu-text-muted)' }}
              >
                sync
              </span>
            )}
          </div>
          {destCoords && !geocodingDest && (
            <p className="text-xs" style={{ color: '#16a34a' }}>
              📍 Location found ({destCoords.latitude.toFixed(4)}, {destCoords.longitude.toFixed(4)})
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Expected arrival time
          </label>
          <input
            type="datetime-local"
            value={form.expectedArrival || defaultArrival()}
            onChange={(e) => setForm((p) => ({ ...p, expectedArrival: e.target.value }))}
            className="neu-input rounded-xl px-3 py-2.5"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Check-in interval (minutes)
          </label>
          <select
            value={form.checkInIntervalMinutes}
            onChange={(e) => setForm((p) => ({ ...p, checkInIntervalMinutes: Number(e.target.value) }))}
            className="neu-input rounded-xl px-3 py-2.5"
          >
            <option value={10}>Every 10 min</option>
            <option value={15}>Every 15 min</option>
            <option value={20}>Every 20 min</option>
            <option value={30}>Every 30 min (recommended)</option>
            <option value={45}>Every 45 min</option>
            <option value={60}>Every 60 min</option>
          </select>
        </div>

        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Notes (optional) — route info, who to contact, etc."
          rows={2}
          className="neu-input rounded-xl px-3 py-2.5 resize-none"
          maxLength={500}
        />

        {err && (
          <p className="text-sm text-red-500 font-medium">{err}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-3 rounded-xl text-white font-semibold transition-opacity"
          style={{ background: 'var(--primary)', opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? 'Starting…' : '🛡 Start Safe Trip'}
        </button>
      </form>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

function SafeTripsInner() {
  const {
    state,
    startTrip,
    checkIn,
    completeTrip,
    cancelTrip,
    pauseTrip,
    resumeTrip,
    dismissEscalationAlert,
    triggerManualSos,
  } = useTripMonitor();

  const hasActiveTrip =
    state.trip !== null &&
    (state.trip.status === 'active' ||
      state.trip.status === 'planned' ||
      state.trip.status === 'escalated' ||
      state.trip.status === 'panic');

  const isLiveTrip = hasActiveTrip && !state.trip?.pausedAt;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pb-24">

            {/* Header */}
            <div
              className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ backgroundImage: "url('/doodle-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
            >
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Safe Trips</h1>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                  Real-time trip monitoring with guardian alerts and escalation protection.
                </p>
              </div>
              <Link
                href="/safety/trips/history"
                className="px-3 py-2 rounded-xl neu-btn text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                History
              </Link>
            </div>

            {/* Errors */}
            {state.error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* AUTO-SOS ACTIVATED — distinct from warning escalation banner */}
            {state.autoSosTriggered && (
              <AutoSosActivatedBanner
                onCheckIn={checkIn}
                onGoToSos={triggerManualSos}
              />
            )}

            {/* Warning escalation banner — only when autoSos is NOT yet triggered */}
            {state.escalationAlert && !state.autoSosTriggered && (
              <EscalationBanner
                alert={state.escalationAlert}
                onDismiss={dismissEscalationAlert}
                onCheckIn={checkIn}
              />
            )}

            {/* Loading */}
            {state.loading && !state.trip && (
              <div className="neu-card-sm rounded-2xl p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading…</p>
              </div>
            )}

            {/* Active trip or start form */}
            {hasActiveTrip && state.trip ? (
              <ActiveTripPanel
                trip={state.trip}
                tracking={state.tracking}
                checkInCountdown={state.checkInCountdown}
                onCheckIn={checkIn}
                onComplete={completeTrip}
                onCancel={cancelTrip}
                onPause={pauseTrip}
                onResume={resumeTrip}
                currentLocation={state.currentLocation}
              />
            ) : !state.loading ? (
              <>
                {/* Completed / cancelled trip summary pill */}
                {state.trip && (
                  <div className="neu-socket rounded-xl p-3 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                    Last trip ({state.trip.status}): {state.trip.originText} → {state.trip.destinationText} · {fmt(state.trip.updatedAt)}
                  </div>
                )}

                <StartTripForm
                  onStart={async (payload) => {
                    await startTrip(payload);
                  }}
                />
              </>
            ) : null}

            {/* Safety tips */}
            {!hasActiveTrip && !state.loading && (
              <div className="neu-card-sm rounded-2xl p-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>How it works</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                  <li>🛡 Your guardians are notified the moment you start a trip</li>
                  <li>📍 Your location is tracked in the background and shared with guardians</li>
                  <li>⏱ You&apos;ll receive check-in prompts at your chosen interval</li>
                  <li>🔔 Missing a check-in escalates alerts — Level 1 to Level 4</li>
                  <li>🚨 Level 3 auto-triggers a silent SOS with your last known location</li>
                  <li>🏁 Mark yourself as arrived to close the trip and notify guardians</li>
                </ul>
              </div>
            )}

          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />

      {/* ── Persistent floating SOS panic button ──────────────────────────
          Always visible while the user has an active trip.
          Spec §5: must bypass all trip logic, work during escalation,
          regardless of system state. Positioned above BottomNav.
       ── */}
      {isLiveTrip && <FloatingSosPanicButton onClick={triggerManualSos} />}
    </div>
  );
}

export default function SafeTripsPage() {
  return (
    <Suspense>
      <SafeTripsInner />
    </Suspense>
  );
}
