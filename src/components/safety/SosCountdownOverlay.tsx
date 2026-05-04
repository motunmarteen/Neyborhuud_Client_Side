"use client";

/**
 * SosCountdownOverlay — full-screen countdown shown while an SOS is pending.
 * Provides a single, prominent Cancel action. Designed to be obviously
 * dismissible so a misfire never escalates.
 *
 * Renders nothing unless `phase === 'pending'`.
 */

import type { SosPhase } from "@/hooks/useSos";

interface Props {
  phase: SosPhase;
  secondsRemaining: number;
  visibilityMode?: "normal" | "silent";
  onCancel: () => void;
  cancelling?: boolean;
}

export default function SosCountdownOverlay({
  phase,
  secondsRemaining,
  visibilityMode = "normal",
  onCancel,
  cancelling,
}: Props) {
  if (phase !== "pending") return null;
  // Silent mode never shows visible UI — that's the entire point.
  if (visibilityMode === "silent") return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-countdown-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm px-6"
    >
      <div className="relative flex h-56 w-56 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-red-600/30 animate-ping" />
        <span className="absolute inset-2 rounded-full border-4 border-red-500/70" />
        <div className="relative flex flex-col items-center">
          <span className="text-7xl font-black tabular-nums text-red-400 drop-shadow">
            {secondsRemaining}
          </span>
          <span className="mt-1 text-xs uppercase tracking-widest text-red-200/80">
            seconds
          </span>
        </div>
      </div>

      <h2
        id="sos-countdown-title"
        className="mt-8 text-center text-2xl font-bold text-white"
      >
        SOS arming…
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-300">
        Guardians and emergency services will be alerted when the countdown ends.
        Tap Cancel if this was a mistake.
      </p>

      <button
        type="button"
        onClick={onCancel}
        disabled={cancelling}
        className="mt-8 w-full max-w-xs rounded-2xl bg-white px-6 py-4 text-lg font-bold text-red-600 shadow-lg transition-transform active:scale-95 disabled:opacity-60"
      >
        {cancelling ? "Cancelling…" : "Cancel SOS"}
      </button>

      <p className="mt-4 text-xs text-gray-500">
        No alerts have been sent yet.
      </p>
    </div>
  );
}
