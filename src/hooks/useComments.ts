/**
 * Comments Hook
 * Manages post comments with React Query
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { contentService } from "@/services/content.service";
import { handleApiError } from "@/lib/error-handler";

/**
 * Hook for post comments
 */
export function useComments(postId: string | null) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam = 1 }) => {
      if (!postId) throw new Error("Post ID required");
      return contentService.getComments(postId, pageParam, 20);
    },
    getNextPageParam: (lastPage) => {
      const paginatedData = lastPage.data as any;
      return paginatedData?.pagination?.hasMore
        ? paginatedData.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!postId,
  });
}

/**
 * Hook for comment mutations
 */
export function useCommentMutations(postId: string) {
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => contentService.createComment(postId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: handleApiError,
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => contentService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: handleApiError,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: handleApiError,
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: handleApiError,
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.unlikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: handleApiError,
  });

  return {
    createComment: createCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    likeComment: likeCommentMutation.mutateAsync,
    unlikeComment: unlikeCommentMutation.mutateAsync,

    isCreating: createCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
  };
}
