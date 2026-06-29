'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { safetyService, type SosEvent } from '@/services/safety.service';

function statusIcon(status: SosEvent['status']) {
  if (status === 'resolved') return { icon: 'task_alt', className: 'text-emerald-600 border-emerald-100 bg-emerald-50/40' };
  if (status === 'cancelled') return { icon: 'cancel', className: 'text-gray-400 border-gray-100 bg-gray-50/40' };
  return { icon: 'emergency', className: 'text-red-600 border-red-100 bg-red-50/40' };
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
    <section className="space-y-0">
      <div className="px-6 py-4">
        <SentinelSectionHeader
          title="Recent incidents"
          subtitle="Tap any event for the full timeline and guardian responses."
          action={
            <Link href="/safety/manage#history" className="text-xs font-bold text-blue-600 no-underline hover:underline">
              View all
            </Link>
          }
        />
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50/50 p-4 text-xs font-bold text-red-600 px-6">
          {error}
        </div>
      )}

      {!events && !error && (
        <div className="animate-pulse bg-gray-50/30 h-24 border-y border-gray-100" />
      )}

      {events && events.length === 0 && !error && (
        <div className="bg-white py-8 border-y border-gray-100">
          <BrowseEmptyState
            icon="health_and_safety"
            filledIcon
            title="No SOS history yet"
            description="That’s a good thing. Incidents you resolve will appear here with full recaps."
          />
        </div>
      )}

      {events && events.length > 0 && (
        <ul className="flex flex-col bg-white border-y border-gray-100">
          {events.map((e) => {
            const { icon, className } = statusIcon(e.status);
            return (
              <li key={e._id}>
                <Link
                  href={`/safety/incident/${e._id}`}
                  className="flex items-center gap-4 py-4.5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors no-underline rounded-none"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${className}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold capitalize text-gray-800">
                      {e.status.replace(/_/g, ' ')} · {e.visibilityMode}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-gray-400">
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
