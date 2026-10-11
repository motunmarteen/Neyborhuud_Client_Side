'use client';

/**
 * Rewards (owner decision 2026-10-11, tracker F-15e): only real things.
 *
 * The old page invented a "Bronze IV" level, a VIP tab, "₦500 claimable", rakeback and
 * promo codes that "redeemed" HuudCredit without the server. This page shows the real
 * balance and streak from GET /gamification/stats, the real ways to earn (amounts from the
 * server rules), and says plainly that quests, levels and spending come later (Phase 7).
 */

import Link from 'next/link';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

// Amounts the server really pays today (checked against the server rules).
const WAYS_TO_EARN: { icon: string; title: string; detail: string; amount: string }[] = [
  { icon: '📅', title: 'Check in every day', detail: 'More on long streaks', amount: '10+' },
  { icon: '🔎', title: 'Return a lost item', detail: 'After the owner confirms with the code', amount: '50' },
  { icon: '🙌🏾', title: 'Help someone find their item', detail: 'When they thank you for the tip', amount: '10' },
  { icon: '📊', title: 'Post a poll 10 neighbours vote on', detail: 'Once per poll', amount: '2' },
  { icon: '↗️', title: 'Share a post outside the app', detail: 'Up to a daily limit', amount: '5' },
  { icon: '✉️', title: 'Verify your email', detail: 'Once', amount: '10' },
];

export default function RewardsPage() {
  const { data: stats, isLoading, isError, refetch } = useMyGamificationStats();
  const balance: number | undefined = stats?.totalHuudCoins;
  const streak: number | undefined = stats?.streak;

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        {/* Balance: real numbers only; never a made-up fallback */}
        <section aria-labelledby="balance-heading" className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <h2 id="balance-heading" className="text-sm font-bold text-muted">
            Your HuudCredit
          </h2>
          {isLoading ? (
            <Skeleton className="h-10 w-40 rounded-full" />
          ) : isError || balance == null ? (
            <ErrorState onRetry={() => void refetch()} homeHref={null} className="!px-0 !py-2" />
          ) : (
            <p className="flex items-center gap-2 font-heading text-4xl font-black text-navy">
              <span aria-hidden>🪙</span>
              {balance.toLocaleString('en-NG')}
            </p>
          )}
          {typeof streak === 'number' && streak > 0 ? (
            <p className="text-sm font-bold text-brand-green-dark">🔥 {streak}-day check-in streak</p>
          ) : null}
          <Link
            href="/huud-economy/wallet?tab=transactions"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-[15px] font-bold text-navy transition-colors hover:bg-background"
          >
            See your history
          </Link>
        </section>

        {/* Ways to earn: amounts the server really pays */}
        <section aria-labelledby="earn-heading" className="flex flex-col gap-2">
          <h2 id="earn-heading" className="px-1 font-heading text-lg font-extrabold text-navy">
            How to earn HuudCredit
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
            {WAYS_TO_EARN.map((w) => (
              <li key={w.title} className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-lg">
                  {w.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-navy">{w.title}</span>
                  <span className="text-xs font-semibold text-muted">{w.detail}</span>
                </span>
                <span className="shrink-0 font-heading text-base font-black text-[#A86F0A]">+{w.amount}</span>
              </li>
            ))}
          </ul>
          <p className="px-1 text-xs font-semibold text-muted">
            HuudCredit rewards helping your neighbours, not noise. It cannot be changed to naira.
          </p>
        </section>

        {/* Honest about what is not here yet */}
        <section className="flex flex-col gap-1 rounded-[22px] bg-amber-soft p-4">
          <h2 className="font-heading text-base font-extrabold text-navy">Coming soon</h2>
          <p className="text-sm text-navy">
            Weekly quests, levels, Area Champion, and things to spend HuudCredit on (map skins, shout-outs, billboards).
          </p>
        </section>
      </main>
    </div>
  );
}
