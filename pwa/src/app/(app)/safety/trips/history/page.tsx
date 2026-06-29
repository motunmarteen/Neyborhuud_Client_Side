'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { TripsHistoryPanel } from '@/components/sentinel/trips/TripsHistoryPanel';

export const dynamic = 'force-dynamic';

function TripHistoryInner() {
  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="flex flex-col gap-3">
          <Link
            href="/safety/trips"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Safe trips
          </Link>
          <Link
            href="/safety/trips#start"
            className="mod-chip mod-chip-active inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New trip
          </Link>
        </div>
      }
    >
      <TripsHistoryPanel />
    </AppBrowseLayout>
  );
}

export default function TripHistoryPage() {
  return (
    <Suspense>
      <TripHistoryInner />
    </Suspense>
  );
}
