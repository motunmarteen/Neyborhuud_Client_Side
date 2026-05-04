/**
 * Gossip Hooks
 * React Query hooks for gossip posts, comments, and mutations
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gossipService } from "@/services/gossip.service";
import { handleApiError } from "@/lib/error-handler";
import type {
  GossipPost,
  GossipComment,
  CreateCommentPayload,
  UpdateGossipPayload,
  DiscussionType,
} from "@/types/gossip";

/**
 * Fetch paginated gossip list with filters
 */
export function useGossipList(filters?: {
  type?: string;
  lga?: string;
  state?: string;
  tag?: string;
  language?: string;
  feedTab?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["gossip", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await gossipService.listGossip({
        ...filters,
        page: pageParam,
        limit: 20,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Fetch a single gossip post with its comments
 */
export function useGossipDetail(gossipId: string | null) {
  return useQuery({
    queryKey: ["gossip-detail", gossipId],
    queryFn: async () => {
      if (!gossipId) throw new Error("Gossip ID required");
      const response = await gossipService.getGossip(gossipId);
      return response.data;
    },
    enabled: !!gossipId,
  });
}

/**
 * Fetch comments for a gossip post with pagination
 */
export function useGossipComments(gossipId: string | null, parentId?: string) {
  return useInfiniteQuery({
    queryKey: ["gossip-comments", gossipId, parentId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!gossipId) throw new Error("Gossip ID required");
      const response = await gossipService.getComments(gossipId, {
        parentId,
        page: pageParam,
        limit: 20,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!gossipId,
  });
}

/**
 * Mutations for gossip interactions (like, delete, update, comment)
 */
export function useGossipMutations(gossipId: string) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => gossipService.likeGossip(gossipId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["gossip-detail", gossipId],
      });
      await queryClient.cancelQueries({ queryKey: ["gossip"] });

      const previousDetail = queryClient.getQueryData([
        "gossip-detail",
        gossipId,
      ]);

      // Optimistic update: toggle isLiked and update likeCount
      queryClient.setQueryData(["gossip-detail", gossipId], (old: any) => {
        if (!old?.gossip) return old;
        const wasLiked = old.gossip.isLiked === true;
        return {
          ...old,
          gossip: {
            ...old.gossip,
            isLiked: !wasLiked,
            likeCount: old.gossip.likeCount + (wasLiked ? -1 : 1),
          },
        };
      });

      // Also optimistically update the list view
      queryClient.setQueriesData({ queryKey: ["gossip"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gossip: (page.gossip || []).map((p: GossipPost) => {
              if ((p.id || p._id) !== gossipId) return p;
              const wasLiked = p.isLiked === true;
              return {
                ...p,
                isLiked: !wasLiked,
                likeCount: p.likeCount + (wasLiked ? -1 : 1),
              };
            }),
          })),
        };
      });

      return { previousDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["gossip-detail", gossipId],
          context.previousDetail,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip-detail", gossipId] });
      queryClient.invalidateQueries({ queryKey: ["gossip"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => gossipService.deleteGossip(gossipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip"] });
      queryClient.removeQueries({ queryKey: ["gossip-detail", gossipId] });
    },
    onError: handleApiError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateGossipPayload) =>
      gossipService.updateGossip(gossipId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip-detail", gossipId] });
      queryClient.invalidateQueries({ queryKey: ["gossip"] });
    },
    onError: handleApiError,
  });

  const commentMutation = useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      gossipService.addComment(gossipId, payload),
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({
        queryKey: ["gossip-detail", gossipId],
      });
      const previous = queryClient.getQueryData(["gossip-detail", gossipId]);

      queryClient.setQueryData(["gossip-detail", gossipId], (old: any) => {
        if (!old) return old;
        const optimisticComment: GossipComment = {
          id: `temp-${Date.now()}`,
          gossipId,
          body: newComment.body,
          anonymous: newComment.anonymous,
          author: newComment.anonymous
            ? {
                id: "anonymous",
                firstName: "Anonymous",
                lastName: "NeyburH",
                name: "Anonymous NeyburH",
                avatarUrl: null,
                username: "anonymous",
              }
            : {
                id: "current-user",
                firstName: "",
                lastName: "",
                name: "You",
                avatarUrl: null,
                username: "",
              },
          parentId: newComment.parentId || null,
          depth: 0,
          replyCount: 0,
          likeCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };

        return {
          ...old,
          comments: newComment.parentId
            ? old.comments
            : [optimisticComment, ...(old.comments || [])],
          gossip: {
            ...old.gossip,
            commentCount: (old.gossip?.commentCount || 0) + 1,
          },
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["gossip-detail", gossipId], context.previous);
      }
      handleApiError(_err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip-detail", gossipId] });
      queryClient.invalidateQueries({
        queryKey: ["gossip-comments", gossipId],
      });
      queryClient.invalidateQueries({ queryKey: ["gossip"] });
    },
  });

  return {
    likeGossip: likeMutation.mutate,
    deleteGossip: deleteMutation.mutateAsync,
    updateGossip: updateMutation.mutateAsync,
    addComment: commentMutation.mutateAsync,
    isLiking: likeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCommenting: commentMutation.isPending,
  };
}

/**
 * Mutations for comment interactions (like, delete)
 */
export function useCommentMutations(gossipId: string) {
  const queryClient = useQueryClient();

  const likeCommentMutation = useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      gossipService.likeComment(gossipId, commentId),
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({
        queryKey: ["gossip-detail", gossipId],
      });
      const previous = queryClient.getQueryData(["gossip-detail", gossipId]);

      // Optimistic update for comment like in detail view
      queryClient.setQueryData(["gossip-detail", gossipId], (old: any) => {
        if (!old?.comments) return old;
        const updateComment = (comments: GossipComment[]): GossipComment[] =>
          comments.map((c) => {
            if ((c.id || c._id) === commentId) {
              const wasLiked = c.isLiked === true;
              return {
                ...c,
                isLiked: !wasLiked,
                likeCount: c.likeCount + (wasLiked ? -1 : 1),
              };
            }
            return c;
          });
        return { ...old, comments: updateComment(old.comments) };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["gossip-detail", gossipId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip-detail", gossipId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      gossipService.deleteComment(gossipId, commentId),
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({
        queryKey: ["gossip-detail", gossipId],
      });
      const previous = queryClient.getQueryData(["gossip-detail", gossipId]);

      queryClient.setQueryData(["gossip-detail", gossipId], (old: any) => {
        if (!old?.comments) return old;
        return {
          ...old,
          comments: old.comments.filter(
            (c: GossipComment) => (c.id || c._id) !== commentId,
          ),
          gossip: {
            ...old.gossip,
            commentCount: Math.max(0, (old.gossip?.commentCount || 1) - 1),
          },
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["gossip-detail", gossipId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gossip-detail", gossipId] });
      queryClient.invalidateQueries({
        queryKey: ["gossip-comments", gossipId],
      });
    },
  });

  return {
    likeComment: (commentId: string) =>
      likeCommentMutation.mutate({ commentId }),
    deleteComment: (commentId: string) =>
      deleteCommentMutation.mutateAsync({ commentId }),
    isLikingComment: likeCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    likingCommentId: likeCommentMutation.variables?.commentId,
    deletingCommentId: deleteCommentMutation.variables?.commentId,
  };
}
