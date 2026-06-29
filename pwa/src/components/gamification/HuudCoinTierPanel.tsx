'use client';

import { useWallet } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';

const TIERS = [
  {
    id: 'bronze' as const,
    name: 'Bronze',
    coinsRequired: 0,
    icon: '🥉',
    features: [
      'Basic feed access',
      '3 marketplace listings',
      '1 active job post',
      'Community chat',
    ],
    howToEarn: 'Join the platform and start engaging',
  },
  {
    id: 'silver' as const,
    name: 'Silver',
    coinsRequired: 500,
    icon: '🥈',
    popular: true,
    features: [
      'Everything in Bronze',
      '10 marketplace listings',
      '5 active job posts',
      'Priority feed placement',
      'Verified tier badge',
    ],
    howToEarn: 'Post content, comment daily, attend events',
  },
  {
    id: 'gold' as const,
    name: 'Gold',
    coinsRequired: 2000,
    icon: '🥇',
    features: [
      'Everything in Silver',
      '25 marketplace listings',
      '15 active job posts',
      '2× HuudCoins earn rate',
      'Analytics dashboard',
      'Promoted profile',
    ],
    howToEarn: 'Be consistently active — post FYIs, help neighbours, complete jobs',
  },
  {
    id: 'platinum' as const,
    name: 'Platinum',
    coinsRequired: 10000,
    icon: '💎',
    features: [
      'Everything in Gold',
      'Unlimited listings',
      'Unlimited job posts',
      '3× HuudCoins earn rate',
      'Featured seller badge',
      'Early feature access',
      'Dedicated support',
    ],
    howToEarn: 'Become a pillar of your community — highest activity, trust, and impact',
  },
];

const EARN_ACTIONS = [
  { icon: '✍️', label: 'Post content', coins: '+1–5' },
  { icon: '💬', label: 'Comment on posts', coins: '+2' },
  { icon: '📅', label: 'Daily check-in', coins: '+10' },
  { icon: '🛍️', label: 'List on marketplace', coins: '+10' },
  { icon: '🎉', label: 'Create / attend events', coins: '+2–5' },
  { icon: '💼', label: 'Post or complete a job', coins: '+5' },
  { icon: '⭐', label: 'Rate a service', coins: '+2' },
  { icon: '🔗', label: 'Share content', coins: '+3' },
];

function tierFromBalance(balance: number): (typeof TIERS)[number] {
  for (let i = TIERS.length - 1; i >= 0; i -= 1) {
    if (balance >= TIERS[i].coinsRequired) return TIERS[i];
  }
  return TIERS[0];
}

export function HuudCoinTierPanel() {
  const { user } = useAuth();
  const { data: walletRaw, isLoading } = useWallet();

  const balance: number =
    (walletRaw as { balance?: number; huudCoins?: number; totalHuudCoins?: number } | null)
      ?.balance ??
    (walletRaw as { huudCoins?: number })?.huudCoins ??
    (walletRaw as { totalHuudCoins?: number })?.totalHuudCoins ??
    0;

  const profileTier = (user?.gamification?.tier as string | undefined) ?? '';
  const balanceTier = tierFromBalance(balance);
  const activeTierDef =
    TIERS.find((t) => t.id === profileTier) ?? balanceTier;
  const nextTierDef = TIERS.find((t) => t.coinsRequired > balance);

  const progressPct =
    nextTierDef && nextTierDef.coinsRequired > activeTierDef.coinsRequired
      ? Math.min(
          100,
          ((balance - activeTierDef.coinsRequired) /
            (nextTierDef.coinsRequired - activeTierDef.coinsRequired)) *
            100,
        )
      : 100;

  return (
    <div className="space-y-4">
      <div className="mod-card rounded-2xl border border-primary/15 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            🪙
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
              Activity tier
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--neu-text-muted)]">
              Tiers are earned through HuudCoins — not bought. Stay active in your Huud and your
              tier upgrades automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="mod-card rounded-2xl p-4">
        {isLoading ? (
          <div className="h-24 animate-pulse mod-inset rounded-xl" />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                  HuudCoins balance
                </p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary">
                  {balance.toLocaleString()}
                  <span className="ml-1 text-lg font-bold text-primary/60">HC</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                  Current tier
                </p>
                <p className="mt-1 text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
                  {activeTierDef.icon} {activeTierDef.name}
                </p>
              </div>
            </div>

            {nextTierDef ? (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[11px] text-[var(--neu-text-muted)]">
                  <span>{activeTierDef.name}</span>
                  <span className="font-semibold text-primary">
                    {(nextTierDef.coinsRequired - balance).toLocaleString()} HC to{' '}
                    {nextTierDef.name}
                  </span>
                  <span>{nextTierDef.name}</span>
                </div>
                <div className="mod-inset h-2.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--neu-text-muted)]">{nextTierDef.howToEarn}</p>
              </div>
            ) : (
              <p className="mt-4 text-center text-sm font-semibold text-primary">
                You&apos;ve reached the highest tier — Platinum!
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const isCurrent = activeTierDef.id === tier.id;
          const isUnlocked = balance >= tier.coinsRequired;
          const isNext = tier.id === nextTierDef?.id;

          return (
            <div
              key={tier.id}
              className={`mod-card relative flex flex-col rounded-2xl p-4 ${
                isCurrent ? 'ring-2 ring-primary/30' : ''
              } ${!isUnlocked && !isCurrent ? 'opacity-75' : ''}`}
            >
              {tier.popular && isNext ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 mod-chip mod-chip-active rounded-full px-2 py-0.5 text-[10px] font-bold text-primary">
                  Next goal
                </span>
              ) : null}

              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="mod-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold">
                  {tier.icon} {tier.name}
                </span>
                {isCurrent ? (
                  <span className="text-[10px] font-bold text-primary">Active</span>
                ) : isUnlocked ? (
                  <span className="text-[10px] font-bold text-[var(--neu-text-muted)]">Earned</span>
                ) : null}
              </div>

              <p className="mb-3 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {tier.coinsRequired === 0
                  ? 'Starting tier'
                  : `${tier.coinsRequired.toLocaleString()} HC required`}
              </p>

              <ul className="mb-4 flex-1 space-y-1.5">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs text-[var(--neu-text-muted)]"
                  >
                    <span
                      className="material-symbols-outlined text-[14px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <p
                className={`rounded-xl py-2 text-center text-[11px] font-semibold ${
                  isCurrent
                    ? 'mod-chip mod-chip-active text-primary'
                    : 'mod-inset text-[var(--neu-text-muted)]'
                }`}
              >
                {isCurrent
                  ? 'Your current tier'
                  : isUnlocked
                    ? 'Unlocked'
                    : `Need ${(tier.coinsRequired - balance).toLocaleString()} more HC`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mod-card rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
          Quick ways to earn HuudCoins
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EARN_ACTIONS.map((action) => (
            <div key={action.label} className="mod-inset rounded-xl p-3 text-center">
              <span className="text-xl">{action.icon}</span>
              <p className="mt-1 text-[11px] leading-tight text-[var(--neu-text-muted)]">
                {action.label}
              </p>
              <p className="text-[11px] font-bold text-primary">{action.coins}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
