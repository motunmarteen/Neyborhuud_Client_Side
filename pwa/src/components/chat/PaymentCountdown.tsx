'use client';

/**
 * PaymentCountdown — live mm:ss timer on an accepted deal card, ticking down to
 * the moment the backend sweep auto-cancels an unpaid order.
 *
 * At zero it flips to an explicit expired state rather than sitting at 00:00 or
 * going negative. The actual cancellation still arrives as a system message
 * from the server sweep — this only makes the deadline legible while it runs.
 */

import { useEffect, useState } from 'react';

function remainingMs(deadline: string | undefined): number {
  if (!deadline) return 0;
  const ts = new Date(deadline).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, ts - Date.now());
}

function format(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PaymentCountdown({
  expiresAt,
  className = '',
}: {
  expiresAt?: string;
  className?: string;
}) {
  const [left, setLeft] = useState(() => remainingMs(expiresAt));

  useEffect(() => {
    setLeft(remainingMs(expiresAt));
    if (!expiresAt) return;
    const id = setInterval(() => {
      const next = remainingMs(expiresAt);
      setLeft(next);
      if (next <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const expired = left <= 0;
  // Under two minutes the deadline stops being informational and starts being
  // urgent, so it changes colour rather than only shrinking.
  const urgent = !expired && left <= 2 * 60 * 1000;

  return (
    <div
      className={`mt-2 flex items-center gap-2 rounded-xl border p-2.5 ${
        expired
          ? 'border-gray-200 bg-gray-50'
          : urgent
            ? 'border-red-200 bg-red-50'
            : 'border-amber-100 bg-amber-50'
      } ${className}`}
      role="timer"
      aria-live={urgent || expired ? 'polite' : 'off'}
    >
      <span className="text-base" aria-hidden>
        {expired ? '⌛' : '⏳'}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[10px] font-bold uppercase tracking-wide ${
            expired ? 'text-gray-500' : urgent ? 'text-red-700' : 'text-amber-700'
          }`}
        >
          {expired ? 'Payment window closed' : 'Pay within'}
        </p>
        <p
          className={`text-sm font-extrabold tabular-nums ${
            expired ? 'text-gray-600' : urgent ? 'text-red-700' : 'text-amber-800'
          }`}
        >
          {expired ? 'Expired' : format(left)}
        </p>
      </div>
    </div>
  );
}
