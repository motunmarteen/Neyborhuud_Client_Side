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
      className={`mod-card rounded-2xl p-5 ${
        isActive
          ? 'ring-2 ring-brand-red/35 bg-gradient-to-br from-brand-red/12 via-[var(--neu-bg)] to-brand-red/5'
          : isPending
            ? 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/10 via-[var(--neu-bg)] to-amber-500/5'
            : 'bg-gradient-to-br from-brand-red/8 via-[var(--neu-bg)] to-brand-blue/6'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            isActive ? 'text-brand-red' : isPending ? 'text-primary' : 'text-brand-red'
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
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-red">
            SOS command center
          </p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug" style={{ color: 'var(--neu-text)' }}>
            {isActive
              ? 'Emergency alert is live'
              : isPending
                ? `Arming — ${secondsRemaining}s left`
                : 'Help when you need it most'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
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
              className="rounded-full border border-primary/35 bg-[var(--neu-bg)] px-4 py-2.5 text-sm font-bold text-primary"
            >
              Cancel SOS
            </button>
          ) : (
            <>
              {incidentHref ? (
                <Link
                  href={incidentHref}
                  className="mod-chip mod-chip-active inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-bold text-primary no-underline"
                >
                  View incident
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onResolve}
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
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
