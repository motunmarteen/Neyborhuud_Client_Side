/**
 * NeyborHuud Verification Identity — multi-tier credibility engine.
 *
 * Tiers: none → bronze → silver → gold → diamond → platinum
 *
 * MVP (no paid services):
 * - NO SMS phone verification (phone optional; add OTP when budget allows)
 * - NO paid KYC / identityVerified gate (admin/KYC reserved for future Phase 2)
 *
 * Identity is proven via email, rich profile, community anchoring, trust score,
 * vouches, HuudCoin activity, streaks, and clean history.
 */

import { normalizeTrustScore, TRUST_TIERS } from '@/lib/trust-economy';

export type VerificationTier =
  | 'none'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'diamond'
  | 'platinum';

export type VerificationRoleBadge =
  | 'neighbor'
  | 'business'
  | 'emergency_responder'
  | 'community_leader';

export interface VerificationIdentityInput {
  emailVerified?: boolean;
  email_verified?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  profileCompletedAt?: string | null;
  avatarUrl?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  assignedCommunityId?: string | null;
  createdAt?: string | null;
  trustScore?: number | null;
  huudCoins?: number | null;
  points?: number | null;
  vouchCount?: number | null;
  streakDays?: number | null;
  earnedHuudCoins90d?: number | null;
  walletSpendCount?: number | null;
  badgesCount?: number | null;
  achievementsCount?: number | null;
  leaderboardPercentile?: number | null;
  isSuspended?: boolean;
  hasTrustPenalty?: boolean;
  verificationBadge?: VerificationRoleBadge | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    lga?: string | null;
    state?: string | null;
  } | null;
  /** Reserved — not used for tier gates until paid KYC is available */
  identityVerified?: boolean;
}

export interface VerificationTierMeta {
  tier: VerificationTier;
  label: string;
  emoji: string;
  color: string;
  colorClass: string;
  description: string;
}

export interface VerificationAxisProgress {
  id: string;
  label: string;
  percent: number;
  done: boolean;
  detail: string;
}

export interface VerificationProgress {
  tier: VerificationTier;
  nextTier: VerificationTier | null;
  percentToNext: number;
  axes: VerificationAxisProgress[];
  blockers: string[];
  tooltip: string;
}

export const VERIFICATION_TIER_ORDER: VerificationTier[] = [
  'none',
  'bronze',
  'silver',
  'gold',
  'diamond',
  'platinum',
];

const TRUST_SAPLING = TRUST_TIERS.find((t) => t.tier === 'sapling')?.minScore ?? 100;
const TRUST_TREE = TRUST_TIERS.find((t) => t.tier === 'tree')?.minScore ?? 300;
const TRUST_BAOBAB = TRUST_TIERS.find((t) => t.tier === 'baobab')?.minScore ?? 600;

const HUUD_SILVER = 500;
const HUUD_GOLD = 2_000;
const HUUD_PLATINUM = 10_000;

const MIN_ACCOUNT_DAYS_BRONZE = 3;
const MIN_STREAK_GOLD = 7;
const MIN_STREAK_DIAMOND = 30;
const MIN_VOUCHES_GOLD = 3;
const MIN_VOUCHES_DIAMOND = 5;
const MIN_VOUCHES_PLATINUM = 5;
const MIN_WALLET_SPENDS_GOLD = 1;
const MIN_BIO_LENGTH = 10;
const LEADERBOARD_PLATINUM_PERCENTILE = 90;

