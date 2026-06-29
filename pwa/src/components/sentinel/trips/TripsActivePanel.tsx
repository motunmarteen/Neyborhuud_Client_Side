'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Trip, TripLocation } from '@/services/trip.service';
import { fmtCountdown, fmtTripDate } from '@/components/sentinel/trips/tripsFormat';

type TripsActivePanelProps = {
  trip: Trip;
  tracking: boolean;
  checkInCountdown: number | null;
  currentLocation: TripLocation | null;
  onCheckIn: () => void;
  onComplete: () => void;
  onCancel: (reason?: string) => void;
  onPause: () => void;
  onResume: () => void;
};

function escalationDotClass(level: number, active: boolean): string {
  if (!active) return 'bg-brand-surface dark:bg-brand-black';
  if (level === 1) return 'bg-primary400';
  if (level === 2) return 'bg-amber-500';
  return 'bg-brand-red';
}

export function TripsActivePanel({
  trip,
  tracking,
  checkInCountdown,
  currentLocation,
  onCheckIn,
  onComplete,
  onCancel,
  onPause,
  onResume,
}: TripsActivePanelProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const isPaused = !!trip.pausedAt;
  const isTerminal = trip.status === 'completed' || trip.status === 'cancelled';
  const dueSoon = checkInCountdown !== null && checkInCountdown <= 120;

  return (
    <div className="space-y-4">
      <div className="mod-card rounded-2xl p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Live trip</p>
            <h2 className="mt-1 text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              {trip.originText} → {trip.destinationText}
            </h2>
          </div>
          <span className="mod-chip mod-chip-active shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-primary">
            {trip.status}
          </span>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            <span>Progress</span>
            <span>{trip.progressPercent ?? 0}%</span>
          </div>
          <div className="mod-inset h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${trip.progressPercent ?? 0}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
              ETA
            </p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>
              {trip.estimatedArrival ? fmtTripDate(trip.estimatedArrival) : fmtTripDate(trip.expectedArrival)}
            </p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
              Next check-in
            </p>
            <p className={`mt-0.5 text-xs font-semibold ${dueSoon ? 'text-primary' : ''}`} style={{ color: dueSoon ? undefined : 'var(--neu-text)' }}>
              {fmtCountdown(checkInCountdown)}
            </p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
              Deviation
            </p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>
              {trip.routeDeviationMeters ? `${trip.routeDeviationMeters.toFixed(0)} m` : '—'}
            </p>
          </div>
          <div className="mod-inset rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
              Escalation
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`h-3 w-3 rounded-sm ${escalationDotClass(lvl, lvl <= trip.escalationLevel)}`}
                />
              ))}
            </div>
          </div>
        </div>

        {isPaused ? (
          <p className="mt-2 text-xs font-medium text-status-warning">Tracking paused since {fmtTripDate(trip.pausedAt)}</p>
        ) : null}

        {currentLocation ? (
          <p className="mt-2 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
            {tracking ? <span className="ml-2 font-medium text-primary">· Live</span> : null}
          </p>
        ) : null}
      </div>

      {!isTerminal ? (
        <div className="mod-card rounded-2xl p-4">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            Trip controls
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCheckIn}
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              Check in
            </button>
            {isPaused ? (
              <button type="button" onClick={onResume} className="mod-chip rounded-full px-4 py-2.5 text-sm font-bold text-primary">
                Resume
              </button>
            ) : (
              <button type="button" onClick={onPause} className="mod-chip rounded-full px-4 py-2.5 text-sm font-semibold">
                Pause
              </button>
            )}
            <button type="button" onClick={onComplete} className="mod-chip rounded-full px-4 py-2.5 text-sm font-bold text-brand-blue">
              Arrived safely
            </button>
            <button
              type="button"
              onClick={() => setShowCancel((p) => !p)}
              className="mod-chip rounded-full px-4 py-2.5 text-sm font-bold text-brand-red"
            >
              Cancel trip
            </button>
          </div>
          {showCancel ? (
            <div className="mt-3 flex gap-2">
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                className="mod-inset flex-1 rounded-xl px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  onCancel(cancelReason || undefined);
                  setShowCancel(false);
                }}
                className="rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white"
              >
                Confirm
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mod-card rounded-2xl p-4 text-center">
          <p className="font-semibold" style={{ color: trip.status === 'completed' ? 'var(--primary)' : 'var(--neu-text-muted)' }}>
            {trip.status === 'completed' ? 'Trip completed safely' : 'Trip was cancelled'}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {trip.status === 'completed' ? fmtTripDate(trip.completedAt) : fmtTripDate(trip.cancelledAt)}
            {trip.cancellationReason ? ` · ${trip.cancellationReason}` : ''}
          </p>
          <Link href="/safety/trips#history" className="mt-3 inline-block text-sm font-bold text-primary no-underline">
            View trip history →
          </Link>
        </div>
      )}
    </div>
  );
}
