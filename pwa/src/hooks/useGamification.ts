"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nhToast } from "@/lib/toast";
import { gamificationService } from "@/services/gamification.service";
import { getErrorMessage } from "@/lib/error-handler";
import apiClient from "@/lib/api-client";
import { emitCoinsUpdated } from "@/lib/gamification-events";

// ── Queries ────────────────────────────────────────────────────

export function useMyGamificationStats() {
  return useQuery({
    queryKey: ["gamification", "stats"],
    queryFn: async () => {
      const res = await gamificationService.getMyStats();
      return (res as any)?.data ?? res;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLeaderboard(
  timeframe: "daily" | "weekly" | "monthly" | "all-time" = "weekly",
) {
  return useQuery({
    queryKey: ["gamification", "leaderboard", timeframe],
    queryFn: async () => {
      const res = await gamificationService.getLeaderboard(timeframe);
      return (res as any)?.data ?? res ?? [];
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: ["gamification", "my-badges"],
    queryFn: async () => {
      const res = await gamificationService.getMyBadges();
      return (res as any)?.data ?? res ?? [];
    },
    retry: false,
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: ["gamification", "badges"],
    queryFn: async () => {
      const res = await gamificationService.getBadges();
      return (res as any)?.data ?? res ?? [];
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useMyAchievements() {
  return useQuery({
    queryKey: ["gamification", "my-achievements"],
    queryFn: async () => {
      const res = await gamificationService.getMyAchievements();
      return (res as any)?.data ?? res ?? [];
    },
    retry: false,
  });
}

export function useMyStreak() {
  return useQuery({
    queryKey: ["gamification", "streak"],
    queryFn: async () => {
      const res = await gamificationService.getStreak();
      return (res as any)?.data ?? res;
    },
    staleTime: 60_000,
    retry: false,
    enabled: typeof window !== "undefined" && apiClient.isAuthenticated(),
  });
}

// ── Mutations ──────────────────────────────────────────────────

/**
 * Daily check-in. Says what was paid wherever it is tapped (streak cards
 * used to stay silent). Pass `showToast: false` when the screen shows its own
 * celebration, like the daily check-in pop-up.
 */
export function useCheckIn(onSuccess?: (data: any) => void, { showToast = true }: { showToast?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gamificationService.checkIn(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["gamification", "streak"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "transactions"] });
      const data = (res as any)?.data ?? res;
      if (data?.totalHuudCoins != null) {
        emitCoinsUpdated({ totalHuudCoins: data.totalHuudCoins });
      } else {
        emitCoinsUpdated();
      }
      if (showToast) {
        if (data?.alreadyCheckedIn) {
          nhToast.info("You don check in today already", "Come back tomorrow to keep your streak.");
        } else if (data?.coinsEarned > 0) {
          const bonus = data?.bonusCoins > 0 ? ` (with +${data.bonusCoins} streak bonus)` : "";
          nhToast.thanks({ emoji: "🔥", title: `Day ${data.streak} check-in`, sub: `See you tomorrow${bonus}.`, coins: data.coinsEarned });
        }
      }
      onSuccess?.(data);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useClaimAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: string) =>
      gamificationService.claimReward(achievementId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["gamification", "my-achievements"],
      });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "transactions"] });
      const data = (res as any)?.data ?? res;
      emitCoinsUpdated(data?.totalHuudCoins != null ? { totalHuudCoins: data.totalHuudCoins } : undefined);
      const coins = data?.reward?.points ?? 0;
      if (coins > 0) {
        nhToast.thanks({ emoji: "🏆", title: "Reward claimed", sub: "Well done!", coins });
      } else {
        nhToast.thanks({ emoji: "🏆", title: "Reward claimed", sub: "Well done!" });
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

// ── Earn / Award ───────────────────────────────────────────────

/**
 * Called after a user action that may earn HuudCredit.
 *
 * Coins are awarded SERVER-SIDE by the endpoint that performed the action
 * (create post, comment, event, job, listing, ...) — the client never asks
 * to be paid. This hook only refreshes the wallet so the new balance shows.
 * The (action, metadata) parameters are kept for call-site compatibility.
 */
export function useAwardCoins() {
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_action: string, _metadata?: Record<string, unknown>) => {
    queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
    queryClient.invalidateQueries({ queryKey: ["gamification", "transactions"] });
  };
}

// ── Wallet ─────────────────────────────────────────────────────

export function useWallet() {
  return useQuery({
    queryKey: ["gamification", "wallet"],
    queryFn: async () => {
      const res = await gamificationService.getWallet();
      return (res as any)?.data ?? res;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ["gamification", "transactions", page],
    queryFn: async () => {
      const res = await gamificationService.getTransactions(page);
      const raw = (res as any)?.data ?? res;
      // The server puts paging under `pagination`; reading the top level
      // left the history stuck on page 1.
      const paging = raw?.pagination ?? raw;
      return {
        transactions: Array.isArray(raw?.transactions) ? raw.transactions : Array.isArray(raw) ? raw : [],
        total: paging?.total ?? 0,
        page: paging?.page ?? page,
        totalPages: paging?.totalPages ?? 1,
      };
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useTipUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, amount }: { recipientId: string; amount: 50 | 100 | 200 | 500 }) =>
      gamificationService.tipUser(recipientId, amount),
    onSuccess: () => {
      for (const key of ["wallet", "stats", "transactions"]) {
        queryClient.invalidateQueries({ queryKey: ["gamification", key] });
      }
      emitCoinsUpdated();
    },
  });
}

export function usePinPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, days }: { postId: string; days: 1 | 7 }) =>
      gamificationService.pinPost(postId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
