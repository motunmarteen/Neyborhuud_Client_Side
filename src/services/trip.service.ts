/**
 * Trip Monitoring Service
 * Handles all Safe Trip API calls — lifecycle, location, check-ins, and history.
 */

import apiClient from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TripStatus =
  | "planned"
  | "active"
  | "completed"
  | "cancelled"
  | "escalated"
  | "panic";

export interface TripLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Trip {
  _id: string;
  userId: string;
  status: TripStatus;
  originText: string;
  destinationText: string;
  originLocation?: TripLocation;
  destinationLocation?: TripLocation;
  routePoints?: RoutePoint[];
  expectedArrival: string;
  checkInIntervalMinutes: number;
  notes?: string;
  escalationLevel: number;
  missedCheckIns: number;
  progressPercent: number;
  routeDeviationMeters: number;
  estimatedArrival?: string;
  lastCheckIn?: string;
  nextCheckInDue?: string;
  pausedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  linkedSosEventId?: string;
  guardiansNotified?: string[];
  currentLocation?: TripLocation;
  lastLocationUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripListResult {
  trips: Trip[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StartTripPayload {
  originText: string;
  destinationText: string;
  expectedArrival: string; // ISO date string
  checkInIntervalMinutes?: number;
  originLocation?: TripLocation;
  destinationLocation?: TripLocation;
  routePoints?: RoutePoint[];
  notes?: string;
}

export interface LocationUpdateResult {
  trip: Trip;
  progressPercent: number;
  routeDeviationMeters: number;
  estimatedArrival?: string;
  deviationWarning?: boolean;
  deviationAlert?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const tripService = {
  /** Create a planned trip (not yet actively monitored) */
  async createTrip(payload: StartTripPayload) {
    return apiClient.post<{ trip: Trip }>("/safety/trips/create", payload);
  },

  /** Create + activate in one call — the standard "start a safe trip" action */
  async startTrip(payload: StartTripPayload) {
    return apiClient.post<{ trip: Trip }>("/safety/trips/start", payload);
  },

  /** Activate a planned trip — begins BullMQ check-in monitoring */
  async activateTrip(tripId: string) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/activate`);
  },

  /** Manual safety check-in — resets escalation ladder */
  async checkIn(tripId: string, location?: TripLocation) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/checkin`, location ? { location } : {});
  },

  /** Continuous GPS background ping */
  async updateLocation(
    tripId: string,
    location: TripLocation,
    prevLocation?: TripLocation & { timestamp?: string },
  ) {
    return apiClient.post<LocationUpdateResult>(`/safety/trips/${tripId}/location`, {
      location,
      prevLocation,
    });
  },

  /** Mark trip as safely completed */
  async completeTrip(tripId: string) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/complete`);
  },

  /** Cancel a trip */
  async cancelTrip(tripId: string, reason?: string) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/cancel`, reason ? { reason } : {});
  },

  /** Pause check-in monitoring (e.g. arrived at an intermediate stop) */
  async pauseTrip(tripId: string) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/pause`);
  },

  /** Resume check-in monitoring */
  async resumeTrip(tripId: string) {
    return apiClient.post<{ trip: Trip }>(`/safety/trips/${tripId}/resume`);
  },

  /** Get the user's current planned/active/escalated trip */
  async getActiveTrip() {
    return apiClient.get<{ trip: Trip | null }>("/safety/trips/active");
  },

  /** Paginated trip history */
  async listTrips(page = 1, limit = 20) {
    return apiClient.get<TripListResult>("/safety/trips", { params: { page, limit } });
  },

  /** Single trip details */
  async getTripById(tripId: string) {
    return apiClient.get<{ trip: Trip }>(`/safety/trips/${tripId}`);
  },

  /**
   * Guardian-side view — returns the active trip of another user,
   * verifying the caller is an accepted guardian of that user.
   */
  async getTripGuardianView(userId: string) {
    return apiClient.get<{ trip: Trip | null }>(`/safety/trips/guardian-view/${userId}`);
  },
};
