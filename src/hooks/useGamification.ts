"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function useCheckIn(onSuccess?: (data: any) => void) {
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
      const data = (res as any)?.data ?? res;
      const points = data?.reward?.points ?? data?.points;
      if (points) {
        toast.success(`+${points} points claimed! 🎉`);
      } else {
        toast.success("Reward claimed!");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

// ── Earn / Award ───────────────────────────────────────────────

/**
 * Returns a stable fire-and-forget function to award HuudCoins for a user action.
 * Silently swallows errors (backend may not be ready yet).
 * Invalidates wallet + stats cache on success so balances refresh automatically.
 */
export function useAwardCoins() {
  const queryClient = useQueryClient();
  return (action: string, metadata?: Record<string, unknown>) => {
    gamificationService
      .awardCoins(action, metadata)
      .then((res: any) => {
        const earned = res?.data?.awarded ?? res?.awarded;
        if (earned) {
          queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
          queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
          queryClient.invalidateQueries({ queryKey: ["gamification", "transactions"] });
        }
      })
      .catch(() => {
        /* backend not yet implemented — fail silently */
      });
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
      return {
        transactions: Array.isArray(raw?.transactions) ? raw.transactions : Array.isArray(raw) ? raw : [],
        total: raw?.total ?? 0,
        page: raw?.page ?? page,
        totalPages: raw?.totalPages ?? 1,
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
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
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
