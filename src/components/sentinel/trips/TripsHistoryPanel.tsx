'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { fmtTripDate, tripDuration } from '@/components/sentinel/trips/tripsFormat';
import { tripService, type Trip, type TripListResult } from '@/services/trip.service';

function statusChip(status: Trip['status']) {
  const styles: Record<Trip['status'], string> = {
    planned: 'text-amber-700 bg-status-warning/15',
    active: 'text-primary bg-primary/15',
    completed: 'text-brand-blue bg-brand-blue/15',
    cancelled: 'text-[var(--neu-text-muted)] bg-brand-surface',
    escalated: 'text-amber-700 bg-status-warning/15',
    panic: 'text-brand-red bg-brand-red/15',
  };
  const labels: Record<Trip['status'], string> = {
    planned: 'Planned',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    escalated: 'Escalated',
    panic: 'SOS',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status] ?? styles.cancelled}`}>
      {labels[status] ?? status}
    </span>
  );
}

function TripHistoryCard({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mod-card rounded-2xl p-4">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {statusChip(trip.status)}
            <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              {trip.originText} → {trip.destinationText}
            </p>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {fmtTripDate(trip.createdAt)}
            {(trip.status === 'completed' || trip.status === 'cancelled') &&
              ` · ${tripDuration(trip.createdAt, trip.completedAt ?? trip.cancelledAt)}`}
          </p>
        </div>
        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-text-muted)' }}>
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="mod-inset rounded-xl p-2">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Progress
            </p>
            <p className="mt-0.5 text-sm font-semibold">{trip.progressPercent ?? 0}%</p>
          </div>
          <div className="mod-inset rounded-xl p-2">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
              Escalation
            </p>
            <p className="mt-0.5 text-sm font-semibold">Level {trip.escalationLevel}</p>
          </div>
          {trip.linkedSosEventId ? (
            <div className="col-span-2 rounded-xl border border-brand-red/30 bg-brand-red/10 p-2 text-xs font-semibold text-brand-red">
              SOS auto-triggered during this trip
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TripsHistoryPanel({ compact }: { compact?: boolean }) {
  const [result, setResult] = useState<TripListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripService.listTrips(p, compact ? 8 : 15);
      setResult(res.data ?? null);
      setPage(p);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Failed to load trips';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    void load(1);
  }, [load]);

  const trips = result?.trips ?? [];
  const totalPages = result?.pages ?? 1;

  return (
    <div className="space-y-3">
      {error ? (
        <div className="mod-card rounded-2xl border border-brand-red/30 px-4 py-3 text-sm text-brand-red">{error}</div>
      ) : null}

      {loading && trips.length === 0 ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mod-card h-16 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : null}

      {!loading && trips.length === 0 && !error ? (
        <BrowseEmptyState
          icon="map"
          title="No trips yet"
          description="Start your first safe trip to build history here."
          action={
            <Link href="/safety/trips#start" className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white no-underline">
              Start a trip
            </Link>
          }
        />
      ) : null}

      {trips.map((trip) => (
        <TripHistoryCard key={trip._id} trip={trip} />
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
            className="mod-chip rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
            className="mod-chip rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {compact && trips.length > 0 ? (
        <Link
          href="/safety/trips/history"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary no-underline"
        >
          Full trip history
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      ) : null}
    </div>
  );
}
