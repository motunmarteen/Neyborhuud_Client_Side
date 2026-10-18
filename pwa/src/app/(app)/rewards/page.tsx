'use client';

/**
 * Rewards (owner decision 2026-10-11, tracker F-15e): only real things.
 *
 * The old page invented a "Bronze IV" level, a VIP tab, "₦500 claimable", rakeback and
 * promo codes that "redeemed" HuudCredit without the server. This page shows the real
 * balance and streak from GET /gamification/stats, the real ways to earn (amounts from the
 * server rules) and your level on the ⭐ Impact ladder (Phase 7, 2026-10-18).
 */

import Link from 'next/link';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { StandingCard } from '@/components/gamification/StandingCard';
import { AreaBoard } from '@/components/gamification/AreaBoard';
import { QuestsCard } from '@/components/gamification/QuestsCard';
import { HuudWeekCard } from '@/components/gamification/HuudWeekCard';
import { BadgesCard } from '@/components/gamification/BadgesCard';
import { MissionsCard } from '@/components/gamification/MissionsCard';
import type { Standing } from '@/lib/standing';

// Amounts and daily limits the server really pays (checked against the server's award
// calls and huudcoin.ledger DAILY_CAPS). Phase 7 (2026-10-18): no coins for raw posts,
// comments or likes; invites pay when the friend becomes active.
const WAYS_TO_EARN: { icon: string; title: string; detail: string; amount: string }[] = [
  { icon: '📅', title: 'Check in every day', detail: 'Extra on days 7, 14, 21… (+50 to +100) and every 30th day (+200). One missed day a week is forgiven', amount: '10+' },
  { icon: '🎯', title: "Today's quests", detail: '3 a day, +20 more for all 3', amount: '10' },
  { icon: '🧭', title: 'Welcome quest', detail: 'Once: 5 first steps', amount: '100' },
  { icon: '🏘️', title: 'Huud of the Week', detail: "When your area reaches the week's goal", amount: '20' },
  { icon: '↗️', title: 'Share a post outside the app', detail: 'Up to 10 a day', amount: '5' },
  { icon: '🎉', title: 'Create an event', detail: 'Up to 2 a day', amount: '15' },
  { icon: '💼', title: 'Post a job', detail: 'Up to 2 a day', amount: '10' },
  { icon: '🛍️', title: 'List an item for sale', detail: 'Up to 3 a day', amount: '10' },
  { icon: '🤝🏾', title: 'Finish a marketplace deal', detail: 'Buyer and seller, up to 5 a day', amount: '10' },
  { icon: '🙋🏾', title: 'Help a neighbour who asked', detail: 'When they confirm you helped', amount: '5' },
  { icon: '🚨', title: 'Report something neighbours confirm', detail: 'Paid only after they confirm it, never for posting', amount: '15' },
  { icon: '✅', title: 'Confirm a report that turns out true', detail: 'When enough neighbours confirm it, up to 10 a day', amount: '2' },
  { icon: '👋🏾', title: 'Invite a neighbour who becomes active', detail: 'When they help someone or finish a deal; they get 50 too', amount: '50' },
  { icon: '🚑', title: 'Respond to an SOS', detail: 'When the person confirms you helped', amount: '30' },
  { icon: '🔎', title: 'Return a lost item', detail: 'After the owner confirms with the code', amount: '50' },
  { icon: '🙌🏾', title: 'Help someone find their item', detail: 'When they thank you for the tip', amount: '10' },
  { icon: '📊', title: 'Post a poll 10 neighbours vote on', detail: 'Once a day', amount: '2' },
  { icon: '👤', title: 'Complete your profile', detail: 'Once', amount: '100' },
  { icon: '✉️', title: 'Verify your email', detail: 'Once', amount: '10' },
];

export default function RewardsPage() {
  const { data: stats, isLoading, isError, refetch } = useMyGamificationStats();
  const balance: number | undefined = stats?.totalHuudCoins;
  const streak: number | undefined = stats?.streak;
  const standing: Standing | undefined = stats?.standing;

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

        {standing ? <StandingCard standing={standing} /> : null}

        <QuestsCard />

        <HuudWeekCard />

        <AreaBoard />

        <MissionsCard />

        <BadgesCard />

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
            HuudCredit rewards helping your neighbours, not noise: posts, comments and likes don&apos;t pay. It cannot be changed to naira.
          </p>
        </section>

        {/* Spend: the shop and community projects (Phase 7) */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/rewards/shop" className="flex flex-col gap-1 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-background">
            <span aria-hidden className="text-2xl">🛍️</span>
            <span className="text-sm font-bold text-navy">Shop</span>
            <span className="text-xs font-semibold text-muted">Map skins, frames, shout-outs</span>
          </Link>
          <Link href="/projects" className="flex flex-col gap-1 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-background">
            <span aria-hidden className="text-2xl">🏗️</span>
            <span className="text-sm font-bold text-navy">Projects</span>
            <span className="text-xs font-semibold text-muted">Help fund what your area needs</span>
          </Link>
        </div>

        {/* Spend: map ads are live (2026-10-12) */}
        <Link
          href="/ads"
          className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] transition-colors hover:bg-background"
        >
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-soft text-lg">
            🪧
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-bold text-navy">Spend it on a map ad</span>
            <span className="text-xs font-semibold text-muted">A billboard, an Ad Wall plot or a sponsored pin</span>
          </span>
          <span aria-hidden className="material-symbols-outlined text-muted">
            chevron_right
          </span>
        </Link>

        {/* Honest about what is not here yet */}
        <section className="flex flex-col gap-1 rounded-[22px] bg-amber-soft p-4">
          <h2 className="font-heading text-base font-extrabold text-navy">Coming soon</h2>
          <p className="text-sm text-navy">
            Airtime and data rewards, and a share of ad money for top helpers, once the legal checks are done.
          </p>
        </section>
      </main>
    </div>
  );
}
