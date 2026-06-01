'use client';

import { useState } from 'react';
import type { UseSosReturn } from '@/hooks/useSos';
import { useSosDrill } from '@/components/sentinel/sos/useSosDrill';

type SosTriggerCardProps = {
  sos: UseSosReturn;
};

export function SosTriggerCard({ sos }: SosTriggerCardProps) {
  const drill = useSosDrill();
  const [silent, setSilent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyServices, setEmergencyServices] = useState(false);

  if (sos.phase !== 'idle') return null;

  const disabled = sos.loading || drill.running;

  const handleTrigger = () => {
    if (disabled) return;
    void sos.triggerSos({
      silent,
      countdownSeconds: silent ? 0 : countdown,
      emergencyServicesEnabled: emergencyServices,
    });
  };

  return (
    <div className="mod-card space-y-5 rounded-2xl p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-red">Trigger SOS</p>

      {drill.running && (
        <div className="mod-card rounded-2xl border border-brand-blue/25 bg-brand-blue/8 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-blue">
            Drill mode — no real alert
          </p>
          <p className="my-2 text-5xl font-black tabular-nums text-brand-blue">{drill.seconds}</p>
          <button
            type="button"
            onClick={drill.stop}
            className="mod-chip px-4 py-2 text-sm font-semibold text-brand-blue"
          >
            Stop drill
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleTrigger}
        disabled={disabled}
        className="relative mx-auto flex aspect-square w-full max-w-[240px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-red-700 text-white shadow-[0_8px_32px_rgba(220,38,38,0.45)] transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
        aria-label="Trigger SOS"
      >
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand-red/25" />
        <span className="material-symbols-outlined relative mb-1 text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          sos
        </span>
        <span className="relative text-lg font-black uppercase tracking-widest">
          {silent ? 'Silent SOS' : 'Trigger SOS'}
        </span>
        {!silent && (
          <span className="relative mt-1 text-[11px] font-semibold opacity-90">
            {countdown}s countdown
          </span>
        )}
      </button>

      <div className="space-y-3">
        <label className="mod-inset flex cursor-pointer items-start gap-3 rounded-xl p-3">
          <input
            type="checkbox"
            checked={silent}
            onChange={(e) => setSilent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-red"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              <span className="material-symbols-outlined text-[18px] text-brand-red">visibility_off</span>
              Silent mode
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
              No on-screen feedback. Fires immediately — use under duress or long-press the bottom nav SOS tab.
            </span>
          </span>
        </label>

        {!silent && (
          <div className="mod-inset rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                Countdown
              </span>
              <span className="text-sm font-bold tabular-nums text-brand-red">{countdown}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={countdown}
              onChange={(e) => setCountdown(Number(e.target.value))}
              aria-label="Countdown seconds"
              className="w-full accent-brand-red"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              Time to cancel before guardians are alerted (0 = instant).
            </p>
          </div>
        )}

        <label className="mod-inset flex cursor-pointer items-start gap-3 rounded-xl p-3">
          <input
            type="checkbox"
            checked={emergencyServices}
            onChange={(e) => setEmergencyServices(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-red"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              <span className="material-symbols-outlined text-[18px] text-brand-blue">local_police</span>
              Notify emergency services
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
              Auto-dispatch to police or medical when SOS activates.
            </span>
          </span>
        </label>

        <button
          type="button"
          onClick={() => drill.start(5)}
          disabled={drill.running}
          className="mod-card flex w-full items-start gap-3 rounded-2xl border border-brand-blue/20 p-3 text-left transition-colors hover:bg-brand-blue/5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-brand-blue">fitness_center</span>
          <span>
            <span className="text-sm font-bold text-brand-blue">Run a drill</span>
            <span className="mt-0.5 block text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              Practice the countdown without alerting anyone.
            </span>
          </span>
        </button>

        {sos.error && (
          <div className="mod-card flex items-start justify-between gap-2 rounded-2xl border border-brand-red/30 bg-brand-red/8 p-3 text-sm text-brand-red">
            <span>{sos.error}</span>
            <button type="button" onClick={sos.clearError} className="shrink-0 text-xs font-semibold underline">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
