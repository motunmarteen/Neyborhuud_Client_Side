/**
 * Follow Hook
 * React Query hooks for follow/unfollow functionality
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { followService } from "@/services/follow.service";
import { handleApiError } from "@/lib/error-handler";
import { useAwardCoins } from "@/hooks/useGamification";

export interface MilestonePayload {
  count: number;
  label: string;
  emoji: string;
  hcAwarded: number;
  celebrationTier: 1 | 2 | 3 | 4 | 5;
}

export interface MilestoneInfo {
  count: number;
  label: string;
  emoji: string;
  hcReward: number;
  celebrationTier: 1 | 2 | 3 | 4 | 5;
  achieved: boolean;
  rewarded: boolean;
}

export interface MilestoneStatusData {
  followerCount: number;
  milestones: MilestoneInfo[];
  nextMilestone: {
    count: number;
    label: string;
    emoji: string;
    hcReward: number;
    progressPercent: number;
  } | null;
}

/**
 * Hook for managing follow/unfollow state for a specific user
 */
export function useFollow(userId: string | undefined, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();
  const [pendingMilestone, setPendingMilestone] = useState<MilestonePayload | null>(null);
  const clearMilestone = useCallback(() => setPendingMilestone(null), []);

  // Get follow status - only if explicitly enabled and userId exists
  const {
    data: followStatusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: async () => {
      return followService.getFollowStatus(userId!);
    },
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    // Don't throw error to avoid crashing the page
    throwOnError: false,
    // Refetch on mount to ensure we have current state
    refetchOnMount: true,
    // Refetch on window focus to keep state updated
    refetchOnWindowFocus: true,
    // Consider data stale after 10 seconds
    staleTime: 10000,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => followService.followUser(userId!),
    onSuccess: (response: unknown) => {
      // Update follow status cache
      queryClient.setQueryData(["follow-status", userId], {
        data: {
          isFollowing: true,
          followsYou: followStatusData?.data?.followsYou || false,
          isMutual: followStatusData?.data?.followsYou || false ? true : false,
        },
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow-milestones"] });
      awardCoins("user_followed");

      // If the person we just followed hit a milestone, surface it
      const r = response as { data?: { milestone?: MilestonePayload }; milestone?: MilestonePayload } | null;
      const m = r?.data?.milestone ?? r?.milestone ?? null;
      if (m) setPendingMilestone(m);
    },
    onError: (error: { response?: { status?: number } }) => {
      if (error.response?.status === 409) {
        // Update state to reflect that user is following
        queryClient.setQueryData(["follow-status", userId], {
          data: {
            isFollowing: true,
            followsYou: followStatusData?.data?.followsYou || false,
            isMutual: followStatusData?.data?.followsYou || false,
          },
        });
        // Refresh the data from server
        queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
        queryClient.invalidateQueries({ queryKey: ["followers", userId] });
        return; // Don't show error toast
      }
      // For other errors, use the error handler
      handleApiError(error);
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => followService.unfollowUser(userId!),
    onSuccess: () => {
      // Update follow status cache
      queryClient.setQueryData(["follow-status", userId], {
        data: {
          isFollowing: false,
          followsYou: followStatusData?.data?.followsYou || false,
          isMutual: false,
        },
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
    onError: (error: { response?: { status?: number } }) => {
      if (error.response?.status === 404) {
        // Update state to reflect that user is not following
        queryClient.setQueryData(["follow-status", userId], {
          data: {
            isFollowing: false,
            followsYou: followStatusData?.data?.followsYou || false,
            isMutual: false,
          },
        });
        // Refresh the data from server
        queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
        queryClient.invalidateQueries({ queryKey: ["followers", userId] });
        return; // Don't show error toast
      }
      // For other errors, use the error handler
      handleApiError(error);
    },
  });

  const toggleFollow = () => {
    if (!userId) return;

    const isCurrentlyFollowing = followStatusData?.data?.isFollowing;

    if (isCurrentlyFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    followStatus: followStatusData?.data,
    isFollowing: followStatusData?.data?.isFollowing ?? false,
    followsYou: followStatusData?.data?.followsYou ?? false,
    isMutual: followStatusData?.data?.isMutual ?? false,
    isLoadingStatus,
    statusError,
    followUser: followMutation.mutate,
    unfollowUser: unfollowMutation.mutate,
    toggleFollow,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
    isPending: followMutation.isPending || unfollowMutation.isPending,
    // Milestone celebration
    pendingMilestone,
    clearMilestone,
    // Debug values
    _rawData: followStatusData,
  };
}

/**
 * Hook for fetching a user's followers list
 */
export function useFollowers(
  userId: string | undefined,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: ["followers", userId, page, limit],
    queryFn: () => followService.getFollowers(userId!, page, limit),
    enabled: !!userId,
    // Refetch on window focus to keep counts updated
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook for fetching a user's following list
 */
export function useFollowing(
  userId: string | undefined,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: ["following", userId, page, limit],
    queryFn: () => followService.getFollowing(userId!, page, limit),
    enabled: !!userId,
    // Refetch on window focus to keep counts updated
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook for fetching lightweight follow counts
 */
export function useFollowCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: () => followService.getFollowCounts(userId!),
    enabled: !!userId,
    refetchOnWindowFocus: true,
    staleTime: 15000,
  });
}

/**
 * Hook for the authenticated user's follower milestone status.
 * Shows progress toward the next milestone and which ones are already claimed.
 */
export function useMyMilestoneStatus() {
  return useQuery<MilestoneStatusData>({
    queryKey: ["follow-milestones"],
    queryFn: async () => {
      const res = await followService.getMyMilestoneStatus();
      return ((res as { data?: MilestoneStatusData })?.data ?? res) as MilestoneStatusData;
    },
    retry: false,
    throwOnError: false,
    staleTime: 60_000,
  });
}
