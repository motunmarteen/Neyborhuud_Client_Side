/**
 * Search Service
 * Handles global search functionality
 */

import apiClient from "@/lib/api-client";
import {
  PaginatedResponse,
  SearchResult,
} from "@/types/api";
import { SearchParams, SearchResponse } from "@/types/search";

export const searchService = {
  /**
   * Global search with unified response format
   * This is the primary search method matching the new API spec
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const { q, type = "all", page = 1, limit = 20 } = params;

    // apiClient.get returns the full response object { success, message, data }
    const response = await apiClient.get("/search", {
      params: { q, type, page, limit },
    });

    // Return the full response as SearchResponse
    return response as unknown as SearchResponse;
  },

  /**
   * Global search across all content types (legacy method)
   */
  async globalSearch(
    query: string,
    type?:
      | "all"
      | "users"
      | "posts"
      | "events"
      | "jobs"
      | "marketplace"
      | "services"
      | "locations",
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<SearchResult>>("/search", {
      params: { q: query, type, page, limit },
    });
  },

  /**
   * Search users
   */
  async searchUsers(query: string, page = 1, limit = 20) {
    return this.search({ q: query, type: "users", page, limit });
  },

  /**
   * Search posts
   */
  async searchPosts(query: string, page = 1, limit = 20) {
    return this.search({ q: query, type: "posts", page, limit });
  },

  /**
   * Search locations
   */
  async searchLocations(query: string, page = 1, limit = 20) {
    return this.search({ q: query, type: "locations", page, limit });
  },

  // Events, jobs, marketplace and services are found through the main search (contentType)
  // and Ask Sentinel (/sentinel/ask). The old /search/events|jobs|marketplace|services
  // calls pointed at endpoints the server never had and were not used anywhere.

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, type?: string) {
    return await apiClient.get<string[]>("/search/suggestions", {
      params: { q: query, type },
    });
  },

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit = 10): Promise<string[]> {
    // Backend route is /search/trends → { trends: [{ query, count }] }.
    const res = await apiClient.get<{ trends?: Array<{ query?: string }> }>("/search/trends");
    const trends = res.data?.trends ?? [];
    return trends
      .map((t) => (typeof t?.query === "string" ? t.query : ""))
      .filter(Boolean)
      .slice(0, limit);
  },

  // Recent searches are kept on the phone (no /search/history endpoint on the server).
};
