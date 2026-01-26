/**
 * Marketplace Service
 * Handles marketplace items, buying, and selling
 */

import apiClient from "@/lib/api-client";
import {
  MarketplaceItem,
  PaginatedResponse,
  CreateMarketplaceItemPayload,
} from "@/types/api";

export const marketplaceService = {
  /**
   * Create a new marketplace item
   */
  async createItem(
    payload: CreateMarketplaceItemPayload,
    onProgress?: (progress: number) => void,
  ) {
    const { images, ...itemData } = payload;
    return await apiClient.uploadFiles<MarketplaceItem>(
      "/marketplace/items",
      images,
      itemData,
      onProgress,
    );
  },

  /**
   * Get all marketplace items
   */
  async getItems(
    page = 1,
    limit = 20,
    filter?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      delivery?: boolean;
    },
  ) {
    return await apiClient.get<PaginatedResponse<MarketplaceItem>>(
      "/marketplace/items",
      {
        params: { page, limit, ...filter },
      },
    );
  },

  /**
   * Get nearby marketplace items
   */
  async getNearbyItems(
    latitude: number,
    longitude: number,
    radius = 10000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<MarketplaceItem>>(
      "/marketplace/items/nearby",
      {
        params: { lat: latitude, lng: longitude, radius, page, limit },
      },
    );
  },

  /**
   * Get a single item
   */
  async getItem(itemId: string) {
    return await apiClient.get<MarketplaceItem>(`/marketplace/items/${itemId}`);
  },

  /**
   * Update an item
   */
  async updateItem(
    itemId: string,
    data: Partial<CreateMarketplaceItemPayload>,
  ) {
    return await apiClient.put<MarketplaceItem>(
      `/marketplace/items/${itemId}`,
      data,
    );
  },

  /**
   * Delete an item
   */
  async deleteItem(itemId: string) {
    return await apiClient.delete(`/marketplace/items/${itemId}`);
  },

  /**
   * Mark item as sold
   */
  async markAsSold(itemId: string) {
    return await apiClient.patch(`/marketplace/items/${itemId}/status`, {
      status: "sold",
    });
  },

  /**
   * Mark item as available
   */
  async markAsAvailable(itemId: string) {
    return await apiClient.patch(`/marketplace/items/${itemId}/status`, {
      status: "available",
    });
  },

  /**
   * Reserve an item
   */
  async reserveItem(itemId: string) {
    return await apiClient.patch(`/marketplace/items/${itemId}/status`, {
      status: "reserved",
    });
  },

  /**
   * Like an item
   */
  async likeItem(itemId: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/like`);
  },

  /**
   * Unlike an item
   */
  async unlikeItem(itemId: string) {
    return await apiClient.delete(`/marketplace/items/${itemId}/like`);
  },

  /**
   * Save an item
   */
  async saveItem(itemId: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/save`);
  },

  /**
   * Unsave an item
   */
  async unsaveItem(itemId: string) {
    return await apiClient.delete(`/marketplace/items/${itemId}/save`);
  },

  /**
   * Get saved items
   */
  async getSavedItems(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<MarketplaceItem>>(
      "/marketplace/saved",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get my listings
   */
  async getMyListings(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<MarketplaceItem>>(
      "/marketplace/my-listings",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Contact seller
   */
  async contactSeller(itemId: string, message: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/contact`, {
      message,
    });
  },

  /**
   * Make an offer
   */
  async makeOffer(itemId: string, amount: number, message?: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/offer`, {
      amount,
      message,
    });
  },

  /**
   * Share an item
   */
  async shareItem(itemId: string, message?: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/share`, {
      message,
    });
  },

  /**
   * Report an item
   */
  async reportItem(itemId: string, reason: string, description?: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Get marketplace categories
   */
  async getCategories() {
    return await apiClient.get<string[]>("/marketplace/categories");
  },
};
