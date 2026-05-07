/**
 * TrustOS Tier Privileges
 *
 * Single source of truth for what each trust tier unlocks across
 * posting, marketplace, vouching, moderation, and dispute systems.
 */

import type { TrustTier } from "./trust-economy";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrustPrivileges {
  tier: TrustTier;

  // ── Content / Posts ────────────────────────────────────────────────────────
  canPost: boolean;
  canPostJobs: boolean;
  canPostServices: boolean;
  canPostEvents: boolean;
  dailyPostLimit: number; // max posts per 24h window

  // ── Marketplace ────────────────────────────────────────────────────────────
  canListMarketplace: boolean;
  maxActiveListings: number;
  /** Null = no badge; non-null = badge label shown on listings */
  marketplaceBadge: string | null;
  /** Colour class for the badge chip */
  marketplaceBadgeColor: string;
  canGetFeatured: boolean; // eligible for boosted/featured placement

  // ── Vouching ───────────────────────────────────────────────────────────────
  canVouch: boolean;
  maxOutgoingVouches: number; // max active vouches at a time

  // ── Moderation & Disputes ─────────────────────────────────────────────────
  /**
   * Multiplier applied when this user's dispute vote is counted.
   * Higher = more weight in community moderation decisions.
   */
  disputeWeight: number;
  moderationTier: "standard" | "elevated" | "priority" | "trusted";

  // ── UI ────────────────────────────────────────────────────────────────────
  /** Short human-readable summary of this tier's abilities */
  summary: string;
  /** Specific privilege labels for the UI list */
  privilegeList: PrivilegeEntry[];
}

export interface PrivilegeEntry {
  label: string;
  description: string;
  unlocked: boolean;
  icon: string; // material-symbols name
}

// ─── Definitions ─────────────────────────────────────────────────────────────

