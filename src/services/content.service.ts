/**
 * Content Service
 * Handles posts, comments, and content-related API calls
 */

import apiClient from "@/lib/api-client";
import {
  Post,
  Comment,
  PaginatedResponse,
  FeedResponse,
  CreatePostPayload,
} from "@/types/api";

/** Normalize feed response: backend may return content at data.content or top-level content */
function normalizeFeedResponse<T>(res: any): FeedResponse<T> {
  const content = res?.content ?? res?.data?.content ?? res?.data?.data ?? [];
  const pagination = res?.pagination ?? res?.data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasMore: false,
  };
  return { content: Array.isArray(content) ? content : [], pagination };
}

export const contentService = {
  // ==================== Posts ====================

  /**
   * Create a new post
   */
  async createPost(
    payload: CreatePostPayload,
    onProgress?: (progress: number) => void,
  ) {
    if (payload.media && payload.media.length > 0) {
      return await apiClient.uploadFiles<Post>(
        "/content/posts",
        payload.media,
        {
          type: payload.type,
          content: payload.content,
          visibility: payload.visibility,
          tags: payload.tags,
          mentions: payload.mentions,
          location: payload.location,
        },
        onProgress,
      );
    }

    return await apiClient.post<Post>("/content/posts", payload);
  },

  /**
   * Get location-based feed (primary feed endpoint)
   * Falls back to /content/posts if /feed is 404 or 500 (server error)
   */
  async getLocationFeed(
    latitude: number,
    longitude: number,
    options?: {
      radius?: number;
      category?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<FeedResponse<Post>> {
    try {
      const res = await apiClient.get<any>("/feed", {
        params: {
          lat: latitude,
          lng: longitude,
          radius: options?.radius || 5000,
          category: options?.category,
          page: options?.page || 1,
          limit: options?.limit || 20,
        },
      });
      return normalizeFeedResponse<Post>(res);
    } catch (error: any) {
      const status = error.response?.status;
      const isUnavailable =
        status === 404 ||
        status === 500 ||
        status === 502 ||
        status === 503;
      if (isUnavailable) {
        console.warn(
          `⚠️ /feed returned ${status}, falling back to /content/posts for recent posts`
        );
        const res = await apiClient.get<any>("/content/posts", {
          params: {
            page: options?.page || 1,
            limit: options?.limit || 20,
            filter: "neighborhood",
          },
        });
        return normalizeFeedResponse<Post>(res);
      }
      throw error;
    }
  },

  /**
   * Get posts (feed) – returns { content: Post[], pagination }
   */
  async getPosts(
    page = 1,
    limit = 20,
    filter?: "all" | "friends" | "neighborhood",
  ): Promise<FeedResponse<Post>> {
    const res = await apiClient.get<any>("/content/posts", {
      params: { page, limit, filter },
    });
    return normalizeFeedResponse<Post>(res);
  },

  /**
   * Get a single post
   */
  async getPost(postId: string) {
    return await apiClient.get<Post>(`/content/posts/${postId}`);
  },

  /**
   * Update a post
   */
  async updatePost(postId: string, data: Partial<CreatePostPayload>) {
    return await apiClient.put<Post>(`/content/posts/${postId}`, data);
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string) {
    return await apiClient.delete(`/content/posts/${postId}`);
  },

  /**
   * Like a post
   */
  async likePost(postId: string) {
    return await apiClient.post(`/content/posts/${postId}/like`);
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string) {
    return await apiClient.delete(`/content/posts/${postId}/like`);
  },

  /**
   * Share a post
   */
  async sharePost(postId: string, message?: string) {
    return await apiClient.post(`/content/posts/${postId}/share`, { message });
  },

  /**
   * Save a post
   */
  async savePost(postId: string) {
    return await apiClient.post(`/content/posts/${postId}/save`);
  },

  /**
   * Unsave a post
   */
  async unsavePost(postId: string) {
    return await apiClient.delete(`/content/posts/${postId}/save`);
  },

  /**
   * Get saved posts
   */
  async getSavedPosts(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Post>>("/content/saved", {
      params: { page, limit },
    });
  },

  /**
   * Pin a post
   */
  async pinPost(postId: string) {
    return await apiClient.post(`/content/posts/${postId}/pin`);
  },

  /**
   * Unpin a post
   */
  async unpinPost(postId: string) {
    return await apiClient.delete(`/content/posts/${postId}/pin`);
  },

  /**
   * Report a post
   */
  async reportPost(postId: string, reason: string, description?: string) {
    return await apiClient.post(`/content/posts/${postId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Get posts by user
   */
  async getUserPosts(userId: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Post>>(
      `/content/users/${userId}/posts`,
      {
        params: { page, limit },
      },
    );
  },

  // ==================== Comments ====================

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Comment>>(
      `/content/posts/${postId}/comments`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Create a comment
   */
  async createComment(postId: string, content: string, parentId?: string) {
    return await apiClient.post<Comment>(`/content/posts/${postId}/comments`, {
      content,
      parentId,
    });
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string) {
    return await apiClient.put<Comment>(`/content/comments/${commentId}`, {
      content,
    });
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string) {
    return await apiClient.delete(`/content/comments/${commentId}`);
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string) {
    return await apiClient.post(`/content/comments/${commentId}/like`);
  },

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string) {
    return await apiClient.delete(`/content/comments/${commentId}/like`);
  },

  /**
   * Get replies to a comment
   */
  async getCommentReplies(commentId: string, page = 1, limit = 10) {
    return await apiClient.get<PaginatedResponse<Comment>>(
      `/content/comments/${commentId}/replies`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Report a comment
   */
  async reportComment(commentId: string, reason: string, description?: string) {
    return await apiClient.post(`/content/comments/${commentId}/report`, {
      reason,
      description,
    });
  },
};
