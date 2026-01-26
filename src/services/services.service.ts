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
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string) {
    return await apiClient.post(`/services/bookings/${bookingId}/cancel`, {
      reason,
    });
  },

  /**
   * Get my bookings
   */
  async getMyBookings(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<ServiceBooking>>(
      "/services/bookings",
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
   * Confirm a booking (service provider)
   */
  async confirmBooking(bookingId: string) {
    return await apiClient.patch(`/services/bookings/${bookingId}/confirm`);
  },

  /**
   * Complete a booking
   */
  async completeBooking(bookingId: string) {
    return await apiClient.patch(`/services/bookings/${bookingId}/complete`);
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
   * Get favorite services
   */
  async getFavoriteServices(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Service>>(
      "/services/favorites",
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
   * Get service categories
   */
  async getCategories() {
    return await apiClient.get<string[]>("/services/categories");
  },
};
