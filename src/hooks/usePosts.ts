/**
 * Content/Posts Hook
 * Manages posts and feed with React Query
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { contentService } from "@/services/content.service";
import { CreatePostPayload } from "@/types/api";
import { handleApiError } from "@/lib/error-handler";

/**
 * Hook for infinite scrolling posts feed
 */
export function usePosts(filter?: "all" | "friends" | "neighborhood") {
  return useInfiniteQuery({
    queryKey: ["posts", filter],
    queryFn: ({ pageParam = 1 }) =>
      contentService.getPosts(pageParam, 20, filter),
    getNextPageParam: (lastPage) => {
      if (!lastPage.data) return undefined;
      const paginatedData = lastPage.data as any;
      return paginatedData.pagination?.hasMore
        ? paginatedData.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook for single post
 */
export function usePost(postId: string | null) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const response = await contentService.getPost(postId);
      return response.data || null;
    },
    enabled: !!postId,
  });
}

/**
 * Hook for user posts
 */
export function useUserPosts(userId: string | null) {
  return useInfiniteQuery({
    queryKey: ["userPosts", userId],
    queryFn: ({ pageParam = 1 }) => {
      if (!userId) throw new Error("User ID required");
      return contentService.getUserPosts(userId, pageParam, 20);
    },
    getNextPageParam: (lastPage) => {
      const paginatedData = lastPage.data as any;
      return paginatedData?.pagination?.hasMore
        ? paginatedData.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
  });
}

/**
 * Hook for saved posts
 */
export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ["savedPosts"],
    queryFn: ({ pageParam = 1 }) => contentService.getSavedPosts(pageParam, 20),
    getNextPageParam: (lastPage) => {
      const paginatedData = lastPage.data as any;
      return paginatedData?.pagination?.hasMore
        ? paginatedData.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook for post mutations
 */
export function usePostMutations() {
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: ({
      payload,
      onProgress,
    }: {
      payload: CreatePostPayload;
      onProgress?: (progress: number) => void;
    }) => contentService.createPost(payload, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: handleApiError,
  });

  const updatePostMutation = useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: Partial<CreatePostPayload>;
    }) => contentService.updatePost(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: handleApiError,
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: handleApiError,
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.likePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: handleApiError,
  });

  const unlikePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.unlikePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: handleApiError,
  });

  const savePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.savePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
    onError: handleApiError,
  });

  const unsavePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.unsavePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
    onError: handleApiError,
  });

  const sharePostMutation = useMutation({
    mutationFn: ({ postId, message }: { postId: string; message?: string }) =>
      contentService.sharePost(postId, message),
    onError: handleApiError,
  });

  return {
    createPost: createPostMutation.mutateAsync,
    updatePost: updatePostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    likePost: likePostMutation.mutateAsync,
    unlikePost: unlikePostMutation.mutateAsync,
    savePost: savePostMutation.mutateAsync,
    unsavePost: unsavePostMutation.mutateAsync,
    sharePost: sharePostMutation.mutateAsync,

    isCreating: createPostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
  };
}
