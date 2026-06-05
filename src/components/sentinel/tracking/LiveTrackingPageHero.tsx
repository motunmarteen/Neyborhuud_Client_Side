'use client';

import Link from 'next/link';
import type { KidnappingTrackingSession } from '@/services/safety.service';
import { emergencyTypeLabel, isSessionLive } from '@/lib/liveTrackingFormat';

type LiveTrackingPageHeroProps = {
  session: KidnappingTrackingSession | null;
  wsConnected: boolean;
  queuedCount: number;
  isOnline: boolean;
};

export function LiveTrackingPageHero({ session, wsConnected, queuedCount, isOnline }: LiveTrackingPageHeroProps) {
  const live = isSessionLive(session);

  return (
    <div
      className={`mod-card rounded-2xl p-5 ${
        live
          ? 'ring-2 ring-brand-red/35 bg-gradient-to-br from-brand-red/12 via-[var(--neu-bg)] to-brand-red/5'
          : 'bg-gradient-to-br from-brand-red/8 via-[var(--neu-bg)] to-primary/5'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${live ? 'text-brand-red' : 'text-primary'}`}>
          <span className="material-symbols-outlined text-[32px]" aria-hidden>
            {live ? 'my_location' : 'location_searching'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-red">Live tracking</p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug" style={{ color: 'var(--neu-text)' }}>
            {live ? 'Session active — guardians can follow you' : 'High-risk continuous location sharing'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {live && session
              ? `${emergencyTypeLabel(session.emergencyType)} · ping every ${session.intervalSeconds}s${
                  session.status === 'lost_signal' ? ' · signal lost' : ''
                }`
              : 'Continuous location sharing for kidnapping and critical emergencies. Not the same as a one-tap live status check-in.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`mod-chip rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
            wsConnected ? 'mod-chip-active text-primary' : ''
          }`}
        >
          {wsConnected ? '● Realtime connected' : '○ Realtime offline'}
        </span>
        {live ? (
          <span className="mod-chip rounded-full px-3 py-1 text-[10px] font-bold uppercase text-brand-red">
            {session?.status.replace('_', ' ')}
          </span>
        ) : null}
        {!isOnline && live ? (
          <span className="mod-chip rounded-full px-3 py-1 text-[10px] font-bold text-status-warning">
            Offline · {queuedCount} queued
          </span>
        ) : null}
        {live ? (
          <Link
            href="/sos"
            className="inline-flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold text-white no-underline"
          >
            Open SOS
          </Link>
        ) : null}
      </div>
    </div>
  );
}
