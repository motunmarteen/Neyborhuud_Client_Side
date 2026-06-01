'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { safetyService } from '@/services/safety.service';

export function SosPanicPinBanner() {
  const [pinSet, setPinSet] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getPanicPinStatus()
      .then((res) => {
        if (!cancelled) setPinSet(Boolean(res?.data?.panicPinSet));
      })
      .catch(() => {
        if (!cancelled) setPinSet(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pinSet === null) return null;

  if (pinSet) {
    return (
      <Link
        href="/safety/panic-pin"
        className="mod-card flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 no-underline transition-colors hover:bg-primary/10"
      >
        <div className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary">
          <span className="material-symbols-outlined text-[24px]">verified_user</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            Panic PIN active
          </p>
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            Your duress code can silently trigger SOS. Tap to manage.
          </p>
        </div>
        <span className="material-symbols-outlined text-primary">chevron_right</span>
      </Link>
    );
  }

  return (
    <Link
      href="/safety/panic-pin"
      className="mod-card flex items-center gap-3 rounded-2xl border border-brand-red/25 bg-brand-red/8 p-4 no-underline transition-colors hover:bg-brand-red/12"
    >
      <div className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-brand-red">
        <span className="material-symbols-outlined text-[24px]">pin</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-red">Set up your Panic PIN</p>
        <p className="text-xs text-brand-red/80">
          A code that looks like unlock but triggers silent SOS in the background.
        </p>
      </div>
      <span className="material-symbols-outlined text-brand-red">chevron_right</span>
    </Link>
  );
}
