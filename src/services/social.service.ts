/**
 * Social Service
 * Handles friends, followers, and social interactions
 */

import apiClient from "@/lib/api-client";
import { User, FriendRequest, PaginatedResponse } from "@/types/api";

export const socialService = {
  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string) {
    return await apiClient.post<FriendRequest>(
      `/social/friends/request/${userId}`,
    );
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string) {
    return await apiClient.post(`/social/friends/request/${requestId}/accept`);
  },

  /**
   * Reject friend request
   */
  async rejectFriendRequest(requestId: string) {
    return await apiClient.post(`/social/friends/request/${requestId}/reject`);
  },

  /**
   * Cancel friend request
   */
  async cancelFriendRequest(requestId: string) {
    return await apiClient.delete(`/social/friends/request/${requestId}`);
  },

  /**
   * Get pending friend requests
   */
  async getPendingRequests(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<FriendRequest>>(
      "/social/friends/requests",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Unfriend a user
   */
  async unfriend(userId: string) {
    return await apiClient.delete(`/social/friends/${userId}`);
  },

  /**
   * Get friends list
   */
  async getFriends(page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>("/social/friends", {
      params: { page, limit },
    });
  },

  /**
   * Get user's friends
   */
  async getUserFriends(userId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>(
      `/social/users/${userId}/friends`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Follow a user
   */
  async follow(userId: string) {
    return await apiClient.post(`/social/follow/${userId}`);
  },

  /**
   * Unfollow a user
   */
  async unfollow(userId: string) {
    return await apiClient.delete(`/social/follow/${userId}`);
  },

  /**
   * Get followers
   */
  async getFollowers(page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>("/social/followers", {
      params: { page, limit },
    });
  },

  /**
   * Get following
   */
  async getFollowing(page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>("/social/following", {
      params: { page, limit },
    });
  },

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>(
      `/social/users/${userId}/followers`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get user's following
   */
  async getUserFollowing(userId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>(
      `/social/users/${userId}/following`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Block a user
   */
  async blockUser(userId: string) {
    return await apiClient.post(`/social/block/${userId}`);
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string) {
    return await apiClient.delete(`/social/block/${userId}`);
  },

  /**
   * Get blocked users
   */
  async getBlockedUsers(page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>("/social/blocked", {
      params: { page, limit },
    });
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    return await apiClient.get<User>(`/social/users/${userId}`);
  },

  /**
   * Get user profile by username
   */
  async getUserByUsername(username: string) {
    return await apiClient.get<User>(`/social/users/username/${username}`);
  },

  /**
   * Get friend suggestions
   */
  async getFriendSuggestions(limit = 20) {
    return await apiClient.get<User[]>("/social/friends/suggestions", {
      params: { limit },
    });
  },
};
