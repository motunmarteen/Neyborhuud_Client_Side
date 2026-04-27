/**
 * Help Request Service
 * Handles fetching help_request posts from the shared content endpoint.
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
};
