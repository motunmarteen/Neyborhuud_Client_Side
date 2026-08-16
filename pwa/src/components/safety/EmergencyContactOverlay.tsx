'use client';

/**
 * EmergencyContactOverlay — full-screen, unmissable overlay shown when the
 * automatic guardian-no-response SOS escalation has no automated agency
 * dispatch to fall back on (see backend ADR-0003:
 * emergency-dispatch-client-initiated-contact). The app has no unified
 * emergency-dispatch API to call in Nigeria, so instead of pretending
 * something was dispatched, it hands the user real police contact numbers
 * and a pre-filled message so THEY can call or text with one tap.
 *
 * Mounted globally (see Providers) so it appears no matter which page the
 * user is on when the escalation fires — this is the last line of defense,
 * it must not depend on being on a particular safety screen to show up.
 */

import { useSos } from '@/hooks/useSos';

export default function EmergencyContactOverlay() {
  const { emergencyContactNeeded, dismissEmergencyContactNeeded } = useSos();

  if (!emergencyContactNeeded) return null;

  const { options, smsMessage } = emergencyContactNeeded;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-contact-title"
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-6 py-8 overflow-y-auto"
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <span className="material-symbols-outlined text-6xl text-brand-red" aria-hidden>
            emergency
          </span>
        </div>

        <h2
          id="emergency-contact-title"
          className="mt-4 text-center text-xl font-bold text-white"
        >
          Your guardians haven&apos;t responded
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--neu-text-muted)]">
          Contact the Nigeria Police Force directly — tap a button below to call or text
          with your emergency details already filled in.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {options.map((opt) => (
            <a
              key={opt.number}
              href={
                opt.method === 'call'
                  ? `tel:${opt.number}`
                  : `sms:${opt.number}?body=${encodeURIComponent(smsMessage)}`
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-bold text-brand-red shadow-lg transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                {opt.method === 'call' ? 'call' : 'sms'}
              </span>
              {opt.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={dismissEmergencyContactNeeded}
          className="mt-6 w-full rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors active:bg-white/10"
        >
          I&apos;ve made contact / dismiss
        </button>

        <p className="mt-4 text-center text-xs text-[var(--neu-text-muted)]">
          No automated dispatch was sent — these buttons open your phone&apos;s own
          call/text app.
        </p>
      </div>
    </div>
  );
}
