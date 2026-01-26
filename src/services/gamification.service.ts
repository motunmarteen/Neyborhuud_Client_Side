/**
 * Gamification Service
 * Handles points, badges, achievements, and leaderboards
 */

import apiClient from "@/lib/api-client";
import { Badge, Achievement, LeaderboardEntry } from "@/types/api";

export const gamificationService = {
  /**
   * Get leaderboard
   */
  async getLeaderboard(
    timeframe: "daily" | "weekly" | "monthly" | "all-time" = "weekly",
    limit = 50,
  ) {
    return await apiClient.get<LeaderboardEntry[]>(
      "/gamification/leaderboard",
      {
        params: { timeframe, limit },
      },
    );
  },

  /**
   * Get my stats
   */
  async getMyStats() {
    return await apiClient.get("/gamification/my-stats");
  },

  /**
   * Get user stats
   */
  async getUserStats(userId: string) {
    return await apiClient.get(`/gamification/users/${userId}/stats`);
  },

  /**
   * Get all available badges
   */
  async getBadges() {
    return await apiClient.get<Badge[]>("/gamification/badges");
  },

  /**
   * Get my badges
   */
  async getMyBadges() {
    return await apiClient.get<Badge[]>("/gamification/my-badges");
  },

  /**
   * Get all achievements
   */
  async getAchievements() {
    return await apiClient.get<Achievement[]>("/gamification/achievements");
  },

  /**
   * Get my achievements
   */
  async getMyAchievements() {
    return await apiClient.get<Achievement[]>("/gamification/my-achievements");
  },

  /**
   * Claim achievement reward
   */
  async claimReward(achievementId: string) {
    return await apiClient.post(
      `/gamification/achievements/${achievementId}/claim`,
    );
  },

  /**
   * Get daily streak
   */
  async getStreak() {
    return await apiClient.get<{ streak: number; lastCheckIn: string }>(
      "/gamification/streak",
    );
  },

  /**
   * Check in (for daily streak)
   */
  async checkIn() {
    return await apiClient.post("/gamification/check-in");
  },
};
