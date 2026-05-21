"use client";

import { useWallet } from "@/hooks/useGamification";

/**
 * Tier definitions — earned automatically by accumulating HuudCoins.
 * No fiat purchase required.  Tier = f(HuudCoin balance).
 */
const TIERS = [
  {
    id: "bronze" as const,
    name: "Bronze",
    coinsRequired: 0,
    borderColor: "border-amber-700",
    badgeClass: "bg-amber-900/40 text-primary",
    progressColor: "bg-primary",
    icon: "🥉",
    features: [
      "Basic feed access",
      "3 marketplace listings",
      "1 active job post",
      "Community chat",
    ],
    howToEarn: "Join the platform and start engaging",
  },
  {
    id: "silver" as const,
    name: "Silver",
    coinsRequired: 500,
    borderColor: "border-slate-400",
    badgeClass: "bg-slate-700/40 text-slate-300",
    progressColor: "bg-slate-400",
    popular: true,
    icon: "🥈",
    features: [
      "Everything in Bronze",
      "10 marketplace listings",
      "5 active job posts",
      "Priority feed placement",
      "Verified tier badge",
    ],
    howToEarn: "Post content, comment daily, attend events",
  },
  {
    id: "gold" as const,
    name: "Gold",
    coinsRequired: 2000,
    borderColor: "border-yellow-400",
    badgeClass: "bg-primary900/40 text-primary400",
    progressColor: "bg-primary400",
    icon: "🥇",
    features: [
      "Everything in Silver",
      "25 marketplace listings",
      "15 active job posts",
      "2× HuudCoins earn rate",
      "Analytics dashboard",
      "Promoted profile",
    ],
    howToEarn: "Be consistently active — post FYIs, help neighbours, complete jobs",
  },
  {
    id: "platinum" as const,
    name: "Platinum",
    coinsRequired: 10000,
    borderColor: "border-brand-blue",
    badgeClass: "bg-purple-900/40 text-brand-blue",
    progressColor: "bg-brand-blue",
    icon: "💎",
    features: [
      "Everything in Gold",
      "Unlimited listings",
      "Unlimited job posts",
      "3× HuudCoins earn rate",
      "Featured seller badge",
      "Early feature access",
      "Dedicated support",
    ],
    howToEarn: "Become a pillar of your community — highest activity, trust, and impact",
  },
];

/** Ways to earn HuudCoins — shown in the "earn more" section */
const EARN_ACTIONS = [
  { icon: "✍️", label: "Post content",         coins: "+1–5" },
  { icon: "💬", label: "Comment on posts",       coins: "+2" },
  { icon: "📅", label: "Daily check-in",         coins: "+10" },
  { icon: "🛍️", label: "List on marketplace",    coins: "+10" },
  { icon: "🎉", label: "Create / attend events", coins: "+2–5" },
  { icon: "💼", label: "Post or complete a job", coins: "+5" },
  { icon: "⭐", label: "Rate a service",          coins: "+2" },
  { icon: "🔗", label: "Share content externally", coins: "+3" },
];

interface Props {
  currentTier?: string;
}

