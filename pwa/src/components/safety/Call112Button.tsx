'use client';

/**
 * "Call 112" — the one emergency number, as one big tap (owner 2026-11-27). Opens the phone's
 * dialer with 112 filled in; nothing is called until the person presses call.
 */

import { EMERGENCY_NUMBER, EMERGENCY_TEL } from '@/lib/emergency';

export function Call112Button({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <a
      href={EMERGENCY_TEL}
      className={`flex items-center gap-3 rounded-[22px] bg-brand-red text-white shadow-[0_4px_14px_rgba(229,72,77,0.3)] transition-transform active:scale-[0.98] ${
        compact ? 'min-h-12 px-4' : 'min-h-[64px] px-4 py-3'
      } ${className}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20" aria-hidden>
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[17px] font-extrabold leading-tight">Call {EMERGENCY_NUMBER}</span>
        {compact ? null : (
          <span className="block text-[13px] font-semibold text-white/90">Free emergency line: police, fire, ambulance, road</span>
        )}
      </span>
    </a>
  );
}
