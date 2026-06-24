'use client';

/**
 * GuestCountdownBanner — shown to a scoped "incognito" guest, counting down the
 * time left in their visibility window before they're auto-removed.
 */

import { useEffect, useState } from 'react';

interface GuestCountdownBannerProps {
  /** ISO timestamp when the guest's window closes. */
  expiresAt: string | Date;
}

function format(msLeft: number): string {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GuestCountdownBanner({ expiresAt }: GuestCountdownBannerProps) {
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = end - now;
  const expiring = left <= 60_000; // last minute

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold ${
        expiring ? 'bg-brand-red/10 text-brand-red' : 'bg-[#00A555]/10 text-[#00A555]'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">visibility</span>
      {left <= 0 ? (
        <span>Your time here has ended.</span>
      ) : (
        <span>
          You&apos;re a guest in this chat — <span className="tabular-nums font-bold">{format(left)}</span> left
        </span>
      )}
    </div>
  );
}
