/**
 * Marketplace Service
 * Handles marketplace products with social features (likes, comments, CRUD)
 * Updated for consolidated Product model backend (April 2026)
 */

import apiClient from "@/lib/api-client";
import {
  MarketplaceItem,
  PaginatedResponse,
  CreateMarketplaceItemPayload,
  Comment,
} from "@/types/api";

// ==================== Product Response Types ====================

export interface ProductEngagement {
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface Product extends MarketplaceItem {
  engagement?: ProductEngagement;
}

export interface ProductDetails {
  product: Product;
  comments: Comment[];
}

export interface ProductLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export interface CommentResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== Marketplace Service ====================

export const marketplaceService = {
  // ==================== Product CRUD ====================

  /**
   * Create a new product listing
   * POST /api/v1/marketplace
   */
  async createProduct(
    payload: {
      title: string;
      description: string;
      price: number;
      category: string;
      images: File[] | string[];
      location: {
        latitude: number;
        longitude: number;
        address?: string;
      };
      condition?: "new" | "like_new" | "good" | "fair" | "poor";
      negotiable?: boolean;
      delivery?: {
        available: boolean;
        fee?: number;
        methods?: string[];
      };
    },
    onProgress?: (progress: number) => void,
  ) {
    const { images, ...itemData } = payload;
    
    // If images are File objects, use upload endpoint
    if (images.length > 0 && images[0] instanceof File) {
      // multipart/form-data has no native concept of nested objects. We send the
      // location/delivery objects in three compatible shapes so the backend can
      // read whichever it expects:
      //   1. Flat top-level fields: latitude, longitude, address (simplest)
      //   2. Bracket notation: location[latitude], location[longitude], ...
      //      (parsed by qs / body-parser style middleware)
      //   3. JSON strings: location, delivery (backend can JSON.parse if string)
      const loc = itemData.location;
      const del = itemData.delivery;

      const additionalData: Record<string, unknown> = {
        title: itemData.title,
        description: itemData.description,
        price: itemData.price,
        category: itemData.category,
        condition: itemData.condition,
        negotiable: itemData.negotiable,
        // (1) Flat top-level fields for backends that read req.body.latitude
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        address: loc?.address,
        // (2) Bracket-notation nested fields (handled by appendFormValue)
        locationNested: loc,
        deliveryNested: del,
        // (3) JSON-string fallback for backends that JSON.parse strings
        location: loc ? JSON.stringify(loc) : undefined,
        delivery: del ? JSON.stringify(del) : undefined,
      };

      // Rename the bracket-notation keys back to "location" / "delivery" so the
      // server sees location[latitude]=..., location[longitude]=..., etc.
      // (We can't put the nested object under the same key as the JSON string,
      // so we let api-client emit bracket-notation under a temp key and rewrite.)
      // Simpler approach: emit bracket fields manually via additionalData keys.
      delete additionalData.locationNested;
      delete additionalData.deliveryNested;
      if (loc) {
        if (loc.latitude !== undefined) additionalData["location[latitude]"] = loc.latitude;
        if (loc.longitude !== undefined) additionalData["location[longitude]"] = loc.longitude;
        if (loc.address !== undefined) additionalData["location[address]"] = loc.address;
      }
      if (del) {
        if (del.available !== undefined) additionalData["delivery[available]"] = del.available;
        if (del.fee !== undefined) additionalData["delivery[fee]"] = del.fee;
        if (Array.isArray(del.methods)) {
          del.methods.forEach((m, i) => {
            additionalData[`delivery[methods][${i}]`] = m;
          });
        }
      }

      return await apiClient.uploadFiles<Product>(
        "/marketplace",
        images as File[],
        additionalData,
        onProgress,
      );
    }
    
    // Otherwise, images are URLs, send as JSON
    return await apiClient.post<Product>("/marketplace", {
      ...itemData,
      images,
    });
  },

  /**
   * Get a single product with engagement data
   * GET /api/v1/marketplace/{productId}
   */
  async getProduct(productId: string) {
    return await apiClient.get<Product>(`/marketplace/${productId}`);
  },

  /**
   * Update an existing product
   * PATCH /api/v1/marketplace/{productId}
   */
  async updateProduct(
    productId: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      category: string;
      images: string[];
      location: {
        latitude: number;
        longitude: number;
        address?: string;
      };
      status: "active" | "sold" | "archived";
      condition: "new" | "like_new" | "good" | "fair" | "poor";
    }>,
  ) {
    return await apiClient.patch<Product>(`/marketplace/${productId}`, data);
  },

  /**
   * Delete a product (soft delete to archived status)
   * DELETE /api/v1/marketplace/{productId}
   */
  async deleteProduct(productId: string) {
    return await apiClient.delete<{ productId: string }>(
      `/marketplace/${productId}`,
    );
  },

  // ==================== Social Interactions ====================

  /**
   * Toggle like on a product (idempotent)
   * POST /api/v1/marketplace/{productId}/like
   */
  async toggleLike(productId: string) {
    return await apiClient.post<ProductLikeResponse>(
      `/marketplace/${productId}/like`,
    );
  },

  /**
   * Add a comment to a product
   * POST /api/v1/marketplace/{productId}/comments
   */
  async addComment(
    productId: string,
    payload: {
      body: string;
      parentId?: string;
      mediaUrls?: string[];
    },
  ) {
    return await apiClient.post<Comment>(
      `/marketplace/${productId}/comments`,
      payload,
    );
  },