export const TIER_PRIVILEGES: Record<TrustTier, TrustPrivileges> = {
  seedling: {
    tier: "seedling",
    canPost: true,
    canPostJobs: false,
    canPostServices: false,
    canPostEvents: false,
    dailyPostLimit: 5,
    canListMarketplace: false,
    maxActiveListings: 0,
    marketplaceBadge: null,
    marketplaceBadgeColor: "",
    canGetFeatured: false,
    canVouch: false,
    maxOutgoingVouches: 0,
    disputeWeight: 0.5,
    moderationTier: "standard",
    summary: "New community member. Build trust to unlock more.",
    privilegeList: [
      { label: "Basic posting", description: "Post updates, photos, and community news (5/day)", unlocked: true, icon: "edit_square" },
      { label: "Job listings", description: "Post job opportunities in your neighbourhood", unlocked: false, icon: "work" },
      { label: "Service listings", description: "Offer your skills and services", unlocked: false, icon: "handyman" },
      { label: "Marketplace", description: "Buy and sell in the NeyborHuud marketplace", unlocked: false, icon: "storefront" },
      { label: "Vouch others", description: "Stake your reputation to vouch for neighbours", unlocked: false, icon: "handshake" },
      { label: "Dispute voting", description: "Vote has standard community weight (0.5×)", unlocked: true, icon: "gavel" },
      { label: "Featured listings", description: "Get boosted placement in marketplace and jobs", unlocked: false, icon: "star" },
    ],
  },

  sapling: {
    tier: "sapling",
    canPost: true,
    canPostJobs: true,
    canPostServices: true,
    canPostEvents: false,
    dailyPostLimit: 15,
    canListMarketplace: true,
    maxActiveListings: 3,
    marketplaceBadge: null,
    marketplaceBadgeColor: "",
    canGetFeatured: false,
    canVouch: false,
    maxOutgoingVouches: 0,
    disputeWeight: 1.0,
    moderationTier: "elevated",
    summary: "Growing neighbour. Marketplace and job listings unlocked.",
    privilegeList: [
      { label: "Basic posting", description: "Post updates, photos, and community news (15/day)", unlocked: true, icon: "edit_square" },
      { label: "Job listings", description: "Post job opportunities in your neighbourhood", unlocked: true, icon: "work" },
      { label: "Service listings", description: "Offer your skills and services", unlocked: true, icon: "handyman" },
      { label: "Marketplace", description: "List up to 3 active products in the marketplace", unlocked: true, icon: "storefront" },
      { label: "Vouch others", description: "Stake your reputation to vouch for neighbours", unlocked: false, icon: "handshake" },
      { label: "Dispute voting", description: "Vote has full community weight (1×)", unlocked: true, icon: "gavel" },
      { label: "Featured listings", description: "Get boosted placement in marketplace and jobs", unlocked: false, icon: "star" },
    ],
  },

  tree: {
    tier: "tree",
    canPost: true,
    canPostJobs: true,
    canPostServices: true,
    canPostEvents: true,
    dailyPostLimit: 30,
    canListMarketplace: true,
    maxActiveListings: 10,
    marketplaceBadge: "Trusted Seller",
    marketplaceBadgeColor: "bg-emerald-500/90 text-white",
    canGetFeatured: true,
    canVouch: true,
    maxOutgoingVouches: 3,
    disputeWeight: 1.5,
    moderationTier: "priority",
    summary: "Established neighbour. Trusted seller badge and vouching unlocked.",
    privilegeList: [
      { label: "Full posting", description: "Post anything including events (30/day)", unlocked: true, icon: "edit_square" },
      { label: "Job & service listings", description: "Post unlimited jobs and services", unlocked: true, icon: "work" },
      { label: "Event creation", description: "Create and host community events", unlocked: true, icon: "event" },
      { label: "Marketplace + Trusted badge", description: "Up to 10 listings with 🌳 Trusted Seller badge", unlocked: true, icon: "storefront" },
      { label: "Vouch 3 neighbours", description: "Vouch for up to 3 community members", unlocked: true, icon: "handshake" },
      { label: "Priority dispute weight", description: "Vote carries 1.5× weight in disputes", unlocked: true, icon: "gavel" },
      { label: "Featured listings", description: "Eligible for boosted marketplace placement", unlocked: true, icon: "star" },
    ],
  },

  baobab: {
    tier: "baobab",
    canPost: true,
    canPostJobs: true,
    canPostServices: true,
    canPostEvents: true,
    dailyPostLimit: 100,
    canListMarketplace: true,
    maxActiveListings: 50,
    marketplaceBadge: "Community Elder",
    marketplaceBadgeColor: "bg-lime-500/90 text-slate-900",
    canGetFeatured: true,
    canVouch: true,
    maxOutgoingVouches: 10,
    disputeWeight: 2.5,
    moderationTier: "trusted",
    summary: "Community Elder. Maximum trust, highest dispute weight, full marketplace access.",
    privilegeList: [
      { label: "Unlimited posting", description: "Post across all content types (100/day)", unlocked: true, icon: "edit_square" },
      { label: "Full marketplace", description: "Up to 50 active listings with 🌴 Community Elder badge", unlocked: true, icon: "storefront" },
      { label: "Vouch 10 neighbours", description: "Vouch for up to 10 community members", unlocked: true, icon: "handshake" },
      { label: "Elder dispute weight", description: "Vote carries 2.5× weight — shapes community decisions", unlocked: true, icon: "gavel" },
      { label: "Priority moderation", description: "Reports and disputes resolved first", unlocked: true, icon: "shield" },
      { label: "Featured placement", description: "Premium algorithmic boost on all listings", unlocked: true, icon: "star" },
      { label: "Community Elder recognition", description: "Special badge across NeyborHuud profile and posts", unlocked: true, icon: "military_tech" },
    ],
  },
};

/**
 * Get the privilege set for a given trust tier.
 */
export function getPrivilegesForTier(tier: TrustTier): TrustPrivileges {
  return TIER_PRIVILEGES[tier];
}

/**
 * Check if a user at the given score has a specific marketplace badge.
 */
export function getMarketplaceBadge(tier: TrustTier): { label: string; colorClass: string } | null {
  const p = TIER_PRIVILEGES[tier];
  if (!p.marketplaceBadge) return null;
  return { label: p.marketplaceBadge, colorClass: p.marketplaceBadgeColor };
}

/**
 * Returns true if the user's tier is eligible to vouch.
 */
export function canUserVouch(tier: TrustTier): boolean {
  return TIER_PRIVILEGES[tier].canVouch;
}
