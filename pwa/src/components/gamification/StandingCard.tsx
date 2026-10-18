'use client';

/**
 * Your level on the ⭐ Impact ladder (Phase 7): name, Impact, what it unlocks, and how far
 * to the next level. Real numbers from GET /gamification/stats only.
 */

import { useState } from 'react';
import { IMPACT_WAYS, LADDER, type Standing } from '@/lib/standing';

export function StandingCard({ standing }: { standing: Standing }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(Math.min(1, Math.max(0, standing.progress)) * 100);

  return (
    <section
      aria-labelledby="standing-heading"
      className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]"
    >
      <h2 id="standing-heading" className="text-sm font-bold text-muted">
        Your level
      </h2>
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green-soft text-3xl">
          {standing.emoji}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-heading text-xl font-black text-navy">{standing.name}</span>
          <span className="text-sm font-bold text-brand-green-dark">
            Level {standing.level} · ⭐ {standing.impact.toLocaleString('en-NG')} Impact
          </span>
        </span>
      </div>

      {standing.next ? (
        <div className="flex flex-col gap-1.5">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={`Progress to ${standing.next.name}`}
          >
            <div className="h-full rounded-full bg-brand-green-dark transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs font-semibold text-muted">
            {standing.next.needs.toLocaleString('en-NG')} more Impact to {standing.next.emoji} {standing.next.name}:{' '}
            {standing.next.unlock.toLowerCase()}
          </p>
        </div>
      ) : (
        <p className="text-xs font-semibold text-muted">You have reached the top of the ladder. Thank you.</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-bold text-navy transition-colors hover:bg-background"
      >
        {open ? 'Hide how levels work' : 'How levels work'}
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-navy">
            Impact grows when neighbours confirm you did something useful. It never goes down when you spend HuudCredit.
          </p>
          <ul className="flex flex-col gap-1.5">
            {IMPACT_WAYS.map((w) => (
              <li key={w.title} className="flex items-center gap-2 text-sm text-navy">
                <span aria-hidden>{w.icon}</span>
                <span className="min-w-0 flex-1">{w.title}</span>
                <span className="shrink-0 font-bold text-brand-green-dark">+{w.amount}</span>
              </li>
            ))}
          </ul>
          <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {LADDER.map((r) => {
              const mine = r.level === standing.level;
              return (
                <li key={r.level} className={`flex items-start gap-3 px-3 py-2.5 ${mine ? 'bg-green-soft' : ''}`}>
                  <span aria-hidden className="text-xl">
                    {r.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold text-navy">
                      {r.level}. {r.name}
                      {mine ? <span className="sr-only"> (you)</span> : null}
                    </span>
                    <span className="text-xs font-semibold text-muted">{r.unlock}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-muted">⭐ {r.minImpact.toLocaleString('en-NG')}</span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs font-semibold text-muted">
            A verified account a week old is at least a Neighbour. Members who joined before the new levels keep what they could already do.
          </p>
        </div>
      ) : null}
    </section>
  );
}
