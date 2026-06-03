'use client';

/**
 * useTrust — TrustOS Vouching & Activity Hooks
 *
 * Provides vouching query/mutation hooks for the profile page,
 * the trust activity log, vouch lists, and tier privileges.
 * All queries use retry:false so a 404 backend gracefully returns
 * undefined without crashing the UI.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  trustService,
  VouchStatus,
  VouchRecord,
  TrustActivityEntry,
  TrustProfileResponse,
  TRUST_EVENT_META,
} from "@/services/trust.service";
import type { VouchMetrics } from "@/services/trust.service";
import {
  TRUST_TIERS as BASE_TRUST_TIERS,
  getTrustTier as getBaseTrustTier,
  TrustTier as BaseTrustTier,
} from "@/lib/trust-economy";
import {
  getPrivilegesForTier,
  TrustPrivileges,
} from "@/lib/trust-privileges";

// ─── Re-export types used across the app ────────────────────────────────────
export type { TrustActivityEntry, TrustEventType } from "@/services/trust.service";
export { TRUST_EVENT_META } from "@/services/trust.service";
export type { TrustPrivileges } from "@/lib/trust-privileges";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Safely unwrap any API envelope shape. */
function unwrap<T>(res: unknown): T | undefined {
  return (res as any)?.data ?? (res as any) ?? undefined;
}

/** Safely coerce an API response to an array. */
function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object") {
    const v = val as Record<string, unknown>;
    for (const key of ["data", "items", "results", "recentEvents", "events"]) {
      if (Array.isArray(v[key])) return v[key] as T[];
    }
  }
  return [];
}

// ─── Trust Tier ──────────────────────────────────────────────────────────────

export type TrustTier = BaseTrustTier;

export interface TrustTierInfo {
  tier: TrustTier;
  label: string;
  icon: string;          // emoji
  color: string;         // Tailwind text colour
  bg: string;            // Tailwind bg colour
  description: string;
  minScore: number;
}

export const TRUST_TIERS: TrustTierInfo[] = BASE_TRUST_TIERS.map((tier) => ({
  ...tier,
  color:
    tier.tier === "seedling"
      ? "text-emerald-700"
      : tier.tier === "sapling"
      ? "text-teal-700"
      : tier.tier === "tree"
      ? "text-green-700"
      : "text-primary700",
  bg:
    tier.tier === "seedling"
      ? "bg-emerald-50 border-emerald-200"
      : tier.tier === "sapling"
      ? "bg-teal-50 border-teal-200"
      : tier.tier === "tree"
      ? "bg-green-50 border-green-200"
      : "bg-primary50 border-lime-200",
}));

/** Derive a user's trust tier from their numeric score. */
export function getTrustTier(score: number): TrustTierInfo {
  const tier = getBaseTrustTier(score);
  return TRUST_TIERS.find((item) => item.tier === tier.tier) ?? TRUST_TIERS[0];
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
      const raw = unwrap<VouchStatus>(res);
      // Normalize: coerce undefined proximity fields (old API) to null/false so
      // the UI doesn't flicker or misread them as meaningful values.
      return {
        hasVouched: raw?.hasVouched ?? false,
        canVouch: raw?.canVouch ?? false,
        vouchCount: raw?.vouchCount ?? 0,
        vouchesNeeded: raw?.vouchesNeeded ?? 3,
        distanceMeters: raw?.distanceMeters ?? null,
        withinRange: raw?.withinRange ?? null,        // null = "not known"
        locationRequired: raw?.locationRequired ?? false,
      };
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 30_000,
    // Placeholder shown while loading — keep neutral so nothing flickers
    placeholderData: {
      hasVouched: false,
      canVouch: false,
      vouchCount: 0,
      vouchesNeeded: 3,
      distanceMeters: null,
      withinRange: null,
      locationRequired: false,   // don't show "location needed" badge while loading
    },
  });
}

// ─── Vouch List ──────────────────────────────────────────────────────────────

/**
 * Fetch all vouches received by a user (list of voucher profiles).
 * Used to render the "Vouched by …" section on the profile page.
 */
