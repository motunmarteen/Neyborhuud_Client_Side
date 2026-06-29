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
        className="rounded-none border-y border-gray-100 bg-white px-6 py-5 shadow-none no-underline transition-colors hover:bg-gray-50 flex items-center gap-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
          <span className="material-symbols-outlined text-[24px]">verified_user</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800">
            Panic PIN active
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Your duress code can silently trigger SOS. Tap to manage.
          </p>
        </div>
        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
      </Link>
    );
  }

  return (
    <Link
      href="/safety/panic-pin"
      className="rounded-none border-y border-red-100 bg-red-50/20 px-6 py-5 shadow-none no-underline transition-colors hover:bg-red-50/30 flex items-center gap-4"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-red-100 text-red-600">
        <span className="material-symbols-outlined text-[24px]">pin</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-red-600">Set up your Panic PIN</p>
        <p className="text-xs text-red-500 mt-0.5">
          A code that looks like unlock but triggers silent SOS in the background.
        </p>
      </div>
      <span className="material-symbols-outlined text-red-600">chevron_right</span>
    </Link>
  );
}
