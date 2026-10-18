'use client';

/**
 * Your 16 badges (Phase 7, G-12): earned ones in colour, the rest with how far you are.
 * Badges from before the change are kept as "Legacy".
 */

import { useMyBadges } from '@/hooks/usePhase7';

export function BadgesCard() {
  const { data } = useMyBadges();
  if (!data) return null;
  const earned = data.badges.filter((b) => b.earned).length;

  return (
    <section id="badges" aria-labelledby="badges-heading" className="flex scroll-mt-24 flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="badges-heading" className="font-heading text-lg font-extrabold text-navy">
          Badges
        </h2>
        <span className="text-xs font-bold text-muted">
          {earned} of {data.badges.length}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.badges.map((b) => {
          const pct = Math.round((Math.min(b.progress, b.goal) / Math.max(1, b.goal)) * 100);
          return (
            <li
              key={b.id}
              className={`flex flex-col gap-1.5 rounded-2xl p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${b.earned ? 'bg-white' : 'bg-white/70'}`}
            >
              <span aria-hidden className={`text-2xl ${b.earned ? '' : 'opacity-40 grayscale'}`}>
                {b.emoji}
              </span>
              <span className={`text-sm font-bold ${b.earned ? 'text-navy' : 'text-muted'}`}>
                {b.name}
                <span className="sr-only">{b.earned ? ' (earned)' : ` (${b.progress} of ${b.goal})`}</span>
              </span>
              <span className="text-xs font-semibold leading-snug text-muted">{b.description}</span>
              {!b.earned && b.goal > 1 ? (
                <span aria-hidden className="mt-auto h-1.5 overflow-hidden rounded-full bg-background">
                  <span className="block h-full rounded-full bg-brand-green-dark" style={{ width: `${pct}%` }} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {data.legacy.length ? (
        <details className="rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <summary className="cursor-pointer text-sm font-bold text-navy">Legacy badges ({data.legacy.length})</summary>
          <p className="mt-1 text-xs font-semibold text-muted">From before the new badges. You keep them.</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {data.legacy.map((b) => (
              <li key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-navy">
                <span aria-hidden>{b.emoji}</span>
                {b.name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
