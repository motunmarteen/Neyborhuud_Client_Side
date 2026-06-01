'use client';

import { useCallback, useState, type FormEvent } from 'react';
import type { StartTripPayload } from '@/services/trip.service';
import { fetchNominatimReverse, fetchNominatimSearch } from '@/lib/nominatimClient';

type TripsStartFormProps = {
  onStart: (payload: StartTripPayload) => Promise<void>;
  disabled?: boolean;
};

function defaultArrivalLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TripsStartForm({ onStart, disabled }: TripsStartFormProps) {
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

        const data = await fetchNominatimReverse(latitude, longitude);
        const address =
          data?.display_name ||
          [data?.address?.road, data?.address?.suburb, data?.address?.city].filter(Boolean).join(', ');
        setForm((p) => ({
          ...p,
          originText: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        }));
        setGpsLoading(false);
      },
      (posErr) => {
        setGpsError(
          posErr.code === posErr.PERMISSION_DENIED
            ? 'Location permission denied. Allow access or type your origin.'
            : 'Could not get your location. Type your origin manually.',
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const handleDestinationBlur = useCallback(async () => {
    const q = form.destinationText.trim();
    if (!q || q.length < 3) return;
    setGeocodingDest(true);
    try {
      const results = await fetchNominatimSearch(q);
      if (results.length > 0) {
        setDestCoords({ latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) });
      }
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
        ...(originCoords && {
          originLocation: {
            latitude: originCoords.latitude,
            longitude: originCoords.longitude,
            address: form.originText.trim(),
          },
        }),
        ...(destCoords && {
          destinationLocation: {
            latitude: destCoords.latitude,
            longitude: destCoords.longitude,
            address: form.destinationText.trim(),
          },
        }),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start trip';
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mod-card rounded-2xl p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Start a safe trip</p>
      <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
        Guardians are notified and monitoring begins as soon as you start.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              value={form.originText}
              onChange={(e) => {
                setForm((p) => ({ ...p, originText: e.target.value }));
                setOriginCoords(null);
              }}
              placeholder="Starting from (e.g. Home, Ikeja)"
              className="mod-inset flex-1 rounded-xl px-3 py-2.5 text-sm"
              required
              disabled={disabled}
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsLoading || disabled}
              title="Use current location"
              className="mod-chip flex shrink-0 items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold text-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {gpsLoading ? 'sync' : originCoords ? 'location_on' : 'my_location'}
              </span>
              {gpsLoading ? 'Getting…' : originCoords ? 'Got it' : 'GPS'}
            </button>
          </div>
          {gpsError ? <p className="text-xs text-brand-red">{gpsError}</p> : null}
        </div>

        <div className="relative flex flex-col gap-1">
          <input
            value={form.destinationText}
            onChange={(e) => {
              setForm((p) => ({ ...p, destinationText: e.target.value }));
              setDestCoords(null);
            }}
            onBlur={handleDestinationBlur}
            placeholder="Going to (e.g. Work, Lekki)"
            className="mod-inset w-full rounded-xl px-3 py-2.5 text-sm"
            required
            disabled={disabled}
          />
          {geocodingDest ? (
            <span className="material-symbols-outlined absolute right-3 top-3 animate-spin text-[16px] text-primary">
              sync
            </span>
          ) : null}
          {destCoords && !geocodingDest ? (
            <p className="text-xs text-primary">Location found for destination</p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Expected arrival
          </label>
          <input
            type="datetime-local"
            aria-label="Expected arrival"
            value={form.expectedArrival || defaultArrivalLocal()}
            onChange={(e) => setForm((p) => ({ ...p, expectedArrival: e.target.value }))}
            className="mod-inset mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
            required
            disabled={disabled}
          />
        </div>

        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Check-in interval
          </label>
          <select
            aria-label="Check-in interval"
            value={form.checkInIntervalMinutes}
            onChange={(e) => setForm((p) => ({ ...p, checkInIntervalMinutes: Number(e.target.value) }))}
            className="mod-inset mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
            disabled={disabled}
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
          placeholder="Notes (optional) — route, who to contact…"
          rows={2}
          className="mod-inset resize-none rounded-xl px-3 py-2.5 text-sm"
          maxLength={500}
          disabled={disabled}
        />

        {err ? <p className="text-sm font-medium text-brand-red">{err}</p> : null}

        <button
          type="submit"
          disabled={submitting || disabled}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Starting…' : 'Start safe trip'}
        </button>
      </form>
    </div>
  );
}
