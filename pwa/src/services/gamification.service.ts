/**
 * Gamification Service
 * Handles points, badges, achievements, and leaderboards
 */

import apiClient from "@/lib/api-client";
import { Badge, Achievement, LeaderboardEntry, HuudCoinWallet, HuudCoinTransaction, PaginatedResponse } from "@/types/api";

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
    return await apiClient.get("/gamification/stats");
  },

  /**
   * Get hero stats (trust score + HuudCoins) — lightweight endpoint for the sky hero status bar
   */
  async getHeroStats() {
    return await apiClient.get<{ trustScore: number; totalHuudCoins: number }>("/gamification/hero-stats");
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

  /**
   * Award HuudCoins for a user action (fire-and-forget from frontend;
   * backend should also award server-side for security)
   */
  async awardCoins(
    action: string,
    metadata?: Record<string, unknown>,
  ) {
    return await apiClient.post("/gamification/earn", { action, metadata });
  },

  /**
   * Get HuudCoins wallet balance and summary
   */
  async getWallet() {
    return await apiClient.get<HuudCoinWallet>("/gamification/wallet");
  },

  /**
   * Get HuudCoins transaction history
   */
  async getTransactions(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<HuudCoinTransaction>>("/gamification/wallet/transactions", {
      params: { page, limit },
    });
  },

  /**
   * Send a HuudCoin tip to another user — purely P2P, no platform cut.
   */
  async tipUser(recipientId: string, amount: 50 | 100 | 200 | 500) {
    return await apiClient.post<{ sent: number; recipientId: string }>(
      `/gamification/users/${recipientId}/tip`,
      { amount },
    );
  },

  /**
   * Pin your own post to the top of the neighbourhood feed.
   */
  async pinPost(postId: string, days: 1 | 7) {
    return await apiClient.post<{ deducted: number; days: number; pinnedUntil: string }>(
      `/gamification/feed/${postId}/pin`,
      { days },
    );
  },

  async getUserVerification(userId: string) {
    return await apiClient.get<{
      tier: string;
      progress: import("@/types/api").User["verificationProgress"];
      metrics: Record<string, number>;
    }>(`/gamification/users/${userId}/verification`);
  },
};