export function PremiumCards({ currentTier }: Props) {
  const { data: walletRaw } = useWallet();
  const balance: number = (walletRaw as any)?.balance ?? (walletRaw as any)?.coins ?? 0;

  // Determine the tier the user currently holds
  const activeTier = currentTier ?? "bronze";
  const activeTierDef = TIERS.find((t) => t.id === activeTier) ?? TIERS[0];

  // Determine next tier
  const nextTierDef = TIERS.find((t) => t.coinsRequired > balance);

  return (
    <div className="space-y-8">

      {/* ── Earn-based explanation banner ─────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/30 bg-primary/5 px-6 py-5 flex items-start gap-4">
        <span className="text-3xl mt-0.5">🪙</span>
        <div>
          <h3 className="font-bold text-amber-300 text-base">Tiers are earned, not bought</h3>
          <p className="text-[var(--neu-text-muted)] text-sm mt-1 leading-relaxed">
            NeyborHuud is free for everyone. Your tier badge is automatically upgraded as you
            accumulate HuudCoins through platform activity — no payment, no subscription.
            Stay active, help your neighbours, and watch your tier grow.
          </p>
        </div>
      </div>

      {/* ── Current balance + progress bar ────────────────────────────── */}
      <div className="rounded-2xl border border-black/[0.08] bg-brand-black px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--neu-text-muted)]">Your HuudCoins balance</p>
            <p className="text-3xl font-bold text-primary">🪙 {balance.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--neu-text-muted)]">Current tier</p>
            <p className="text-xl font-bold text-white">
              {activeTierDef.icon} {activeTierDef.name}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTierDef && (
          <div>
            <div className="flex justify-between text-xs text-[var(--neu-text-muted)] mb-1.5">
              <span>{activeTierDef.name}</span>
              <span>
                {nextTierDef.coinsRequired - balance} coins to {nextTierDef.name}
              </span>
              <span>{nextTierDef.name}</span>
            </div>
            <div className="h-2.5 rounded-full bg-brand-black overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${nextTierDef.progressColor}`}
                style={{
                  width: `${Math.min(
                    100,
                    ((balance - activeTierDef.coinsRequired) /
                      (nextTierDef.coinsRequired - activeTierDef.coinsRequired)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-[var(--neu-text-muted)] mt-1.5">
              {nextTierDef.howToEarn}
            </p>
          </div>
        )}
        {!nextTierDef && (
          <p className="text-sm text-brand-blue font-semibold text-center">
            💎 You&apos;ve reached the highest tier — Platinum!
          </p>
        )}
      </div>

      {/* ── Tier grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const isCurrent = activeTier === tier.id;
          const isUnlocked = balance >= tier.coinsRequired;
          const isNext = tier.id === nextTierDef?.id;

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-brand-black p-5 transition-all ${
                isCurrent
                  ? `${tier.borderColor} ring-2 ring-offset-2 ring-offset-[#0f0f1e] ring-${tier.borderColor.replace("border-", "")}`
                  : isUnlocked
                    ? tier.borderColor
                    : "border-black/[0.08] opacity-60"
              }`}
            >
              {tier.popular && isNext && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-blue text-xs font-bold text-white whitespace-nowrap">
                  Next Goal
                </div>
              )}

              {/* Tier badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tier.badgeClass}`}>
                  {tier.icon} {tier.name}
                </div>
                {isCurrent && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
                {isUnlocked && !isCurrent && (
                  <span className="text-xs font-bold text-[var(--neu-text-muted)] bg-brand-black/40 px-2 py-0.5 rounded-full">
                    Earned
                  </span>
                )}
              </div>

              {/* Coins required */}
              <div className="mb-4">
                {tier.coinsRequired === 0 ? (
                  <span className="text-lg font-bold text-white">Starting tier</span>
                ) : (
                  <span className="text-lg font-bold text-white">
                    🪙 {tier.coinsRequired.toLocaleString()}
                    <span className="text-sm font-normal text-[var(--neu-text-muted)]"> coins</span>
                  </span>
                )}
              </div>

              {/* Features list */}
              <ul className="space-y-1.5 flex-1 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--neu-text-muted)]">
                    <span className="material-symbols-outlined text-primary text-base mt-0.5">
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Status footer */}
              <div className={`text-center py-2 rounded-xl text-xs font-semibold ${
                isCurrent
                  ? "bg-primary/10 text-primary"
                  : isUnlocked
                    ? "bg-brand-black/40 text-[var(--neu-text-muted)]"
                    : "bg-brand-black text-[var(--neu-text-muted)]"
              }`}>
                {isCurrent
                  ? "✓ Your current tier"
                  : isUnlocked
                    ? "✓ Unlocked"
                    : `Need ${(tier.coinsRequired - balance).toLocaleString()} more coins`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── How to earn more HuudCoins ────────────────────────────────── */}
      <div className="rounded-2xl border border-black/[0.08] bg-brand-black px-6 py-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bolt</span>
          How to earn more HuudCoins
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EARN_ACTIONS.map((action) => (
            <div
              key={action.label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-black border border-black/[0.08] text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs text-[var(--neu-text-muted)] leading-tight">{action.label}</span>
              <span className="text-xs font-bold text-primary">{action.coins}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--neu-text-secondary)] mt-4 text-center">
          Coins are awarded daily with caps to keep the economy fair.
          Check in every day for streak bonuses!
        </p>
      </div>
    </div>
  );
}
