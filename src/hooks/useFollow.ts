/**
 * Follow Hook
 * React Query hooks for follow/unfollow functionality
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followService } from "@/services/follow.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * Hook for managing follow/unfollow state for a specific user
 */
export function useFollow(userId: string | undefined, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  // Get follow status - only if explicitly enabled and userId exists
  const {
    data: followStatusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: async () => {
      const result = await followService.getFollowStatus(userId!);
      // Debug: Log the raw response (apiClient.get already unwraps response.data)
      console.log('🔍 Follow Status Response:', {
        userId,
        rawResponse: result,
        followData: result?.data,
      });
      return result;
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

  // Log any errors
  if (statusError && userId) {
    console.error('❌ Follow Status Error:', statusError);
  }

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => {
      console.log('➕ Following user:', userId);
      return followService.followUser(userId!);
    },
    onSuccess: (response) => {
      console.log('✅ Follow successful:', response);
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
    },
    onError: (error: any) => {
      console.error('❌ Follow error:', error);
      // Handle 409 (already following) gracefully
      if (error.response?.status === 409) {
        console.log('ℹ️ User is already following - updating state');
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
    mutationFn: () => {
      console.log('🚫 Unfollowing user:', userId);
      return followService.unfollowUser(userId!);
    },
    onSuccess: (response) => {
      console.log('✅ Unfollow successful:', response);
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
    onError: (error: any) => {
      console.error('❌ Unfollow error:', error);
      // Handle 404 (not following) gracefully
      if (error.response?.status === 404) {
        console.log('ℹ️ User is not following - updating state');
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
    
    console.log('🔄 Toggle Follow:', {
      userId,
      isCurrentlyFollowing,
      action: isCurrentlyFollowing ? 'UNFOLLOW' : 'FOLLOW',
    });

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
