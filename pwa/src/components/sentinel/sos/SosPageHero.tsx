'use client';

import Link from 'next/link';
import type { SosPhase } from '@/hooks/useSos';

type SosPageHeroProps = {
  phase: SosPhase;
  secondsRemaining?: number;
  escalationLevel?: number;
  incidentHref?: string;
  onCancel?: () => void;
  onResolve?: () => void;
};

export function SosPageHero({
  phase,
  secondsRemaining = 0,
  escalationLevel = 0,
  incidentHref,
  onCancel,
  onResolve,
}: SosPageHeroProps) {
  const isActive = phase === 'active';
  const isPending = phase === 'pending';

  return (
    <div
      className={`rounded-none border-b border-gray-100 p-6 shadow-none ${
        isActive
          ? 'bg-gradient-to-br from-red-50/70 via-white to-red-50/20 border-red-100'
          : isPending
            ? 'bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 border-blue-100'
            : 'bg-gradient-to-br from-red-50/40 via-white to-blue-50/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-gray-150/40 ${
            isActive ? 'text-red-600' : isPending ? 'text-blue-600' : 'text-red-600'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[32px] ${isPending ? 'animate-pulse' : ''}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {isActive ? 'emergency_home' : isPending ? 'timer' : 'sos'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-600">
            SOS command center
          </p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug text-gray-800">
            {isActive
              ? 'Emergency alert is live'
              : isPending
                ? `Arming — ${secondsRemaining}s left`
                : 'Help when you need it most'}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {isActive
              ? `Guardians notified · Escalation ${escalationLevel}. Mark safe when you are out of danger.`
              : isPending
                ? 'Cancel now if this was accidental. After countdown, your circle is alerted.'
                : 'Arm SOS with a countdown, practice with a drill, or long-press the red tab for silent alert.'}
          </p>
        </div>
      </div>

      {(isActive || isPending) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {isPending ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-blue-200 bg-white px-5 py-2.5 text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-50/45 transition-colors"
            >
              Cancel SOS
            </button>
          ) : (
            <>
              {incidentHref ? (
                <Link
                  href={incidentHref}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 no-underline"
                >
                  View incident
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onResolve}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-colors"
              >
                I&apos;m safe now
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
