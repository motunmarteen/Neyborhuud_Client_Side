/**
 * Services Service
 * Handles professional services, bookings, and reviews
 */

import apiClient from "@/lib/api-client";
import { Service, ServiceBooking, PaginatedResponse } from "@/types/api";

export const servicesService = {
  /**
   * Get all services
   */
  async getServices(
    page = 1,
    limit = 20,
    filter?: {
      category?: string;
      subcategory?: string;
      minRating?: number;
      providerId?: string;
    },
  ) {
    return await apiClient.get<PaginatedResponse<Service>>("/services", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get nearby services
   */
  async getNearbyServices(
    latitude: number,
    longitude: number,
    radius = 10000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<Service>>("/services/nearby", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
    });
  },

  /**
   * Get a single service
   */
  async getService(serviceId: string) {
    return await apiClient.get<Service>(`/services/${serviceId}`);
  },

  /**
   * Book a service
   */
  async bookService(serviceId: string, date: string, notes?: string) {
    return await apiClient.post<ServiceBooking>(`/services/${serviceId}/book`, {
      date,
      notes,
    });
  },

  /**
   * Cancel a booking (DELETE)
   */
  async cancelBooking(bookingId: string) {
    return await apiClient.delete(`/services/bookings/${bookingId}`);
  },

  /**
   * Get my bookings
   */
  async getMyBookings(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<ServiceBooking>>(
      "/services/my/bookings",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get bookings for my service
   */
  async getServiceBookings(serviceId: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<ServiceBooking>>(
      `/services/${serviceId}/bookings`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Update booking status (provider only: confirmed | completed | cancelled)
   */
  async updateBookingStatus(bookingId: string, status: "confirmed" | "completed" | "cancelled") {
    return await apiClient.patch(`/services/bookings/${bookingId}/status`, { status });
  },

  /**
   * Rate a service
   */
  async rateService(serviceId: string, rating: number, review?: string) {
    return await apiClient.post(`/services/${serviceId}/rate`, {
      rating,
      review,
    });
  },

  /**
   * Get service reviews
   */
  async getReviews(serviceId: string, page = 1, limit = 20) {
    return await apiClient.get(`/services/${serviceId}/reviews`, {
      params: { page, limit },
    });
  },

  /**
   * Favorite a service
   */
  async favoriteService(serviceId: string) {
    return await apiClient.post(`/services/${serviceId}/favorite`);
  },

  /**
   * Unfavorite a service
   */
  async unfavoriteService(serviceId: string) {
    return await apiClient.delete(`/services/${serviceId}/favorite`);
  },

  /**
   * Get my favorite services
   */
  async getMyFavorites(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Service>>(
      "/services/my/favorites",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Contact service provider
   */
  async contactProvider(serviceId: string, message: string) {
    return await apiClient.post(`/services/${serviceId}/contact`, { message });
  },

  /**
   * Share a service
   */
  async shareService(serviceId: string, message?: string) {
    return await apiClient.post(`/services/${serviceId}/share`, { message });
  },

  /**
   * Report a service
   */
  async reportService(serviceId: string, reason: string, description?: string) {
    return await apiClient.post(`/services/${serviceId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Create a new service listing (multipart/form-data for images)
   */
  async createService(payload: {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    pricing: { type: "fixed" | "hourly" | "custom"; amount?: number; currency: string };
    availability: { days: string[]; hours: string };
    imageFiles?: File[];
    latitude?: number;
    longitude?: number;
    address?: string;
    lga?: string;
    state?: string;
    phone?: string;
  }) {
    const fd = new FormData();
    fd.append("title", payload.title);
    fd.append("description", payload.description);
    fd.append("category", payload.category);
    if (payload.subcategory) fd.append("subcategory", payload.subcategory);
    fd.append("pricing.type", payload.pricing.type);
    if (payload.pricing.amount != null) fd.append("pricing.amount", String(payload.pricing.amount));
    fd.append("pricing.currency", payload.pricing.currency);
    fd.append("availability.days", payload.availability.days.join(","));
    fd.append("availability.hours", payload.availability.hours);
    if (payload.latitude != null) fd.append("latitude", String(payload.latitude));
    if (payload.longitude != null) fd.append("longitude", String(payload.longitude));
    if (payload.address) fd.append("address", payload.address);
    if (payload.lga) fd.append("lga", payload.lga);
    if (payload.state) fd.append("state", payload.state);
    if (payload.phone) fd.append("phone", payload.phone);
    payload.imageFiles?.forEach((f) => fd.append("images", f));
    return await apiClient.post<Service>("/services", fd);
  },

  /**
   * Update an existing service (multipart/form-data for images)
   */
  async updateService(serviceId: string, payload: {
    title?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    pricing?: { type?: string; amount?: number; currency?: string };
    availability?: { days?: string[]; hours?: string };
    imageFiles?: File[];
    status?: "active" | "inactive";
  }) {
    const fd = new FormData();
    if (payload.title) fd.append("title", payload.title);
    if (payload.description != null) fd.append("description", payload.description);
    if (payload.category) fd.append("category", payload.category);
    if (payload.subcategory != null) fd.append("subcategory", payload.subcategory);
    if (payload.pricing?.type) fd.append("pricing.type", payload.pricing.type);
    if (payload.pricing?.amount != null) fd.append("pricing.amount", String(payload.pricing.amount));
    if (payload.pricing?.currency) fd.append("pricing.currency", payload.pricing.currency);
    if (payload.availability?.days) fd.append("availability.days", payload.availability.days.join(","));
    if (payload.availability?.hours != null) fd.append("availability.hours", payload.availability.hours);
    if (payload.status) fd.append("status", payload.status);
    payload.imageFiles?.forEach((f) => fd.append("images", f));
    return await apiClient.put<Service>(`/services/${serviceId}`, fd);
  },

  /**
   * Boost a service listing with HuudCoins
   */
  async boostService(serviceId: string, days: 3 | 7) {
    return await apiClient.post<{ deducted: number; days: number; boostedUntil: string }>(
      `/services/${serviceId}/boost`,
      { days },
    );
  },
};
