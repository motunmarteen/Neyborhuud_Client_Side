'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { safetyService, type SosEvent } from '@/services/safety.service';

function statusIcon(status: SosEvent['status']) {
  if (status === 'resolved') return { icon: 'task_alt', className: 'text-primary' };
  if (status === 'cancelled') return { icon: 'cancel', className: 'text-[var(--neu-text-muted)]' };
  return { icon: 'emergency', className: 'text-brand-red' };
}

export function SosRecentHistory() {
  const [events, setEvents] = useState<SosEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getSosHistory(8, 1)
      .then((res) => {
        if (!cancelled) setEvents(res?.data?.events ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load history');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="Recent incidents"
        subtitle="Tap any event for the full timeline and guardian responses."
        action={
          <Link href="/safety/manage#history" className="text-xs font-semibold text-primary no-underline hover:underline">
            View all
          </Link>
        }
      />

      {error && (
        <div className="mod-card rounded-2xl border border-brand-red/25 px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {!events && !error && (
        <div className="animate-pulse mod-card h-24 rounded-2xl" />
      )}

      {events && events.length === 0 && !error && (
        <BrowseEmptyState
          icon="health_and_safety"
          filledIcon
          title="No SOS history yet"
          description="That’s a good thing. Incidents you resolve will appear here with full recaps."
        />
      )}

      {events && events.length > 0 && (
        <ul className="space-y-2">
          {events.map((e) => {
            const { icon, className } = statusIcon(e.status);
            return (
              <li key={e._id}>
                <Link
                  href={`/safety/incident/${e._id}`}
                  className="mod-card mod-card-hover flex items-center gap-3 rounded-2xl p-3 no-underline"
                >
                  <div className={`mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold capitalize" style={{ color: 'var(--neu-text)' }}>
                      {e.status.replace(/_/g, ' ')} · {e.visibilityMode}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-text-muted)' }}>
                    chevron_right
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
