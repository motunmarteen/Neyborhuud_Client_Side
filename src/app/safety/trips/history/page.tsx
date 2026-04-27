'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { tripService, type Trip, type TripListResult } from '@/services/trip.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function duration(start?: string, end?: string): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function statusBadge(status: Trip['status']) {
  const map: Record<Trip['status'], { bg: string; text: string; label: string }> = {
    planned: { bg: '#fef9c3', text: '#ca8a04', label: 'Planned' },
    active: { bg: '#dcfce7', text: '#16a34a', label: 'Active' },
    completed: { bg: '#dbeafe', text: '#2563eb', label: 'Completed' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled' },
    escalated: { bg: '#fef3c7', text: '#d97706', label: 'Escalated' },
    panic: { bg: '#fee2e2', text: '#dc2626', label: 'Panic / SOS' },
  };
  const s = map[status] ?? map.cancelled;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ─── TripCard ──────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="neu-card-sm rounded-2xl p-4">
      <div
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(trip.status)}
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
              {trip.originText} → {trip.destinationText}
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            {fmt(trip.createdAt)}
            {(trip.status === 'completed' || trip.status === 'cancelled') &&
              ` · ${duration(trip.createdAt, trip.completedAt ?? trip.cancelledAt)}`}
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Progress</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>{trip.progressPercent ?? 0}%</p>
          </div>
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Max Escalation</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: trip.escalationLevel > 0 ? '#d97706' : 'var(--neu-text)' }}>
              Level {trip.escalationLevel}
            </p>
          </div>
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Expected Arrival</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>{fmt(trip.expectedArrival)}</p>
          </div>
          <div className="neu-socket rounded-xl p-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Check-in Interval</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>
              {trip.checkInIntervalMinutes} min
            </p>
          </div>
          {trip.notes && (
            <div className="col-span-2 neu-socket rounded-xl p-2">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Notes</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text)' }}>{trip.notes}</p>
            </div>
          )}
          {trip.linkedSosEventId && (
            <div className="col-span-2 rounded-xl p-2" style={{ background: '#fee2e2' }}>
              <p className="text-xs font-semibold text-red-600">⚠️ SOS auto-triggered during this trip</p>
            </div>
          )}
          {trip.cancellationReason && (
            <div className="col-span-2 neu-socket rounded-xl p-2">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>Cancellation reason</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text)' }}>{trip.cancellationReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

function TripHistoryInner() {
  const [result, setResult] = useState<TripListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripService.listTrips(p, 15);
      setResult(res.data ?? null);
      setPage(p);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const trips = result?.trips ?? [];
  const totalPages = result?.pages ?? 1;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pb-24">

            {/* Header */}
            <div
              className="neu-card-sm rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ backgroundImage: "url('/doodle-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
            >
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Trip History</h1>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                  All your past safe trips and their outcomes.
                </p>
              </div>
              <Link
                href="/safety/trips"
                className="px-3 py-2 rounded-xl text-white text-xs font-semibold"
                style={{ background: 'var(--primary)' }}
              >
                + New Trip
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && trips.length === 0 && (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="neu-card-sm rounded-2xl p-4 animate-pulse h-16" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && trips.length === 0 && !error && (
              <div className="neu-card-sm rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">🗺</p>
                <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>No trips yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                  Start your first safe trip to see history here.
                </p>
                <Link
                  href="/safety/trips"
                  className="inline-block mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'var(--primary)' }}
                >
                  Start a Safe Trip
                </Link>
              </div>
            )}

            {/* Trip list */}
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => load(page - 1)}
                  className="px-4 py-2 rounded-xl neu-btn text-sm disabled:opacity-40"
                  style={{ color: 'var(--neu-text)' }}
                >
                  ← Prev
                </button>
                <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => load(page + 1)}
                  className="px-4 py-2 rounded-xl neu-btn text-sm disabled:opacity-40"
                  style={{ color: 'var(--neu-text)' }}
                >
                  Next →
                </button>
              </div>
            )}

          </div>
        </main>
        <RightSidebar />
      </div>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

export default function TripHistoryPage() {
  return (
    <Suspense>
      <TripHistoryInner />
    </Suspense>
  );
}