export const VERIFICATION_TIER_META: Record<VerificationTier, VerificationTierMeta> = {
  none: {
    tier: 'none',
    label: 'Unverified',
    emoji: '',
    color: '#94A3B8',
    colorClass: 'verification-tier--none',
    description: 'Start your verification journey.',
  },
  bronze: {
    tier: 'bronze',
    label: 'Bronze',
    emoji: '🥉',
    color: '#CD7F32',
    colorClass: 'verification-tier--bronze',
    description: 'Email verified neighbour.',
  },
  silver: {
    tier: 'silver',
    label: 'Silver',
    emoji: '🥈',
    color: '#94A3B8',
    colorClass: 'verification-tier--silver',
    description: 'Profile and community anchored.',
  },
  gold: {
    tier: 'gold',
    label: 'Gold',
    emoji: '🥇',
    color: '#00D431',
    colorClass: 'verification-tier--gold',
    description: 'Community-trusted neighbour.',
  },
  diamond: {
    tier: 'diamond',
    label: 'Diamond',
    emoji: '💎',
    color: '#38BDF8',
    colorClass: 'verification-tier--diamond',
    description: 'Highly trusted Huud pillar.',
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum',
    emoji: '💜',
    color: '#A855F7',
    colorClass: 'verification-tier--platinum',
    description: 'Elite community elder.',
  },
};

export function extractVerificationIdentityInput(
  source: Record<string, unknown> | null | undefined,
): VerificationIdentityInput {
  if (!source) return {};
  const gamification = source.gamification as
    | { points?: number; huudCoins?: number; trustScore?: number; streak?: number }
    | undefined;
  const location = source.location as VerificationIdentityInput['location'];

  return {
    emailVerified: source.emailVerified as boolean | undefined,
    email_verified: source.email_verified as boolean | undefined,
    isVerified: source.isVerified as boolean | undefined,
    verificationStatus: source.verificationStatus as string | undefined,
    firstName: source.firstName as string | null | undefined,
    lastName: source.lastName as string | null | undefined,
    phoneNumber: source.phoneNumber as string | null | undefined,
    profileCompletedAt: source.profileCompletedAt as string | null | undefined,
    avatarUrl: (source.avatarUrl ?? source.profilePicture) as string | null | undefined,
    profilePicture: source.profilePicture as string | null | undefined,
    bio: source.bio as string | null | undefined,
    assignedCommunityId: source.assignedCommunityId as string | null | undefined,
    createdAt: source.createdAt as string | null | undefined,
    trustScore:
      (source.trustScore as number | null | undefined) ??
      gamification?.trustScore,
    huudCoins:
      (source.huudCoins as number | null | undefined) ??
      (source.points as number | null | undefined) ??
      gamification?.huudCoins ??
      gamification?.points,
    points: source.points as number | null | undefined,
    vouchCount: source.vouchCount as number | null | undefined,
    streakDays:
      (source.streakDays as number | null | undefined) ??
      gamification?.streak,
    earnedHuudCoins90d: source.earnedHuudCoins90d as number | null | undefined,
    walletSpendCount: source.walletSpendCount as number | null | undefined,
    badgesCount: source.badgesCount as number | null | undefined,
    achievementsCount: source.achievementsCount as number | null | undefined,
    leaderboardPercentile: source.leaderboardPercentile as number | null | undefined,
    isSuspended: source.isSuspended as boolean | undefined,
    hasTrustPenalty: source.hasTrustPenalty as boolean | undefined,
    verificationBadge: source.verificationBadge as VerificationRoleBadge | null | undefined,
    location,
    identityVerified: source.identityVerified as boolean | undefined,
  };
}