export function useVouches(
  userId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<VouchRecord[]>({
    queryKey: ["vouches", userId],
    queryFn: async () => {
      const res = await trustService.getVouches(userId!);
      return toArray<VouchRecord>(unwrap(res));
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 60_000,
    placeholderData: [],
  });
}

// ─── Vouch Metrics (counts) ───────────────────────────────────────────────────

/**
 * Fetch lightweight vouch counts for profile surfaces.
 * Returns `{ received, given }` for the requested user.
 */
export function useVouchMetrics(
  userId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<VouchMetrics>({
    queryKey: ["vouch-metrics", userId],
    queryFn: async () => {
      const res = await trustService.getVouchMetrics(userId!);
      const raw = unwrap<VouchMetrics>(res);
      return {
        received: raw?.received ?? 0,
        given: raw?.given ?? 0,
      };
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 60_000,
    placeholderData: { received: 0, given: 0 },
  });
}

// ─── Trust Profile + Activity Log ────────────────────────────────────────────

/**
 * Fetch the authenticated user's trust profile including recent event log.
 * Maps backend events to our typed `TrustActivityEntry[]`.
 */
export function useMyTrustProfile() {
  return useQuery<TrustProfileResponse>({
    queryKey: ["trust", "profile", "me"],
    queryFn: async () => {
      const res = await trustService.getMyTrustProfile();
      const profile = unwrap<TrustProfileResponse>(res);
      return profile ?? { score: 0, isVerified: false, recentEvents: [] };
    },
    retry: false,
    throwOnError: false,
    staleTime: 30_000,
    placeholderData: { score: 0, isVerified: false, recentEvents: [] },
  });
}

/**
 * Fetch a public user's trust profile.
 */
export function useUserTrustProfile(
  userId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<TrustProfileResponse>({
    queryKey: ["trust", "profile", userId],
    queryFn: async () => {
      const res = await trustService.getUserTrustProfile(userId!);
      const profile = unwrap<TrustProfileResponse>(res);
      return profile ?? { score: 0, isVerified: false, recentEvents: [] };
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 60_000,
    placeholderData: { score: 0, isVerified: false, recentEvents: [] },
  });
}

// ─── Trust Privileges ────────────────────────────────────────────────────────

/**
 * Derive the full privilege set for a given trust score.
 * Pure computation — no network call.
 */
export function useTrustPrivileges(score: number): TrustPrivileges {
  const tierInfo = getTrustTier(score);
  return getPrivilegesForTier(tierInfo.tier);
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
      // Optimistic update — preserve proximity fields so the badge doesn't disappear
      queryClient.setQueryData<VouchStatus>(["vouch-status", userId], (old) => ({
        ...old,
        hasVouched: true,
        canVouch: old?.canVouch ?? false,
        vouchCount: (old?.vouchCount ?? 0) + 1,
        vouchesNeeded: Math.max(0, (old?.vouchesNeeded ?? 3) - 1),
        distanceMeters: old?.distanceMeters ?? null,
        withinRange: old?.withinRange ?? null,
        locationRequired: old?.locationRequired ?? false,
      } as VouchStatus));
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      // Roll back optimistic update
      if (ctx?.prev) {
        queryClient.setQueryData(["vouch-status", userId], ctx.prev);
      }
      // Surface meaningful proximity / tier error messages from the backend
      const msg: string =
        err?.response?.data?.message ||
        err?.message ||
        "Could not submit vouch — please try again.";
      toast.error(msg);
    },
    onSuccess: (res) => {
      const data = unwrap<{ message: string; trustScore: number }>(res);
      toast.success(data?.message ?? "Vouch submitted! You've backed this NeyburH.", {
        description: data?.trustScore
          ? `Their NeyburH Score is now ${data.trustScore}`
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["vouch-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["vouches", userId] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trust", "profile", "me"] });
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
      // Preserve ALL existing fields (including proximity) — only flip hasVouched + counts
      queryClient.setQueryData<VouchStatus>(["vouch-status", userId], (old) => ({
        ...old,
        hasVouched: false,
        canVouch: old?.canVouch ?? false,
        vouchCount: Math.max(0, (old?.vouchCount ?? 0) - 1),
        vouchesNeeded: (old?.vouchesNeeded ?? 3) + 1,
        distanceMeters: old?.distanceMeters ?? null,
        withinRange: old?.withinRange ?? null,
        locationRequired: old?.locationRequired ?? false,
      } as VouchStatus));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["vouch-status", userId], ctx.prev);
      }
      toast.error("Could not revoke vouch — please try again.");
    },
    onSuccess: () => {
      toast.success("Vouch revoked.", {
        description: "Your NeyburH Score has been adjusted.",
      });
      queryClient.invalidateQueries({ queryKey: ["vouch-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["vouches", userId] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["trust", "profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["trust", "profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
    },
  });
}

