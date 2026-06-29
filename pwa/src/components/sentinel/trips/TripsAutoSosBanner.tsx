'use client';

import Link from 'next/link';

type TripsAutoSosBannerProps = {
  onCheckIn: () => void;
};

export function TripsAutoSosBanner({ onCheckIn }: TripsAutoSosBannerProps) {
  return (
    <div className="mod-card animate-pulse rounded-2xl border-2 border-brand-red/50 bg-brand-red/10 p-4 ring-2 ring-brand-red/20">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-red" style={{ fontSize: '22px' }}>
          emergency
        </span>
        <p className="text-sm font-bold text-brand-red">SOS activated automatically</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
        A silent SOS was triggered after multiple missed check-ins. Your guardians receive trip details and your last
        known location. Check in if you are safe.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCheckIn}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          I&apos;m safe — check in
        </button>
        <Link
          href="/sos"
          className="inline-flex items-center rounded-full bg-brand-red px-4 py-2.5 text-sm font-bold text-white no-underline"
        >
          View SOS status
        </Link>
      </div>
    </div>
  );
}
