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
    mutationFn: (payload: {
      body: string;
      mediaUrls?: string[];
      parentId?: string;
    }) => contentService.createComment(postId, payload),
    onMutate: async (newComment) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot previous value
      const previousPostDetails = queryClient.getQueryData(["post", postId]);

      // Optimistically update the post details
      if (previousPostDetails) {
        queryClient.setQueryData(["post", postId], (old: any) => {
          if (!old) return old;
          
          // Helper to add a reply to the correct parent in a nested structure
          const addReplyToComments = (comments: any[], parentId: string, reply: any): any[] => {
            return comments.map(c => {
              if (c.id === parentId || c._id === parentId) {
                return { ...c, replies: [...(c.replies || []), reply] };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: addReplyToComments(c.replies, parentId, reply) };
              }
              return c;
            });
          };

          const optimisticComment = {
            id: `temp-${Date.now()}`,
            body: newComment.body,
            mediaUrls: newComment.mediaUrls || [],
            userId: "current-user", // Will be replaced by real data on success/refetch
            parentId: newComment.parentId,
            replies: [],
            likes: 0,
            createdAt: new Date().toISOString(),
          };

          if (newComment.parentId) {
            return {
              ...old,
              comments: addReplyToComments(old.comments, newComment.parentId, optimisticComment),
              content: {
                ...old.content,
                comments: (old.content?.comments || 0) + 1 // Increment count for replies too
              }
            };
          }

          return {
            ...old,
            comments: [optimisticComment, ...old.comments],
            content: {
              ...old.content,
              comments: (old.content?.comments || 0) + 1 // Increment count for top-level comments
            }
          };
        });
      }

      return { previousPostDetails };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate feed to update comment count on post cards
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
    },
    onError: (err, _, context) => {
      if (context?.previousPostDetails) {
        queryClient.setQueryData(["post", postId], context.previousPostDetails);
      }
      handleApiError(err);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      body,
    }: {
      commentId: string;
      body: string;
    }) => contentService.updateComment(commentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: handleApiError,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.deleteComment(postId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPostDetails = queryClient.getQueryData(["post", postId]);

      if (previousPostDetails) {
        queryClient.setQueryData(["post", postId], (old: any) => {
          if (!old) return old;

          // Helper to remove a comment from nested structure
          const removeCommentFromList = (comments: any[], id: string): any[] => {
            return comments
              .filter(c => c.id !== id && c._id !== id)
              .map(c => ({
                ...c,
                replies: c.replies ? removeCommentFromList(c.replies, id) : []
              }));
          };

          return {
            ...old,
            comments: removeCommentFromList(old.comments, commentId),
            content: {
              ...old.content,
              comments: Math.max(0, (old.content?.comments || 0) - 1) // Decrement count
            }
          };
        });
      }

      return { previousPostDetails };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate feed to update comment count on post cards
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
    },
    onError: (err, _, context) => {
      if (context?.previousPostDetails) {
        queryClient.setQueryData(["post", postId], context.previousPostDetails);
      }
      handleApiError(err);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: handleApiError,
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentService.unlikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
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
