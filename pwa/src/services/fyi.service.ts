/**
 * FYI Bulletin Service
 * Handles FYI bulletin-related API calls including pinning, helpful, status, endorsements, RSVP, receipts, and sharing
 */

import apiClient from "@/lib/api-client";

export interface FYIBulletin {
  id: string;
  title: string;
  content: string;
  contentType: "fyi";
  isPinned?: boolean;
  authorId: string;
  metadata?: {
    fyiType?: string;
    priority?: string;
    status?: string;
    expiryDate?: string;
    isPinned?: boolean;
    pinnedAt?: string;
    eventDetails?: Record<string, any>;
    contactInfo?: Record<string, any>;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface StatusHistoryEntry {
  fyiId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: {
    firstName?: string;
    lastName?: string;
    name?: string;
    username?: string;
  };
  changedAt: string;
}

export const fyiService = {
  /** Fetch FYI bulletins with optional filters */
  async getBulletins(params?: {
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
    lga?: string;
    state?: string;
    feedTab?: string;
  }) {
    return await apiClient.get<any>("/content/fyi", {
      params: {
        type: params?.type,
        priority: params?.priority,
        page: params?.page,
        limit: params?.limit,
        lga: params?.lga,
        state: params?.state,
        feedTab: params?.feedTab,
      },
    });
  },

  /** Create a new FYI bulletin (used from the locked FYI page) */
  async createBulletin(payload: {
    title: string;
    body: string;
    fyiType?: string;
    priority?: string;
    mediaUrls?: string[];
    tags?: string[];
    location?: { latitude: number; longitude: number };
  }) {
    return await apiClient.post<any>("/content/fyi", payload);
  },

  /** Pin an FYI bulletin to the top of the feed */
  async pinBulletin(bulletinId: string) {
    return await apiClient.post<{ success: boolean; message: string }>(
      `/content/fyi/${bulletinId}/pin`,
    );
  },

  /** Unpin an FYI bulletin from the top of the feed */
  async unpinBulletin(bulletinId: string) {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `/content/fyi/${bulletinId}/pin`,
    );
  },

  /** Mark a post as helpful */
  async markHelpful(postId: string) {
    return await apiClient.post<{ success: boolean; helpfulCount: number }>(
      `/content/${postId}/helpful`,
    );
  },

  /** Update the status of an FYI bulletin */
  async updateStatus(bulletinId: string, status: string) {
    return await apiClient.patch<{ success: boolean }>(
      `/content/fyi/${bulletinId}/status`,
      { status },
    );
  },

  /** Endorse an FYI bulletin */
  async endorseBulletin(
    bulletinId: string,
    note?: string,
    authorityTitle?: string,
  ) {
    return await apiClient.post<{ success: boolean }>(
      `/content/fyi/${bulletinId}/endorse`,
      { note, authorityTitle },
    );
  },

  /** Get endorsements for an FYI bulletin */
  async getEndorsements(bulletinId: string) {
    return await apiClient.get<any>(`/content/fyi/${bulletinId}/endorsements`);
  },

  /** RSVP to a community announcement/event bulletin */
  async rsvpToBulletin(
    bulletinId: string,
    status: "going" | "maybe" | "declined",
  ) {
    return await apiClient.post<{ success: boolean }>(
      `/content/fyi/${bulletinId}/rsvp`,
      { status },
    );
  },

  /** Confirm receipt of a safety notice */
  async confirmReceipt(bulletinId: string) {
    return await apiClient.post<{ success: boolean }>(
      `/content/fyi/${bulletinId}/receipt`,
    );
  },

  /** Get status change history for a bulletin (audit trail) */
  async getStatusHistory(bulletinId: string) {
    return await apiClient.get<{
      success: boolean;
      data: { history: StatusHistoryEntry[] };
    }>(`/content/fyi/${bulletinId}/status-history`);
  },

  /** Share a post externally */
  async shareExternal(postId: string, platform: string) {
    return await apiClient.post<{ success: boolean }>(
      `/content/${postId}/share/external`,
      { platform },
    );
  },
};
