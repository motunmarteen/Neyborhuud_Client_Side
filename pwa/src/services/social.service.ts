/**
 * Social Service
 * Handles user profile lookup via social endpoints
 */

import apiClient from "@/lib/api-client";
import { User } from "@/types/api";

export const socialService = {
  /**
   * Get user profile by username
   */
  async getUserByUsername(username: string) {
    return await apiClient.get<User>(`/social/users/username/${username}`);
  },
};
