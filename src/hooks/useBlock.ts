/**
 * Block Hook
 * React Query hooks for block/unblock functionality
 */

'use client';

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blockService } from "@/services/block.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * Hook for managing block/unblock state for a specific user
 */
export function useBlock(userId: string | undefined, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  // Get block status
  const {
    data: blockStatusData,
    isLoading: isLoadingStatus,
  } = useQuery({
    queryKey: ["block-status", userId],
    queryFn: () => blockService.getBlockStatus(userId!),
    enabled: options?.enabled !== false && !!userId,
    retry: false,
    throwOnError: false,
    staleTime: 30000,
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: (reason?: string) => blockService.blockUser(userId!, reason),
    onSuccess: () => {
      // Update block status cache
      queryClient.setQueryData(["block-status", userId], {
        data: { isBlocked: true, isBlockedByThem: false, isEitherBlocked: true },
      });

      // Invalidate related queries - follow status is now void
      queryClient.setQueryData(["follow-status", userId], {
        data: { isFollowing: false, followsYou: false, isMutual: false },
      });

      queryClient.invalidateQueries({ queryKey: ["block-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) return; // Already blocked
      handleApiError(error);
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: () => blockService.unblockUser(userId!),
    onSuccess: () => {
      queryClient.setQueryData(["block-status", userId], {
        data: { isBlocked: false, isBlockedByThem: false, isEitherBlocked: false },
      });

      queryClient.invalidateQueries({ queryKey: ["block-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  const toggleBlock = (reason?: string) => {
    if (!userId) return;
    const isCurrentlyBlocked = blockStatusData?.data?.isBlocked;
    if (isCurrentlyBlocked) {
      unblockMutation.mutate();
    } else {
      blockMutation.mutate(reason);
    }
  };

  return {
    isBlocked: blockStatusData?.data?.isBlocked ?? false,
    isBlockedByThem: blockStatusData?.data?.isBlockedByThem ?? false,
    isEitherBlocked: blockStatusData?.data?.isEitherBlocked ?? false,
    isLoadingStatus,
    blockUser: blockMutation.mutate,
    unblockUser: unblockMutation.mutate,
    toggleBlock,
    isPending: blockMutation.isPending || unblockMutation.isPending,
  };
}

/**
 * Hook for fetching the blocked users list
 */
export function useBlockedUsers(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ["blocked-users", page, limit],
    queryFn: () => blockService.getBlockedUsers(page, limit),
    staleTime: 30000,
  });
}
