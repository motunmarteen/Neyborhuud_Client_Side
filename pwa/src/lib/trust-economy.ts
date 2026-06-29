export type TrustTier = "seedling" | "sapling" | "tree" | "baobab";

export interface TrustTierInfo {
  tier: TrustTier;
  label: string;
  icon: string;
  minScore: number;
  description: string;
}

export interface TrustEarningRule {
  id: string;
  title: string;
  pointsPerAction: number;
  dailyCap: number;
  category: "identity" | "consistency" | "community" | "reliability" | "contribution";
  description: string;
}

export interface TrustEconomyInputs {
  trustScoreRaw?: number;
  streakDays?: number;
  badgesCount?: number;
  completedAchievements?: number;
  vouchCount?: number;
  profileCompleted?: boolean;
  identityVerified?: boolean;
}

export interface TrustEconomyBreakdownItem {
  id: string;
  label: string;
  current: number;
  max: number;
  colorClass: string;
  reason: string;
}

export interface TrustEconomyModel {
  score1000: number;
  communityTrustPercent: number;
  trustTier: TrustTierInfo;
  nextTier: TrustTierInfo | null;
  nextTierDelta: number;
  breakdown: TrustEconomyBreakdownItem[];
  topActions: TrustEarningRule[];
  riskControls: string[];
}

export const TRUST_TIERS: TrustTierInfo[] = [
  {
    tier: "seedling",
    label: "Seedling",
    icon: "🌱",
    minScore: 0,
    description: "Email verified and account activated.",
  },
  {
    tier: "sapling",
    label: "Sapling",
    icon: "🌿",
    minScore: 100,
    description: "Profile complete and consistently active.",
  },
  {
    tier: "tree",
    label: "Tree",
    icon: "🌳",
    minScore: 300,
    description: "Community vouched and trusted in local interactions.",
  },
  {
    tier: "baobab",
    label: "Baobab",
    icon: "🌲",
    minScore: 600,
    description: "Highest trust level with durable community credibility.",
  },
];

export const TRUST_EARNING_RULES: TrustEarningRule[] = [
  {
    id: "identity-verification",
    title: "Verify identity",
    pointsPerAction: 120,
    dailyCap: 120,
    category: "identity",
    description: "One-time boost for confirmed identity and profile integrity.",
  },
  {
    id: "daily-checkin",
    title: "Daily check-in streak",
    pointsPerAction: 4,
    dailyCap: 20,
    category: "consistency",
    description: "Consistency bonus that grows with healthy daily usage.",
  },
  {
    id: "community-vouch-received",
    title: "Receive vouches",
    pointsPerAction: 24,
    dailyCap: 72,
    category: "community",
    description: "Verified members can vouch to strengthen your community trust.",
  },
  {
    id: "constructive-contribution",
    title: "Constructive contributions",
    pointsPerAction: 6,
    dailyCap: 36,
    category: "contribution",
    description: "Helpful posts, comments, and useful local updates increase trust.",
  },
  {
    id: "reliable-behavior",
    title: "Reliable behavior",
    pointsPerAction: 8,
    dailyCap: 32,
    category: "reliability",
    description: "Keeping interactions safe and conflict-free compounds trust.",
  },
];

export function normalizeTrustScore(raw?: number): {
  score1000: number;
  percent: number;
  formattedScore: string;
} {
  const value = Number.isFinite(raw) ? Math.max(0, Number(raw)) : 0;
  const score1000 = value <= 100 ? Math.round(value * 10) : Math.min(1000, Math.round(value));
  const percent = Math.round((score1000 / 1000) * 100);
  return {
    score1000,
    percent,
    formattedScore: score1000.toLocaleString(),
  };
}

export function getTrustTier(score1000: number): TrustTierInfo {
  for (let i = TRUST_TIERS.length - 1; i >= 0; i -= 1) {
    if (score1000 >= TRUST_TIERS[i].minScore) return TRUST_TIERS[i];
  }
  return TRUST_TIERS[0];
}

export function getNextTrustTier(score1000: number): TrustTierInfo | null {
  const current = getTrustTier(score1000);
  const idx = TRUST_TIERS.findIndex((tier) => tier.tier === current.tier);
  return idx >= 0 && idx < TRUST_TIERS.length - 1 ? TRUST_TIERS[idx + 1] : null;
}

export function buildTrustEconomyModel(input: TrustEconomyInputs): TrustEconomyModel {
  const normalized = normalizeTrustScore(input.trustScoreRaw);
  const streak = Math.max(0, input.streakDays ?? 0);
  const badges = Math.max(0, input.badgesCount ?? 0);
  const achievements = Math.max(0, input.completedAchievements ?? 0);
  const vouches = Math.max(0, input.vouchCount ?? 0);

  const identity = input.identityVerified ? 200 : input.profileCompleted ? 120 : 70;
  const consistency = Math.min(150, 50 + streak * 6);
  const contribution = Math.min(250, 45 + achievements * 10 + badges * 4);
  const reliability = Math.min(200, Math.max(30, Math.round(normalized.score1000 * 0.22)));
  const community = Math.min(200, 25 + vouches * 35);

  const syntheticScore = Math.min(1000, identity + consistency + contribution + reliability + community);
  const score1000 = Math.max(normalized.score1000, syntheticScore);
  const trustTier = getTrustTier(score1000);
  const nextTier = getNextTrustTier(score1000);

  return {
    score1000,
    communityTrustPercent: Math.round((score1000 / 1000) * 100),
    trustTier,
    nextTier,
    nextTierDelta: nextTier ? Math.max(0, nextTier.minScore - score1000) : 0,
    breakdown: [
      {
        id: "identity",
        label: "Identity Integrity",
        current: identity,
        max: 200,
        colorClass: "bg-brand-blue500",
        reason: "Verification and complete profile foundation.",
      },
      {
        id: "consistency",
        label: "Consistency",
        current: consistency,
        max: 150,
        colorClass: "bg-brand-blue500",
        reason: "Daily check-ins and sustained healthy activity.",
      },
      {
        id: "contribution",
        label: "Constructive Contribution",
        current: contribution,
        max: 250,
        colorClass: "bg-primary",
        reason: "Helpful participation and completed achievements.",
      },
      {
        id: "reliability",
        label: "Reliability",
        current: reliability,
        max: 200,
        colorClass: "bg-primary",
        reason: "Safe behavior and low-risk interaction history.",
      },
      {
        id: "community",
        label: "Community Endorsement",
        current: community,
        max: 200,
        colorClass: "bg-brand-blue500",
        reason: "Vouches from trusted community members.",
      },
    ],
    topActions: TRUST_EARNING_RULES,
    riskControls: [
      "Trust actions are capped daily to prevent farming and bot loops.",
      "Vouches are weighted by the voucher's own trust tier and consistency.",
      "Reports, blocks, and confirmed abuse events trigger trust drag and cooldown.",
      "Suspicious burst activity is delayed for review before score credit is finalized.",
    ],
  };
}