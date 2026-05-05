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
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: ["gamification", "my-badges"],
    queryFn: async () => {
      const res = await gamificationService.getMyBadges();
      return (res as any)?.data ?? res ?? [];
    },
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
  });
}

export function useMyAchievements() {
  return useQuery({
    queryKey: ["gamification", "my-achievements"],
    queryFn: async () => {
      const res = await gamificationService.getMyAchievements();
      return (res as any)?.data ?? res ?? [];
    },
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
