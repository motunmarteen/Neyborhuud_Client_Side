'use client';

import { useState } from 'react';
import type { UseSosReturn } from '@/hooks/useSos';
import { useSosDrill } from '@/components/sentinel/sos/useSosDrill';

type SosTriggerCardProps = {
  sos: UseSosReturn;
};

export function SosTriggerCard({ sos }: SosTriggerCardProps) {
  const drill = useSosDrill();
  const [showSettings, setShowSettings] = useState(false);
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
    <div className="rounded-none border-b border-gray-100 p-6 bg-white space-y-6 shadow-none">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-600">Trigger SOS</p>

      {drill.running && (
        <div className="border-b border-blue-100 bg-blue-50/20 py-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
            Drill mode — no real alert
          </p>
          <p className="my-2 text-5xl font-black tabular-nums text-blue-600">{drill.seconds}</p>
          <button
            type="button"
            onClick={drill.stop}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors"
          >
            Stop drill
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleTrigger}
        disabled={disabled}
        className="relative mx-auto flex aspect-square w-full max-w-[200px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[0_8px_32px_rgba(220,38,38,0.3)] transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
        aria-label="Trigger SOS"
      >
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-red-600/25" />
        <span className="material-symbols-outlined relative mb-1 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          sos
        </span>
        <span className="relative text-base font-black uppercase tracking-widest">
          {silent ? 'Silent SOS' : 'Trigger SOS'}
        </span>
        {!silent && (
          <span className="relative mt-0.5 text-[10px] font-semibold opacity-90">
            {countdown}s countdown
          </span>
        )}
      </button>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
          {showSettings ? 'Hide Settings' : 'Configure SOS'}
        </button>
      </div>

      {showSettings && (
        <div className="space-y-0 pt-2 divide-y divide-gray-100/60">
          <label className="py-4 flex cursor-pointer items-start gap-3 bg-white transition-all">
            <input
              type="checkbox"
              checked={silent}
              onChange={(e) => setSilent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <span className="material-symbols-outlined text-[18px] text-red-600">visibility_off</span>
                Silent mode
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">
                No on-screen feedback. Fires immediately — use under duress or long-press the bottom nav SOS tab.
              </span>
            </span>
          </label>

          {!silent && (
            <div className="py-4 bg-white">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">
                  Countdown
                </span>
                <span className="text-sm font-bold tabular-nums text-red-600">{countdown}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={countdown}
                onChange={(e) => setCountdown(Number(e.target.value))}
                aria-label="Countdown seconds"
                className="w-full accent-red-600"
              />
              <p className="mt-1 text-xs text-gray-400">
                Time to cancel before guardians are alerted (0 = instant).
              </p>
            </div>
          )}

          <label className="py-4 flex cursor-pointer items-start gap-3 bg-white transition-all">
            <input
              type="checkbox"
              checked={emergencyServices}
              onChange={(e) => setEmergencyServices(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <span className="material-symbols-outlined text-[18px] text-blue-600">local_police</span>
                Notify emergency services
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">
                Auto-dispatch to police or medical when SOS activates.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => drill.start(5)}
            disabled={drill.running}
            className="flex w-full items-start gap-3 py-4 text-left transition-all bg-white hover:bg-gray-50/30 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-blue-600">fitness_center</span>
            <span>
              <span className="text-sm font-bold text-blue-600">Run a drill</span>
              <span className="mt-0.5 block text-xs text-gray-400">
                Practice the countdown without alerting anyone.
              </span>
            </span>
          </button>

          {sos.error && (
            <div className="flex items-start justify-between gap-2 py-4 text-xs font-bold text-red-600">
              <span>{sos.error}</span>
              <button type="button" onClick={sos.clearError} className="shrink-0 text-xs font-bold underline">
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
