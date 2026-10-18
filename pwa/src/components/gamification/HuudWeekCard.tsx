'use client';

/**
 * Huud of the Week (Phase 7, G-08): one theme for everyone, each area working towards the
 * goal together. Counts only outcomes neighbours confirmed. Areas that make it are recorded
 * and every verified helper there gets HuudCredit on Monday.
 */

import { useHuudWeek } from '@/hooks/useQuests';

export function HuudWeekCard() {
  const { data } = useHuudWeek();
  if (!data) return null;
  const { theme, area, progress, done, areasDone, reward, lastWeek, people } = data;
  const goal = theme.goal;
  const pct = Math.round(Math.min(1, progress / Math.max(1, goal)) * 100);

  return (
    <section aria-labelledby="hotw-heading" className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-green-dark">Huud of the Week</p>
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-soft text-2xl">
          {theme.emoji}
        </span>
        <div className="min-w-0">
          <h2 id="hotw-heading" className="font-heading text-lg font-black text-navy">
            {theme.title}
          </h2>
          <p className="text-sm text-navy">{theme.description}</p>
        </div>
      </div>
      {area ? (
        <div className="flex flex-col gap-1.5">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(progress, goal)}
            aria-label={`${area.lga} progress`}
          >
            <div className="h-full rounded-full bg-brand-green-dark" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm font-bold text-navy">
            {done ? `🎉 ${area.lga} did it! ` : ''}
            {Math.min(progress, goal)} of {goal} in {area.lga}
            {people ? ` · ${people} ${people === 1 ? 'neighbour' : 'neighbours'} helping` : ''}
          </p>
          <p className="text-xs font-semibold text-muted">
            If {area.lga} reaches {goal} by Sunday night, everyone verified who helped gets {reward} HuudCredit.
            {areasDone ? ` ${areasDone} ${areasDone === 1 ? 'area has' : 'areas have'} made it so far.` : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-navy">Set your home area to join in with your neighbours.</p>
      )}
      {lastWeek?.done ? (
        <p className="rounded-2xl bg-amber-soft px-3 py-2 text-xs font-bold text-navy">
          {lastWeek.emoji} Last week your area did {lastWeek.title}.
        </p>
      ) : null}
    </section>
  );
}
