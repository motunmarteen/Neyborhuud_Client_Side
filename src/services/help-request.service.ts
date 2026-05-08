/**
 * Help Request Service
 * Handles fetching and managing help_request posts.
 */

import apiClient from "@/lib/api-client";

export const helpRequestService = {
  /** Fetch help request posts with optional filters */
  async getRequests(params?: {
    category?: string;
    page?: number;
    limit?: number;
    feedTab?: string;
  }) {
    return await apiClient.get<any>("/content/posts", {
      params: {
        contentType: "help_request",
        helpCategory: params?.category || undefined,
        page: params?.page,
        limit: params?.limit,
        feedTab: params?.feedTab,
      },
    });
  },

  /** Fetch a single help request post by ID */
  async getById(id: string) {
    return await apiClient.get<any>(`/content/posts/${id}`);
  },

  /** Submit an offer to help with a request */
  async submitOffer(postId: string, data: { message: string; offeredAmount?: number }) {
    return await apiClient.post<any>(`/content/posts/${postId}/help-offers`, data);
  },

  /** Get all offers on a help request */
  async getOffers(postId: string) {
    return await apiClient.get<any>(`/content/posts/${postId}/help-offers`);
  },

  /** Requestor confirms they received help from a specific offer */
  async confirmOffer(postId: string, offerId: string) {
    return await apiClient.patch<any>(`/content/posts/${postId}/help-offers/${offerId}/confirm`);
  },

  /** Requestor rejects an offer */
  async rejectOffer(postId: string, offerId: string) {
    return await apiClient.patch<any>(`/content/posts/${postId}/help-offers/${offerId}/reject`);
  },

  /** Update the status of a help request (open/in_progress/fulfilled/closed) */
  async updateStatus(postId: string, status: string) {
    return await apiClient.patch<any>(`/content/posts/${postId}/help-status`, { status });
  },

  /** Update amount received (owner self-reports) */
  async updateAmountReceived(postId: string, amountReceived: number) {
    return await apiClient.patch<any>(`/content/posts/${postId}/amount`, { amountReceived });
  },
};

