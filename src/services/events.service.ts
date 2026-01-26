/**
 * Events Service
 * Handles event creation, management, and attendance
 */

import apiClient from "@/lib/api-client";
import {
  Event,
  PaginatedResponse,
  CreateEventPayload,
  User,
} from "@/types/api";

export const eventsService = {
  /**
   * Create a new event
   */
  async createEvent(
    payload: CreateEventPayload,
    onProgress?: (progress: number) => void,
  ) {
    if (payload.coverImage) {
      const { coverImage, ...eventData } = payload;
      return await apiClient.uploadFile<Event>(
        "/events",
        coverImage,
        eventData,
        onProgress,
      );
    }

    return await apiClient.post<Event>("/events", payload);
  },

  /**
   * Get all events
   */
  async getEvents(
    page = 1,
    limit = 20,
    filter?: {
      type?: string;
      date?: string;
      location?: string;
      status?: string;
    },
  ) {
    return await apiClient.get<PaginatedResponse<Event>>("/events", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get nearby events
   */
  async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius = 5000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/nearby", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
    });
  },

  /**
   * Get a single event
   */
  async getEvent(eventId: string) {
    return await apiClient.get<Event>(`/events/${eventId}`);
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string, data: Partial<CreateEventPayload>) {
    return await apiClient.put<Event>(`/events/${eventId}`, data);
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    return await apiClient.delete(`/events/${eventId}`);
  },

  /**
   * Attend an event
   */
  async attendEvent(eventId: string) {
    return await apiClient.post(`/events/${eventId}/attend`);
  },

  /**
   * Unattend an event
   */
  async unattendEvent(eventId: string) {
    return await apiClient.delete(`/events/${eventId}/attend`);
  },

  /**
   * Get event attendees
   */
  async getAttendees(eventId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>(
      `/events/${eventId}/attendees`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get events I'm attending
   */
  async getMyEvents(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/my-events", {
      params: { page, limit },
    });
  },

  /**
   * Get events I organized
   */
  async getMyOrganizedEvents(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/organized", {
      params: { page, limit },
    });
  },

  /**
   * Cancel an event
   */
  async cancelEvent(eventId: string, reason?: string) {
    return await apiClient.post(`/events/${eventId}/cancel`, { reason });
  },

  /**
   * Share an event
   */
  async shareEvent(eventId: string, message?: string) {
    return await apiClient.post(`/events/${eventId}/share`, { message });
  },

  /**
   * Report an event
   */
  async reportEvent(eventId: string, reason: string, description?: string) {
    return await apiClient.post(`/events/${eventId}/report`, {
      reason,
      description,
    });
  },
};
