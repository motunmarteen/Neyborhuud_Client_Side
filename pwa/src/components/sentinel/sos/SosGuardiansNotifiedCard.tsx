'use client';

import Link from 'next/link';
import type { SosNotifyMeta } from '@/contexts/SosContext';

type SosGuardiansNotifiedCardProps = {
  notifyMeta: SosNotifyMeta | null;
  phase: 'idle' | 'pending' | 'active' | 'resolved' | 'cancelled';
};

export function SosGuardiansNotifiedCard({ notifyMeta, phase }: SosGuardiansNotifiedCardProps) {
  if (!notifyMeta || phase === 'idle') return null;

  const { guardiansTotal, emergencyId, sosEventId } = notifyMeta;
  const noneQueued = guardiansTotal === 0;

  return (
    <div
      className={`rounded-none border-y px-6 py-5 shadow-none ${
        noneQueued ? 'border-amber-100 bg-amber-50/20' : 'border-blue-100 bg-blue-50/20'
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600">
        Guardian sharing
      </p>
      {noneQueued ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-600 font-semibold">
          No accepted guardians were queued. Add trusted contacts under Prepare so people get your
          location when SOS fires.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-gray-800">
          Your location and SOS status are being shared with{' '}
          <strong>{guardiansTotal}</strong> guardian{guardiansTotal === 1 ? '' : 's'}.
          {phase === 'pending'
            ? ' They are notified when the countdown ends (unless you cancel).'
            : ' They can open the alert, view your map pin, and tap “I’m responding.”'}
        </p>
      )}
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href="/safety/manage#guardians"
          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50/45 transition-colors no-underline shadow-sm"
        >
          Manage guardians
        </Link>
        {sosEventId && phase !== 'pending' ? (
          <Link
            href={`/safety/incident/${sosEventId}`}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors no-underline"
          >
            See who responded
          </Link>
        ) : null}
        {emergencyId ? (
          <Link
            href="/safety/emergency"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors no-underline shadow-sm"
          >
            Emergency record
          </Link>
        ) : null}
      </div>
    </div>
  );
}
