'use client';

import Link from 'next/link';
import type { Trip } from '@/services/trip.service';
import { fmtTripDate, isLiveTripStatus } from '@/components/sentinel/trips/tripsFormat';

type TripsPageHeroProps = {
  trip: Trip | null;
  tracking: boolean;
  checkInCountdown: number | null;
  autoSosTriggered: boolean;
};

export function TripsPageHero({ trip, tracking, checkInCountdown, autoSosTriggered }: TripsPageHeroProps) {
  const live = trip && isLiveTripStatus(trip.status);
  const escalated = (trip?.escalationLevel ?? 0) > 0;
  const dueSoon = checkInCountdown !== null && checkInCountdown <= 120;

  return (
    <div
      className={`mod-card rounded-2xl p-5 ${
        autoSosTriggered
          ? 'ring-2 ring-brand-red/40 bg-gradient-to-br from-brand-red/12 via-[var(--neu-bg)] to-brand-red/5'
          : live
            ? escalated
              ? 'ring-2 ring-amber-500/35 bg-gradient-to-br from-amber-500/10 via-[var(--neu-bg)] to-primary/5'
              : 'ring-2 ring-primary/25 bg-gradient-to-br from-primary/10 via-[var(--neu-bg)] to-brand-blue/5'
            : 'bg-gradient-to-br from-primary/8 via-[var(--neu-bg)] to-brand-blue/6'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary">
          <span className="material-symbols-outlined text-[32px]" aria-hidden>
            {autoSosTriggered ? 'emergency' : live ? 'route' : 'add_location_alt'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Safe trips</p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug" style={{ color: 'var(--neu-text)' }}>
            {autoSosTriggered
              ? 'SOS linked to this trip'
              : live
                ? trip?.pausedAt
                  ? 'Trip paused'
                  : 'Trip in progress'
                : 'Plan a journey with guardians'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {autoSosTriggered
              ? 'Silent SOS may have fired from missed check-ins. Check in if you are safe or open SOS status.'
              : live && trip
                ? `${trip.originText} → ${trip.destinationText}. ${tracking ? 'Live GPS' : 'GPS idle'} · next check-in ${dueSoon ? 'due soon' : 'on schedule'}.`
                : 'Plan a journey and share live progress with guardians. Start a trip, check in on schedule, and mark arrived when you reach.'}
          </p>
        </div>
      </div>

      {live && trip && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="mod-chip mod-chip-active rounded-full px-3 py-1.5 text-xs font-bold text-primary">
            {trip.status}
          </span>
          {trip.expectedArrival ? (
            <span className="mod-chip rounded-full px-3 py-1.5 text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
              ETA {fmtTripDate(trip.expectedArrival)}
            </span>
          ) : null}
          {autoSosTriggered ? (
            <Link
              href="/sos"
              className="inline-flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold text-white no-underline"
            >
              Open SOS
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
