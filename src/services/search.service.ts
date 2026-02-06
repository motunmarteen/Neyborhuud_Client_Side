/**
 * Search Service
 * Handles global search functionality
 */

import apiClient from "@/lib/api-client";
import {
  PaginatedResponse,
  SearchResult,
  User,
  Post,
  Event,
  Job,
  MarketplaceItem,
  Service,
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

  /**
   * Search events
   */
  async searchEvents(query: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Event>>("/search/events", {
      params: { q: query, page, limit },
    });
  },

  /**
   * Search jobs
   */
  async searchJobs(query: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Job>>("/search/jobs", {
      params: { q: query, page, limit },
    });
  },

  /**
   * Search marketplace items
   */
  async searchMarketplace(query: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<MarketplaceItem>>(
      "/search/marketplace",
      {
        params: { q: query, page, limit },
      },
    );
  },

  /**
   * Search services
   */
  async searchServices(query: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Service>>("/search/services", {
      params: { q: query, page, limit },
    });
  },

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
  async getTrendingSearches(limit = 10) {
    return await apiClient.get<string[]>("/search/trending", {
      params: { limit },
    });
  },

  /**
   * Get search history
   */
  async getSearchHistory(limit = 20) {
    return await apiClient.get<string[]>("/search/history", {
      params: { limit },
    });
  },

  /**
   * Clear search history
   */
  async clearSearchHistory() {
    return await apiClient.delete("/search/history");
  },
};
