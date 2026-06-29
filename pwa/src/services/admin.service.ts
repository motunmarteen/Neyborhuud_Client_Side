/**
 * Admin Service
 * Handles administrative functions (requires admin role)
 */

import apiClient from "@/lib/api-client";
import { User, Report, PaginatedResponse, AnalyticsData } from "@/types/api";

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    return await apiClient.get<AnalyticsData>("/admin/dashboard/stats");
  },

  /**
   * Get all users
   */
  async getUsers(
    page = 1,
    limit = 20,
    filter?: {
      role?: string;
      status?: string;
      verified?: boolean;
    },
  ) {
    return await apiClient.get<PaginatedResponse<User>>("/admin/users", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get user details
   */
  async getUser(userId: string) {
    return await apiClient.get<User>(`/admin/users/${userId}`);
  },

  /**
   * Suspend a user
   */
  async suspendUser(userId: string, reason: string, duration?: number) {
    // Backend expects `until` as ISO date string; duration is in days.
    // If no duration provided, suspend for 36,500 days (~permanent).
    const days = duration && duration > 0 ? duration : 36500;
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    return await apiClient.post(`/admin/users/${userId}/suspend`, {
      reason,
      until,
    });
  },

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: string) {
    return await apiClient.post(`/admin/users/${userId}/unsuspend`);
  },

  /**
   * Verify a user
   */
  async verifyUser(userId: string) {
    return await apiClient.post(`/admin/users/${userId}/verify`);
  },

  /**
   * Unverify a user
   */
  async unverifyUser(userId: string) {
    return await apiClient.post(`/admin/users/${userId}/unverify`);
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: "user" | "moderator" | "admin") {
    return await apiClient.patch(`/admin/users/${userId}/role`, { role });
  },

  /**
   * Delete user account
   */
  async deleteUser(userId: string, reason: string) {
    return await apiClient.delete(`/admin/users/${userId}`, {
      data: { reason },
    });
  },

  /**
   * Get all reports
   */
  async getReports(
    page = 1,
    limit = 20,
    filter?: {
      status?: "pending" | "under_review" | "resolved" | "dismissed";
      targetType?: string;
    },
  ) {
    return await apiClient.get<PaginatedResponse<Report>>("/admin/reports", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get report details
   */
  async getReport(reportId: string) {
    return await apiClient.get<Report>(`/admin/reports/${reportId}`);
  },

  /**
   * Resolve a report — maps UI action to backend status
   */
  async resolveReport(
    reportId: string,
    action: "dismiss" | "remove" | "warn" | "suspend",
    notes?: string,
  ) {
    const STATUS_MAP: Record<string, string> = {
      dismiss: 'dismissed',
      remove:  'actioned',
      warn:    'actioned',
      suspend: 'actioned',
    };
    return await apiClient.patch(`/admin/reports/${reportId}/status`, {
      status: STATUS_MAP[action] ?? 'reviewed',
      note: notes,
    });
  },

  /**
   * Get analytics data
   */
  async getAnalytics(startDate?: string, endDate?: string) {
    return await apiClient.get<AnalyticsData>("/admin/analytics", {
      params: { startDate, endDate },
    });
  },

  /**
   * Get content moderation queue
   */
  async getModerationQueue(page = 1, limit = 20) {
    return await apiClient.get("/admin/moderation", {
      params: { page, limit },
    });
  },

  /**
   * Approve content
   */
  async approveContent(contentType: string, contentId: string) {
    return await apiClient.post(`/admin/moderation/approve`, {
      contentType,
      contentId,
    });
  },

  /**
   * Remove content
   */
  async removeContent(contentType: string, contentId: string, reason: string) {
    return await apiClient.post(`/admin/moderation/remove`, {
      contentType,
      contentId,
      reason,
    });
  },

  /**
   * Get system logs
   */
  async getSystemLogs(page = 1, limit = 50, level?: "info" | "warn" | "error") {
    return await apiClient.get("/admin/logs", {
      params: { page, limit, level },
    });
  },

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: Record<string, any>) {
    return await apiClient.put("/admin/settings", settings);
  },

  /**
   * Get system settings
   */
  async getSystemSettings() {
    return await apiClient.get("/admin/settings");
  },

  /**
   * Send broadcast notification
   */
  async sendBroadcast(title: string, message: string, targetUsers?: string[]) {
    return await apiClient.post("/admin/broadcast", {
      title,
      message,
      targetUsers,
    });
  },
};
