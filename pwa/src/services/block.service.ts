/**
 * Block Service
 * Handles block/unblock operations via the follow API
 */

import apiClient from "@/lib/api-client";
import type {
  BlockResponse,
  UnblockResponse,
  BlockStatus,
  BlockedUsersResponse,
} from "@/types/block";

export const blockService = {
  /**
   * Block a user
   */
  async blockUser(userId: string, reason?: string) {
    return await apiClient.post<BlockResponse>(`/follow/block/${userId}`, { reason });
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string) {
    return await apiClient.delete<UnblockResponse>(`/follow/block/${userId}`);
  },

  /**
   * Get block status for a specific user
   */
  async getBlockStatus(userId: string) {
    return await apiClient.get<BlockStatus>(`/follow/block/status/${userId}`);
  },

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(page: number = 1, limit: number = 50) {
    return await apiClient.get<BlockedUsersResponse>(`/follow/blocked`, {
      params: { page, limit },
    });
  },
};
