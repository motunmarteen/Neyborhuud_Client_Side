"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gamificationService } from "@/services/gamification.service";
import { getErrorMessage } from "@/lib/error-handler";

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
      const data = (res as any)?.data ?? res;
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
