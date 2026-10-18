'use client';

/**
 * Welcome quest (until it is paid) and today's 3 daily quests (Phase 7 step 4). Ticks only
 * come from the server, which checks the real records; there is no "I did it" button.
 */

import Link from 'next/link';
import { useQuests, type QuestStep } from '@/hooks/useQuests';

function StepRow({ s, reward, paid }: { s: QuestStep; reward?: number; paid?: boolean }) {
  return (
    <li>
      <Link href={s.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background">
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base ${s.done ? 'bg-brand-green-dark text-white' : 'bg-green-soft'}`}
        >
          {s.done ? '✓' : s.icon}
        </span>
        <span className={`min-w-0 flex-1 text-sm font-bold ${s.done ? 'text-muted line-through' : 'text-navy'}`}>
          {s.title}
          <span className="sr-only">{s.done ? ' (done)' : ' (not done yet)'}</span>
        </span>
        {reward ? (
          <span className={`shrink-0 text-sm font-black ${paid ? 'text-brand-green-dark' : 'text-[#A86F0A]'}`}>{paid ? 'Paid' : `+${reward}`}</span>
        ) : null}
      </Link>
    </li>
  );
}

export function QuestsCard() {
  const { data, isLoading, isError } = useQuests();
  if (isLoading || isError || !data) return null;
  const { welcome, daily } = data;
  const doneCount = welcome.steps.filter((s) => s.done).length;
  const dailyDone = daily.quests.filter((q) => q.done).length;

  return (
    <>
      {!welcome.paid ? (
        <section aria-labelledby="welcome-heading" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 id="welcome-heading" className="font-heading text-lg font-extrabold text-navy">
              Welcome quest
            </h2>
            <span className="text-xs font-bold text-muted">
              {doneCount} of {welcome.steps.length} · +{welcome.reward} 🪙
            </span>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
            {welcome.steps.map((s) => (
              <StepRow key={s.id} s={s} />
            ))}
          </ul>
          <p className="px-1 text-xs font-semibold text-muted">
            Finish all 5 for {welcome.reward} HuudCredit and the 🌿 Neighbour level. Ticks appear by themselves when you have done each one.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="daily-heading" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <h2 id="daily-heading" className="font-heading text-lg font-extrabold text-navy">
            Today&apos;s quests
          </h2>
          <span className="text-xs font-bold text-muted">
            {dailyDone} of {daily.quests.length}
          </span>
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          {daily.quests.map((q) => (
            <StepRow key={q.id} s={q} reward={q.reward} paid={q.paid} />
          ))}
          <li className="flex items-center gap-3 bg-amber-soft px-4 py-3">
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-base">
              🎁
            </span>
            <span className="min-w-0 flex-1 text-sm font-bold text-navy">Do all 3 today</span>
            <span className={`shrink-0 text-sm font-black ${daily.bonus.paid ? 'text-brand-green-dark' : 'text-[#A86F0A]'}`}>
              {daily.bonus.paid ? 'Paid' : `+${daily.bonus.reward}`}
            </span>
          </li>
        </ul>
        <p className="px-1 text-xs font-semibold text-muted">New quests every day at midnight. Miss one day a week and your check-in streak is kept.</p>
      </section>
    </>
  );
}
