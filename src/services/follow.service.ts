/**
 * Follow Service
 * Handles follow/unfollow operations and related API calls
 */

import apiClient from "@/lib/api-client";
import type {
  FollowResponse,
  UnfollowResponse,
  FollowStatus,
  FollowersResponse,
  FollowingResponse,
} from "@/types/follow";

export const followService = {
  /**
   * Follow a user
   */
  async followUser(userId: string) {
    return await apiClient.post<FollowResponse>(`/follow/${userId}`);
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string) {
    return await apiClient.delete<UnfollowResponse>(`/follow/${userId}`);
  },

  /**
   * Get follow status for a specific user
   */
  async getFollowStatus(userId: string) {
    return await apiClient.get<FollowStatus>(
      `/follow/status/${userId}`,
    );
  },

  /**
   * Get list of followers for a user
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 50) {
    return await apiClient.get<FollowersResponse>(
      `/follow/${userId}/followers`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get list of users that a user is following
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 50) {
    return await apiClient.get<FollowingResponse>(
      `/follow/${userId}/following`,
      {
        params: { page, limit },
      },
    );
  },
};
