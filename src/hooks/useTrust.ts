'use client';

/**
 * useTrust — TrustOS Vouching Hooks
 *
 * Provides vouching query/mutation hooks for the profile page.
 * All queries use retry:false so a 404 backend (not yet live) gracefully
 * returns undefined without crashing the UI.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trustService, VouchStatus } from "@/services/trust.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Safely unwrap any API envelope shape. */
function unwrap<T>(res: any): T | undefined {
  return (res as any)?.data ?? res ?? undefined;
}

// ─── Trust Tier ──────────────────────────────────────────────────────────────

export type TrustTier = "seedling" | "sapling" | "tree" | "baobab";

export interface TrustTierInfo {
  tier: TrustTier;
  label: string;
  icon: string;          // emoji
  color: string;         // Tailwind text colour
  bg: string;            // Tailwind bg colour
  description: string;
  minScore: number;
}

export const TRUST_TIERS: TrustTierInfo[] = [
  {
    tier: "seedling",
    label: "Seedling",
    icon: "🌱",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    description: "Email verified — just getting started in the Huud.",
    minScore: 0,
  },
  {
    tier: "sapling",
    label: "Sapling",
    icon: "🌿",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    description: "Profile complete — growing roots in the Huud.",
    minScore: 100,
  },
  {
    tier: "tree",
    label: "Tree",
    icon: "🌳",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    description: "Community vouched — NeyburHs trust you.",
    minScore: 300,
  },
  {
    tier: "baobab",
    label: "Baobab",
    icon: "🌲",
    color: "text-lime-700",
    bg: "bg-lime-50 border-lime-200",
    description: "Highest trust — a permanent pillar of the Huud.",
    minScore: 600,
  },
];

/** Derive a user's trust tier from their numeric score. */
export function getTrustTier(score: number): TrustTierInfo {
  // Iterate from highest to lowest and return the first match
  for (let i = TRUST_TIERS.length - 1; i >= 0; i--) {
    if (score >= TRUST_TIERS[i].minScore) return TRUST_TIERS[i];
  }
  return TRUST_TIERS[0];
}

// ─── Vouch Status ────────────────────────────────────────────────────────────

/**
 * Fetch the current user's vouch relationship with a target user.
 * Returns a safe fallback object when the backend returns 404.
 */
export function useVouchStatus(
  userId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<VouchStatus>({
    queryKey: ["vouch-status", userId],
    queryFn: async () => {
      const res = await trustService.getVouchStatus(userId!);
      return unwrap<VouchStatus>(res) ?? {
        hasVouched: false,
        canVouch: false,
        vouchCount: 0,
        vouchesNeeded: 3,
      };
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 30_000,
    // Fallback value shown while loading / on error
    placeholderData: {
      hasVouched: false,
      canVouch: false,
      vouchCount: 0,
      vouchesNeeded: 3,
    },
  });
}

// ─── Vouch Mutation ──────────────────────────────────────────────────────────

/** Vouch for a user. Optimistically updates the vouch-status cache. */
export function useVouchUser(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trustService.vouchForUser(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["vouch-status", userId] });
      const prev = queryClient.getQueryData<VouchStatus>(["vouch-status", userId]);
      // Optimistic update
      queryClient.setQueryData<VouchStatus>(["vouch-status", userId], (old) => ({
        hasVouched: true,
        canVouch: old?.canVouch ?? false,
        vouchCount: (old?.vouchCount ?? 0) + 1,
        vouchesNeeded: Math.max(0, (old?.vouchesNeeded ?? 3) - 1),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back optimistic update
      if (ctx?.prev) {
        queryClient.setQueryData(["vouch-status", userId], ctx.prev);
      }
      toast.error("Could not submit vouch — please try again.");
    },
    onSuccess: (res) => {
      const data = unwrap<{ message: string; trustScore: number }>(res);
      toast.success(data?.message ?? "Vouch submitted! You've backed this NeyburH.", {
        description: data?.trustScore
          ? `Their NeyburH Score is now ${data.trustScore}`
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["vouch-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
    },
  });
}

// ─── Revoke Vouch Mutation ───────────────────────────────────────────────────

/** Revoke a previously submitted vouch. */
export function useRevokeVouch(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trustService.revokeVouch(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["vouch-status", userId] });
      const prev = queryClient.getQueryData<VouchStatus>(["vouch-status", userId]);
      queryClient.setQueryData<VouchStatus>(["vouch-status", userId], (old) => ({
        hasVouched: false,
        canVouch: old?.canVouch ?? false,
        vouchCount: Math.max(0, (old?.vouchCount ?? 0) - 1),
        vouchesNeeded: (old?.vouchesNeeded ?? 3) + 1,
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["vouch-status", userId], ctx.prev);
      }
      toast.error("Could not revoke vouch — please try again.");
    },
    onSuccess: () => {
      toast.success("Vouch revoked.");
      queryClient.invalidateQueries({ queryKey: ["vouch-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
