'use client';

import Link from 'next/link';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import {
  HuudEconomyHero,
  HuudEconomySectionNav,
} from '@/components/huud-economy/HuudEconomySectionNav';
import StreakCard from '@/components/gamification/StreakCard';
import {
  useMyGamificationStats,
  useMyStreak,
  useCheckIn,
  useWallet,
  useTransactions,
} from '@/hooks/useGamification';
import { useMyTrustProfile } from '@/hooks/useTrust';
import { buildTrustEconomyModel, normalizeTrustScore } from '@/lib/trust-economy';

function PreviewStat({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="mod-card flex items-center gap-3 rounded-xl p-4 no-underline transition-opacity hover:opacity-90"
    >
      <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--neu-text)' }}>
          {value}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">{label}</p>
      </div>
      <span className="material-symbols-outlined text-[20px] text-primary">chevron_right</span>
    </Link>
  );
}

export default function HuudEconomyOverviewPage() {
  const stats = useMyGamificationStats();
  const streak = useMyStreak();
  const checkIn = useCheckIn();
  const wallet = useWallet();
  const txQuery = useTransactions(1);
  const trustProfile = useMyTrustProfile();

  const statsData = (stats.data as { data?: Record<string, unknown> })?.data ?? (stats.data as Record<string, unknown>);
  const streakData = (streak.data as { data?: Record<string, unknown> })?.data ?? (streak.data as Record<string, unknown>);
  const walletData = (wallet.data as Record<string, number> | null) ?? null;
  const balance = walletData?.balance ?? walletData?.huudCoins ?? Number(statsData?.huudCoins ?? 0);
  const totalSpent = walletData?.totalSpent ?? 0;
  const trustInput = normalizeTrustScore(Number(statsData?.trustScore ?? 0));
  const trustEconomy = buildTrustEconomyModel({
    trustScoreRaw: trustInput.score1000,
    streakDays: Number(streakData?.effectiveStreak ?? streakData?.streak ?? 0),
    badgesCount: 0,
    completedAchievements: 0,
    vouchCount: Number((statsData as { vouchCount?: number })?.vouchCount ?? 0),
    profileCompleted: Boolean((statsData as { profileCompleted?: boolean })?.profileCompleted),
    identityVerified: Boolean((statsData as { identityVerified?: boolean })?.identityVerified),
  });

  const recentTxs: Record<string, unknown>[] = txQuery.data?.transactions?.slice(0, 3) ?? [];

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="space-y-3">
          <HuudEconomyHero />
          <HuudEconomySectionNav />
        </div>
      }
    >
      <div className="space-y-4">
        {!streak.isFetched ? (
          <div className="mod-card h-36 animate-pulse rounded-2xl" />
        ) : (
          <StreakCard
            streak={Number(streakData?.effectiveStreak ?? streakData?.streak ?? 0)}
            lastCheckIn={streakData?.lastCheckIn as string | undefined}
            checkedInToday={Boolean((streakData as { checkedInToday?: boolean })?.checkedInToday)}
            streakBroken={Boolean((streakData as { streakBroken?: boolean })?.streakBroken)}
            nextReward={Number((streakData as { nextMilestoneReward?: number })?.nextMilestoneReward ?? 0)}
            onCheckIn={() => checkIn.mutate()}
            checkInPending={checkIn.isPending}
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PreviewStat
            icon="account_balance_wallet"
            label="HuudCoins balance"
            value={`${balance.toLocaleString()} HC`}
            href="/huud-economy/wallet"
          />
          <PreviewStat
            icon="verified_user"
            label="Trust score"
            value={trustEconomy.score1000.toLocaleString()}
            href="/huud-economy/score?tab=trustos"
          />
          <PreviewStat
            icon="military_tech"
            label="Level"
            value={String(statsData?.level ?? 1)}
            href="/huud-economy/score"
          />
          <PreviewStat
            icon="shopping_cart"
            label="Total spent"
            value={`${totalSpent.toLocaleString()} HC`}
            href="/huud-economy/wallet?tab=spends"
          />
        </div>

        <div className="mod-card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Trust snapshot
            </h2>
            <Link href="/huud-economy/score?tab=trustos" className="text-xs font-semibold text-primary no-underline">
              Open TrustOS →
            </Link>
          </div>
          <p className="text-sm text-[var(--neu-text-muted)]">
            {trustEconomy.trustTier.icon} {trustEconomy.trustTier.label} · {trustEconomy.communityTrustPercent}% community trust
          </p>
          {(trustProfile.data?.recentEvents?.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-[var(--neu-text-secondary)]">
              Latest: {trustProfile.data!.recentEvents![0].reason ?? 'Trust activity recorded'}
            </p>
          )}
        </div>

        <div className="mod-card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Recent wallet activity
            </h2>
            <Link href="/huud-economy/wallet?tab=transactions" className="text-xs font-semibold text-primary no-underline">
              Full history →
            </Link>
          </div>
          {txQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="mod-inset h-12 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recentTxs.length === 0 ? (
            <p className="text-sm text-[var(--neu-text-muted)]">No transactions yet — earn HuudCoins from daily activity.</p>
          ) : (
            <div className="space-y-2">
              {recentTxs.map((tx, i) => {
                const amount = Number(tx.amount ?? 0);
                return (
                  <div key={String(tx.id ?? i)} className="mod-inset flex items-center justify-between rounded-xl px-3 py-2">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                      {String(tx.description ?? tx.type ?? 'Transaction')}
                    </p>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${amount >= 0 ? 'text-primary' : 'text-brand-red'}`}
                    >
                      {amount >= 0 ? '+' : ''}
                      {amount.toLocaleString()} HC
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mod-card rounded-2xl p-4">
          <h2 className="mb-3 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/huud-economy/wallet" className="mod-chip mod-chip-active rounded-xl py-2.5 text-center text-xs font-bold text-primary no-underline">
              Open wallet
            </Link>
            <Link href="/huud-economy/score" className="mod-chip rounded-xl py-2.5 text-center text-xs font-semibold no-underline" style={{ color: 'var(--neu-text-muted)' }}>
              Huud Score
            </Link>
            <Link href="/neighborhood" className="mod-chip rounded-xl py-2.5 text-center text-xs font-semibold no-underline" style={{ color: 'var(--neu-text-muted)' }}>
              Tip a neighbour
            </Link>
            <Link href="/feed" className="mod-chip rounded-xl py-2.5 text-center text-xs font-semibold no-underline" style={{ color: 'var(--neu-text-muted)' }}>
              Boost on feed
            </Link>
          </div>
        </div>
      </div>
    </AppBrowseLayout>
  );
}