function accountAgeDays(createdAt?: string | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

function huudCoins(input: VerificationIdentityInput): number {
  return Number(input.huudCoins ?? input.points ?? 0);
}

function trustScore1000(input: VerificationIdentityInput): number {
  return normalizeTrustScore(input.trustScore ?? 0).score1000;
}

export function isEmailVerified(input: VerificationIdentityInput): boolean {
  return Boolean(
    input.emailVerified ||
      input.email_verified ||
      input.isVerified ||
      input.verificationStatus === 'verified',
  );
}

export function hasLocationPin(input: VerificationIdentityInput): boolean {
  const lat = input.location?.latitude;
  const lng = input.location?.longitude;
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

export function hasCommunityAssignment(input: VerificationIdentityInput): boolean {
  return Boolean(input.assignedCommunityId);
}

/** Silver profile — no SMS; rich profile + community instead of phone OTP. */
export function isSilverProfileReady(input: VerificationIdentityInput): boolean {
  if (input.profileCompletedAt) return true;
  const hasAvatar = Boolean(input.avatarUrl?.trim() || input.profilePicture?.trim());
  const hasBio = (input.bio?.trim().length ?? 0) >= MIN_BIO_LENGTH;
  return Boolean(
    input.firstName?.trim() &&
      input.lastName?.trim() &&
      hasAvatar &&
      hasBio &&
      hasCommunityAssignment(input),
  );
}

export function hasCleanHistory(input: VerificationIdentityInput): boolean {
  return !input.isSuspended && !input.hasTrustPenalty;
}

function qualifiesBronze(input: VerificationIdentityInput): boolean {
  return isEmailVerified(input) && accountAgeDays(input.createdAt) >= MIN_ACCOUNT_DAYS_BRONZE;
}

function qualifiesSilver(input: VerificationIdentityInput): boolean {
  return qualifiesBronze(input) && isSilverProfileReady(input);
}

function qualifiesGold(input: VerificationIdentityInput): boolean {
  if (!qualifiesSilver(input) || !hasCleanHistory(input)) return false;
  if (!hasLocationPin(input)) return false;

  const trust = trustScore1000(input);
  const vouches = input.vouchCount ?? 0;
  const coins = huudCoins(input);
  const streak = input.streakDays ?? 0;
  const spends = input.walletSpendCount ?? 0;

  const communityTrust =
    trust >= TRUST_TREE || vouches >= MIN_VOUCHES_GOLD;
  const activitySignal =
    coins >= HUUD_SILVER || streak >= MIN_STREAK_GOLD || spends >= MIN_WALLET_SPENDS_GOLD;

  return communityTrust && activitySignal;
}

function qualifiesDiamond(input: VerificationIdentityInput): boolean {
  if (!qualifiesGold(input)) return false;

  const trust = trustScore1000(input);
  const vouches = input.vouchCount ?? 0;
  const coins = huudCoins(input);
  const streak = input.streakDays ?? 0;

  const elderTrust = trust >= TRUST_BAOBAB;
  const communityDepth = vouches >= MIN_VOUCHES_DIAMOND && streak >= MIN_STREAK_DIAMOND;
  const sustainedActivity = coins >= HUUD_GOLD;

  return elderTrust || (communityDepth && sustainedActivity);
}

function qualifiesPlatinum(input: VerificationIdentityInput): boolean {
  if (!qualifiesDiamond(input) || !hasCleanHistory(input)) return false;

  const trust = trustScore1000(input);
  const vouches = input.vouchCount ?? 0;
  const coins = huudCoins(input);
  const leaderboard = input.leaderboardPercentile ?? 0;

  return (
    coins >= HUUD_PLATINUM &&
    trust >= TRUST_BAOBAB &&
    vouches >= MIN_VOUCHES_PLATINUM &&
    (leaderboard >= LEADERBOARD_PLATINUM_PERCENTILE || coins >= HUUD_PLATINUM + 2000)
  );
}

export function getVerificationTier(input: VerificationIdentityInput): VerificationTier {
  if (qualifiesPlatinum(input)) return 'platinum';
  if (qualifiesDiamond(input)) return 'diamond';
  if (qualifiesGold(input)) return 'gold';
  if (qualifiesSilver(input)) return 'silver';
  if (qualifiesBronze(input)) return 'bronze';
  return 'none';
}

export function getVerificationTierMeta(tier: VerificationTier): VerificationTierMeta {
  return VERIFICATION_TIER_META[tier];
}

export function compareVerificationTier(a: VerificationTier, b: VerificationTier): number {
  return VERIFICATION_TIER_ORDER.indexOf(a) - VERIFICATION_TIER_ORDER.indexOf(b);
}

export function getVerificationProgress(
  input: VerificationIdentityInput,
): VerificationProgress {
  const tier = getVerificationTier(input);
  const tierIndex = VERIFICATION_TIER_ORDER.indexOf(tier);
  const nextTier =
    tierIndex < VERIFICATION_TIER_ORDER.length - 1
      ? VERIFICATION_TIER_ORDER[tierIndex + 1]
      : null;

  const trust = trustScore1000(input);
  const coins = huudCoins(input);
  const vouches = input.vouchCount ?? 0;
  const streak = input.streakDays ?? 0;
  const age = accountAgeDays(input.createdAt);

  const axes: VerificationAxisProgress[] = [
    {
      id: 'identity',
      label: 'Identity',
      percent: isEmailVerified(input) ? 100 : 0,
      done: isEmailVerified(input),
      detail: isEmailVerified(input) ? 'Email verified' : 'Verify your email',
    },
    {
      id: 'profile',
      label: 'Profile',
      percent: isSilverProfileReady(input)
        ? 100
        : Math.round(
            ([
              Boolean(input.firstName?.trim()),
              Boolean(input.lastName?.trim()),
              Boolean(input.avatarUrl || input.profilePicture),
              (input.bio?.trim().length ?? 0) >= MIN_BIO_LENGTH,
              hasCommunityAssignment(input),
            ].filter(Boolean).length /
              5) *
              100,
          ),
      done: isSilverProfileReady(input),
      detail: isSilverProfileReady(input)
        ? 'Profile ready'
        : 'Photo, bio, name, and community',
    },
    {
      id: 'location',
      label: 'Location',
      percent: hasLocationPin(input) ? 100 : hasCommunityAssignment(input) ? 50 : 0,
      done: hasLocationPin(input),
      detail: hasLocationPin(input) ? 'Map pin anchored' : 'Pin your home on the map',
    },
    {
      id: 'trust',
      label: 'Trust',
      percent: Math.min(100, Math.round((trust / TRUST_BAOBAB) * 100)),
      done: trust >= TRUST_TREE,
      detail: `${trust} / ${TRUST_TREE} NeyburH for Gold`,
    },
    {
      id: 'activity',
      label: 'Activity',
      percent: Math.min(100, Math.round((coins / HUUD_PLATINUM) * 100)),
      done: coins >= HUUD_SILVER,
      detail: `${coins.toLocaleString()} HuudCoins · ${streak}d streak`,
    },
    {
      id: 'community',
      label: 'Community',
      percent: Math.min(100, Math.round((vouches / MIN_VOUCHES_DIAMOND) * 100)),
      done: vouches >= MIN_VOUCHES_GOLD,
      detail: `${vouches} / ${MIN_VOUCHES_GOLD} vouches for Gold`,
    },
  ];

  const blockers: string[] = [];
  if (!isEmailVerified(input)) blockers.push('Verify your email');
  if (age < MIN_ACCOUNT_DAYS_BRONZE)
    blockers.push(`${MIN_ACCOUNT_DAYS_BRONZE - age} day(s) until Bronze eligible`);
  if (!isSilverProfileReady(input))
    blockers.push('Complete profile: photo, bio, name, and join a community');
  if (tier === 'silver' && !hasLocationPin(input))
    blockers.push('Pin your location on your profile map');
  if (tier === 'silver' && trust < TRUST_TREE && vouches < MIN_VOUCHES_GOLD)
    blockers.push(`Build trust to ${TRUST_TREE} or earn ${MIN_VOUCHES_GOLD} vouches`);
  if (tier === 'silver' && coins < HUUD_SILVER && streak < MIN_STREAK_GOLD)
    blockers.push(`Earn ${HUUD_SILVER} HuudCoins or a ${MIN_STREAK_GOLD}-day streak`);
  if (!hasCleanHistory(input)) blockers.push('Resolve account penalties to advance');

  const percentToNext = nextTier
    ? Math.round(
        axes.reduce((sum, axis) => sum + axis.percent, 0) / axes.length,
      )
    : 100;

  const meta = getVerificationTierMeta(tier);
  const tooltip =
    tier === 'none'
      ? 'Verification not started'
      : `${meta.label} verified · ${meta.description}`;

  return { tier, nextTier, percentToNext, axes, blockers, tooltip };
}

/** Feed/profile badge: show bronze and above. */
export function shouldShowVerificationBadge(tier: VerificationTier): boolean {
  return tier !== 'none';
}
