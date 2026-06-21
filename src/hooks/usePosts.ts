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
import { CreatePostPayload, FeedTab, ContentType } from "@/types/api";
import { handleApiError } from "@/lib/error-handler";
import { useAwardCoins } from "@/hooks/useGamification";
import { getMockFeedPage } from "@/lib/mockFeedPosts";

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
    feedTab?: FeedTab;
    contentType?: ContentType;
    departmentId?: string;
    priority?: string;
    fyiSubtype?: string;
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
      options?.feedTab,
      options?.contentType,
      options?.departmentId,
      options?.priority,
      options?.fyiSubtype,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      const mock = getMockFeedPage(page, 20);

      let realPosts: any[] = [];
      let realResult: any = null;
      try {
        realResult = await contentService.getLocationFeed(latitude, longitude, {
          ...options,
          page,
          limit: 20,
        });
        realPosts = realResult?.content ?? (realResult as any)?.data?.content ?? [];
      } catch {
        // API failed — use mock only
        return mock;
      }

      // Merge: real posts first, then mock posts that fill the remaining slots.
      // Use a Set of real post ids so mock posts with the same id are skipped.
      const realIds = new Set(realPosts.map((p: any) => p.id));
      const mockPadding = mock.content.filter((p) => !realIds.has(p.id));
      const merged = [...realPosts, ...mockPadding];

      return {
        ...(realResult ?? mock),
        content: merged,
        pagination: {
          ...(realResult?.pagination ?? mock.pagination),
          total: Math.max(realResult?.pagination?.total ?? 0, mock.pagination.total),
          hasMore: (realResult?.pagination?.hasMore ?? false) || mock.pagination.hasMore,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    // Always enabled — mock data is returned even without location
    enabled: true,
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
      if (!userId) {
        throw new Error("User ID required");
      }
      return await contentService.getUserPosts(userId, pageParam, 20);
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
  const awardCoins = useAwardCoins();

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
      awardCoins("post_created");
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
    mutationFn: ({ postId, message, location }: { postId: string; message?: string; location?: {lat: number; lng: number} }) =>
      contentService.repostPost(postId, message, location),
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous values for rollback
      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Optimistically update single post cache
      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isShared: true,
            shares: (old.data.shares || 0) + 1,
          },
        };
      });

      // Optimistically update feed caches
      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? { ...post, isShared: true, shares: (post.shares || 0) + 1 }
                : post,
            ),
          })),
        };
      });

      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? { ...post, isShared: true, shares: (post.shares || 0) + 1 }
                : post,
            ),
          })),
        };
      });

      return { previousPost, previousFeed, previousPosts };
    },
    onError: (err, { postId }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPosts) {
        for (const [key, data] of context.previousPosts) {
          queryClient.setQueryData(key, data);
        }
      }
      handleApiError(err);
    },
    onSettled: () => {
      awardCoins("post_shared");
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });

  const unrepostPostMutation = useMutation({
    mutationFn: (postId: string) => contentService.unrepostPost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["locationFeed"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous values for rollback
      const previousPost = queryClient.getQueryData(["post", postId]);
      const previousFeed = queryClient.getQueriesData({
        queryKey: ["locationFeed"],
      });
      const previousPosts = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Optimistically update single post cache
      queryClient.setQueryData(["post", postId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isShared: false,
            shares: Math.max(0, (old.data.shares || 0) - 1),
          },
        };
      });

      // Optimistically update feed caches
      queryClient.setQueriesData({ queryKey: ["locationFeed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? { ...post, isShared: false, shares: Math.max(0, (post.shares || 0) - 1) }
                : post,
            ),
          })),
        };
      });

      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: (page.content ?? []).map((post: any) =>
              post.id === postId
                ? { ...post, isShared: false, shares: Math.max(0, (post.shares || 0) - 1) }
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
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPosts) {
        for (const [key, data] of context.previousPosts) {
          queryClient.setQueryData(key, data);
        }
      }
      handleApiError(err);
    },
    onSettled: (_, __, postId) => {
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
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
    unsharePost: unrepostPostMutation.mutateAsync,

    isCreating: createPostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
  };
}
