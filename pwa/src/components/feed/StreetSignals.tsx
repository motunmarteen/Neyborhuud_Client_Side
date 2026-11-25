'use client';

/**
 * "Wetin dey happen?" in one slim row (owner 2026-11-25, home rework): light, fuel, water and
 * waste, roads, gate, cash. Tap one, pick what you see, and your neighbours get it.
 * Replaces the tall Street Pulse box, which covered the map and showed a made-up light report.
 * Shows nothing that a neighbour has not really sent, and promises no reward it does not pay.
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { signalsIn, useQuickSignal, type SignalCategory } from '@/hooks/useQuickSignal';
import { useTranslation } from '@/lib/i18n';

const CHANNELS: { id: SignalCategory; emoji: string }[] = [
  { id: 'power', emoji: '💡' },
  { id: 'traffic', emoji: '🚗' },
  { id: 'safety', emoji: '🛡️' },
  { id: 'fuel', emoji: '⛽' },
  { id: 'water_waste', emoji: '💧' },
  { id: 'essentials', emoji: '💵' },
];

export function StreetSignals({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { send, submittingId } = useQuickSignal();
  const [open, setOpen] = useState<SignalCategory | null>(null);

  return (
    <>
      <div
        role="group"
        aria-label={t('home.signals.title')}
        className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`.trim()}
        style={{ touchAction: 'pan-x' }}
      >
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpen(c.id)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy transition-colors hover:bg-background"
          >
            <span aria-hidden>{c.emoji}</span>
            {t(`home.signals.${c.id}`)}
          </button>
        ))}
      </div>

      <AppBottomSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? t(`home.signals.${open}`) : t('home.signals.title')}
        description={t('home.signals.body')}
      >
        <div className="flex flex-col gap-2 pb-2">
          {(open ? signalsIn(open) : []).map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={submittingId !== null}
              onClick={async () => {
                if (await send(s)) setOpen(null);
              }}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-background px-4 py-2.5 text-left transition-colors hover:bg-[#E6EAF0] disabled:opacity-60"
            >
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold text-navy">{s.label}</span>
                <span className="block text-[13px] text-muted">{s.sub}</span>
              </span>
              {submittingId === s.id ? <Loader2 size={18} className="shrink-0 text-muted motion-safe:animate-spin" aria-hidden /> : null}
            </button>
          ))}
        </div>
      </AppBottomSheet>
    </>
  );
}
