/**
 * FYI Bulletin Service
 * Handles FYI bulletin-related API calls including pinning
 */

import apiClient from "@/lib/api-client";

export interface FYIBulletin {
  id: string;
  title: string;
  content: string;
  contentType: "fyi";
  isPinned?: boolean;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}

export const fyiService = {
  /**
   * Pin an FYI bulletin to the top of the feed
   * Only available to bulletin author or admin/moderators
   */
  async pinBulletin(bulletinId: string) {
    return await apiClient.post<{ success: boolean; message: string }>(
      `/fyi/${bulletinId}/pin`
    );
  },

  /**
   * Unpin an FYI bulletin from the top of the feed
   * Only available to bulletin author or admin/moderators
   */
  async unpinBulletin(bulletinId: string) {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `/fyi/${bulletinId}/pin`
    );
  },
};
