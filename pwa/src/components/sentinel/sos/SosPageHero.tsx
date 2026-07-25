'use client';

import Link from 'next/link';
import type { SosPhase } from '@/hooks/useSos';
import type { SosQueueStatus } from '@/hooks/useSosOfflineQueue';

type SosPageHeroProps = {
  phase: SosPhase;
  secondsRemaining?: number;
  escalationLevel?: number;
  incidentHref?: string;
  offlineQueueStatus?: SosQueueStatus;
  /** A silent SOS must not visibly announce itself — no red styling, no "alert is live" copy. */
  visibilityMode?: 'normal' | 'silent';
  onCancel?: () => void;
  onResolve?: () => void;
};

const OFFLINE_BANNER: Record<'queued' | 'sending' | 'failed', { icon: string; text: string; className: string }> = {
  queued: {
    icon: 'cloud_off',
    text: 'No connection — SOS saved and will send automatically the moment you’re back online.',
    className: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  sending: {
    icon: 'sync',
    text: 'Back online — sending your queued SOS now…',
    className: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  failed: {
    icon: 'error',
    text: 'Still couldn’t reach the server. Your SOS stays saved and will keep retrying.',
    className: 'bg-red-50 border-red-200 text-red-800',
  },
};

export function SosPageHero({
  phase,
  secondsRemaining = 0,
  escalationLevel = 0,
  incidentHref,
  offlineQueueStatus,
  visibilityMode = 'normal',
  onCancel,
  onResolve,
}: SosPageHeroProps) {
  const isActive = phase === 'active';
  const isPending = phase === 'pending';
  const isSilent = isActive && visibilityMode === 'silent';
  const offlineBanner =
    offlineQueueStatus && offlineQueueStatus in OFFLINE_BANNER
      ? OFFLINE_BANNER[offlineQueueStatus as 'queued' | 'sending' | 'failed']
      : null;

  return (
    <div
      className={`rounded-none border-b border-gray-100 p-6 shadow-none ${
        isSilent
          ? 'bg-white'
          : isActive
            ? 'bg-gradient-to-br from-red-50/70 via-white to-red-50/20 border-red-100'
            : isPending
              ? 'bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 border-blue-100'
              : 'bg-gradient-to-br from-red-50/40 via-white to-blue-50/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-gray-150/40 ${
            isSilent ? 'text-gray-500' : isActive ? 'text-red-600' : isPending ? 'text-blue-600' : 'text-red-600'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[32px] ${isPending ? 'animate-pulse' : ''}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {isSilent ? 'check_circle' : isActive ? 'emergency_home' : isPending ? 'timer' : 'sos'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${isSilent ? 'text-gray-500' : 'text-red-600'}`}>
            {isSilent ? 'Status' : 'SOS command center'}
          </p>
          <h1 className="mt-1 text-lg font-extrabold leading-snug text-gray-800">
            {isSilent
              ? 'Everything is set'
              : isActive
                ? 'Emergency alert is live'
                : isPending
                  ? `Arming — ${secondsRemaining}s left`
                  : 'Help when you need it most'}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {isSilent
              ? 'Tap below whenever you’re ready to close this out.'
              : isActive
                ? `Guardians notified · Escalation ${escalationLevel}. Mark safe when you are out of danger.`
                : isPending
                  ? 'Cancel now if this was accidental. After countdown, your circle is alerted.'
                  : 'Arm SOS with a countdown, practice with a drill, or long-press the red tab for silent alert.'}
          </p>
        </div>
      </div>

      {offlineBanner && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold leading-snug ${offlineBanner.className}`}
          role="status"
        >
          <span
            className={`material-symbols-outlined text-[18px] shrink-0 ${offlineQueueStatus === 'sending' ? 'animate-spin' : ''}`}
            aria-hidden
          >
            {offlineBanner.icon}
          </span>
          <span>{offlineBanner.text}</span>
        </div>
      )}

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
                  className={`inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 no-underline ${
                    isSilent
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isSilent ? 'Details' : 'View incident'}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onResolve}
                className={`rounded-full px-5 py-2.5 text-xs font-bold shadow-sm transition-colors ${
                  isSilent ? 'bg-gray-800 hover:bg-gray-900 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isSilent ? 'Done' : "I'm safe now"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
