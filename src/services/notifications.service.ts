/**
 * Notifications Service
 * Handles notification retrieval and management
 */

import apiClient from "@/lib/api-client";
import { Notification, PaginatedResponse } from "@/types/api";

export const notificationsService = {
  /**
   * Get all notifications
   */
  async getNotifications(page = 1, limit = 20, filter?: "all" | "unread") {
    return await apiClient.get<PaginatedResponse<Notification>>(
      "/notifications",
      {
        params: { page, limit, filter },
      },
    );
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    return await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
    );
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    return await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return await apiClient.post("/notifications/mark-all-read");
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    return await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    return await apiClient.delete("/notifications");
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: any) {
    return await apiClient.put("/notifications/settings", settings);
  },

  /**
   * Get notification settings
   */
  async getSettings() {
    return await apiClient.get("/notifications/settings");
  },

  /**
   * Register push notification token
   */
  async registerPushToken(token: string, platform: "web" | "ios" | "android") {
    return await apiClient.post("/notifications/push-token", {
      token,
      platform,
    });
  },

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(token: string) {
    return await apiClient.delete("/notifications/push-token", {
      data: { token },
    });
  },

  /**
   * Test push notification
   */
  async testPushNotification() {
    return await apiClient.post("/notifications/test-push");
  },
};