  /**
   * Get comments for a product
   * GET /api/v1/marketplace/{productId}/comments
   */
  async getComments(productId: string, page = 1, limit = 20) {
    return await apiClient.get<CommentResponse>(
      `/marketplace/${productId}/comments`,
      {
        params: { page, limit },
      },
    );
  },

  // ==================== Product Discovery ====================

  /**
   * Get all marketplace products (legacy endpoint - keeping for compatibility)
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
    return await apiClient.get<PaginatedResponse<Product>>(
      "/marketplace/items",
      {
        params: { page, limit, ...filter },
      },
    );
  },

  /**
   * Get nearby marketplace products
   */
  async getNearbyItems(
    latitude: number,
    longitude: number,
    radius = 10000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<Product>>(
      "/marketplace/items/nearby",
      {
        params: { lat: latitude, lng: longitude, radius, page, limit },
      },
    );
  },

  /**
   * Get my listings
   */
  async getMyListings(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Product>>(
      "/marketplace/my-listings",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get saved products
   */
  async getSavedItems(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Product>>(
      "/marketplace/saved",
      {
        params: { page, limit },
      },
    );
  },

  // ==================== Legacy Methods (Deprecated) ====================
  // Keeping for backward compatibility, but prefer new methods above

  /**
   * @deprecated Use toggleLike instead
   */
  async likeItem(itemId: string) {
    return await this.toggleLike(itemId);
  },

  /**
   * @deprecated Use toggleLike instead
   */
  async unlikeItem(itemId: string) {
    return await this.toggleLike(itemId);
  },

  /**
   * @deprecated Use getProduct instead
   */
  async getItem(itemId: string) {
    return await this.getProduct(itemId);
  },

  /**
   * @deprecated Use updateProduct instead
   */
  async updateItem(
    itemId: string,
    data: Partial<CreateMarketplaceItemPayload>,
  ) {
    return await this.updateProduct(itemId, data as any);
  },

  /**
   * @deprecated Use deleteProduct instead
   */
  async deleteItem(itemId: string) {
    return await this.deleteProduct(itemId);
  },

  /**
   * Mark product as sold
   */
  async markAsSold(productId: string) {
    return await this.updateProduct(productId, { status: "sold" });
  },

  /**
   * Mark product as available
   */
  async markAsAvailable(productId: string) {
    return await this.updateProduct(productId, { status: "active" });
  },

  /**
   * Mark product as archived
   */
  async markAsArchived(productId: string) {
    return await this.updateProduct(productId, { status: "archived" });
  },

  // ==================== Saved Products ====================

  /**
   * Save a product
   */
  async saveItem(itemId: string) {
    return await apiClient.post(`/marketplace/items/${itemId}/save`);
  },

  /**
   * Unsave a product
   */
  async unsaveItem(itemId: string) {
    return await apiClient.delete(`/marketplace/items/${itemId}/save`);
  },

  // ==================== Transactional Features ====================

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
   * Share a product
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

  // ==================== Buyer Intent & Transactions ====================



  /**
   * Respond to an offer (seller)
   * PATCH /api/v1/marketplace/offers/:offerId/respond
   */
  async respondToOffer(
    offerId: string,
    action: "accept" | "reject" | "counter",
    counterAmount?: number,
  ) {
    return await apiClient.patch(`/marketplace/offers/${offerId}/respond`, {
      action,
      counterAmount,
    });
  },

  /**
   * Create an order (request to buy)
   * POST /api/v1/marketplace/orders
   */
  async createOrder(data: { productId: string; offerId?: string }) {
    return await apiClient.post("/marketplace/orders", data);
  },

  /**
   * Get my orders (as buyer)
   * GET /api/v1/marketplace/my-orders
   */
  async getMyOrders(page = 1, limit = 20) {
    return await apiClient.get("/marketplace/my-orders", {
      params: { page, limit },
    });
  },

  /**
   * Get my sales (as seller)
   * GET /api/v1/marketplace/my-sales
   */
  async getMySales(page = 1, limit = 20) {
    return await apiClient.get("/marketplace/my-sales", {
      params: { page, limit },
    });
  },

  /**
   * Get a specific order
   * GET /api/v1/marketplace/orders/:orderId
   */
  async getOrder(orderId: string) {
    return await apiClient.get(`/marketplace/orders/${orderId}`);
  },

  /**
   * Get my offers (sent or received)
   * GET /api/v1/marketplace/my-offers?type=sent|received
   */
  async getMyOffers(type: "sent" | "received", page = 1, limit = 20) {
    return await apiClient.get("/marketplace/my-offers", {
      params: { type, page, limit },
    });
  },

  /**
   * Get a specific offer
   * GET /api/v1/marketplace/offers/:offerId
   */
  async getOffer(offerId: string) {
    return await apiClient.get(`/marketplace/offers/${offerId}`);
  },

  /**
   * Update order status
   * PATCH /api/v1/marketplace/orders/:orderId/status
   */
  async updateOrderStatus(orderId: string, status: string) {
    return await apiClient.patch(`/marketplace/orders/${orderId}/status`, {
      status,
    });
  },

  /**
   * Confirm payment (buyer uploads proof)
   * POST /api/v1/marketplace/orders/:orderId/confirm-payment
   */
  async confirmPayment(orderId: string, proofUrl: string) {
    return await apiClient.post(
      `/marketplace/orders/${orderId}/confirm-payment`,
      { proofUrl },
    );
  },

  /**
   * Confirm receipt (seller confirms payment received)
   * POST /api/v1/marketplace/orders/:orderId/confirm-receipt
   */
  async confirmReceipt(orderId: string) {
    return await apiClient.post(
      `/marketplace/orders/${orderId}/confirm-receipt`,
    );
  },
};
