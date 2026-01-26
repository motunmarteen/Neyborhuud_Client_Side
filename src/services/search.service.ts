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

export const searchService = {
  /**
   * Global search across all content types
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
      | "services",
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
    return await apiClient.get<PaginatedResponse<User>>("/search/users", {
      params: { q: query, page, limit },
    });
  },

  /**
   * Search posts
   */
  async searchPosts(query: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Post>>("/search/posts", {
      params: { q: query, page, limit },
    });
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
