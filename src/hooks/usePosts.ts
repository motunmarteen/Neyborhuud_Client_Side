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
 * Hook for location-based feed (primary feed endpoint)
 */
export function useLocationFeed(
  latitude: number | null,
  longitude: number | null,
  options?: {
    radius?: number;
    category?: string;
    ranked?: boolean;
  },
) {
  return useInfiniteQuery({
    queryKey: [
      "locationFeed",
      latitude,
      longitude,
      options?.category,
      options?.radius,
      options?.ranked,
    ],
    queryFn: ({ pageParam = 1 }) => {
      if (!latitude || !longitude) {
        throw new Error("Location required for feed");
      }
      return contentService.getLocationFeed(latitude, longitude, {
        ...options,
        page: pageParam,
        limit: 20,
      });
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!latitude && !!longitude,
  });
}

/**
 * Hook for infinite scrolling posts feed
 */
export function usePosts(filter?: "all" | "friends" | "neighborhood") {
  return useInfiniteQuery({
    queryKey: ["posts", filter],
    queryFn: ({ pageParam = 1 }) =>
      contentService.getPosts(pageParam, 20, filter),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
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
      return await contentService.getPost(postId);
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
    queryFn: async ({ pageParam = 1 }) => {
      console.log("🎣 useUserPosts queryFn called:", { userId, pageParam });

      if (!userId) {
        console.error("❌ No userId provided to useUserPosts");
        throw new Error("User ID required");
      }

      try {
        const result = await contentService.getUserPosts(userId, pageParam, 20);
        console.log("✅ useUserPosts result:", result);
        return result;
      } catch (error) {
        console.error("❌ useUserPosts error:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore
        ? (lastPage.pagination.page ?? 0) + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
    retry: 1,
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
    onSuccess: (response) => {
      const newPost = response?.data;
      // Optimistically add new post to feed (feed uses content array)
      if (newPost) {
        queryClient.setQueriesData(
          { queryKey: ["locationFeed"] },
          (old: any) => {
            if (!old?.pages?.length) return old;
            const [firstPage, ...restPages] = old.pages;
            const list = firstPage?.content ?? [];
            const pagination = firstPage?.pagination ?? {};
            const newFirstPage = {
              ...firstPage,
              content: [newPost, ...list],
              pagination: { ...pagination, total: (pagination.total ?? 0) + 1 },
            };
            return { ...old, pages: [newFirstPage, ...restPages] };
          },
        );
      }
      // Invalidate so next load gets fresh data from server
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
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
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous values
      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Optimistically update
      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isLiked: true,
            likes: (old.data.likes || 0) + 1,
          },
        };
      });

      // Update feed queries (feed uses content array)
      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? { ...post, isLiked: true, likes: (post.likes || 0) + 1 }
                : post,
            ),
          })),
        };
      });

      return { previousPost, previousFeed, previousPosts };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      handleApiError(err);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const unlikePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.unlikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isLiked: false,
            likes: Math.max(0, (old.data.likes || 0) - 1),
          },
        };
      });

      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: false,
                    likes: Math.max(0, (post.likes || 0) - 1),
                  }
                : post,
            ),
          })),
        };
      });

      return { previousPost, previousFeed, previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      handleApiError(err);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const savePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.savePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, isSaved: true },
        };
      });

      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId ? { ...post, isSaved: true } : post,
            ),
          })),
        };
      });

      return { previousPost, previousFeed, previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      handleApiError(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const unsavePostMutation = useMutation({
    mutationFn: (postId: string) => contentService.unsavePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, isSaved: false },
        };
      });

      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId ? { ...post, isSaved: false } : post,
            ),
          })),
        };
      });

      return { previousPost, previousFeed, previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      handleApiError(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
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
