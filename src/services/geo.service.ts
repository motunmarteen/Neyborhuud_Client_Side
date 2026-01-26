/**
 * Geolocation Service
 * Handles location-based features and geocoding
 */

import apiClient from "@/lib/api-client";
import { LocationData, User, Post, Event } from "@/types/api";

export const geoService = {
  /**
   * Reverse geocode coordinates to location data
   */
  async reverseGeocode(latitude: number, longitude: number) {
    return await apiClient.get<LocationData>("/geo/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
    });
  },

  /**
   * Get list of all states
   */
  async getStates() {
    return await apiClient.get<string[]>("/geo/states");
  },

  /**
   * Get LGAs in a state
   */
  async getLGAs(state: string) {
    return await apiClient.get<string[]>(
      `/geo/states/${encodeURIComponent(state)}/lgas`,
    );
  },

  /**
   * Get wards in an LGA
   */
  async getWards(state: string, lga: string) {
    return await apiClient.get<string[]>(
      `/geo/states/${encodeURIComponent(state)}/lgas/${encodeURIComponent(lga)}/wards`,
    );
  },

  /**
   * Get nearby users
   */
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius = 5000,
    limit = 50,
  ) {
    return await apiClient.get<User[]>("/geo/nearby/users", {
      params: { lat: latitude, lng: longitude, radius, limit },
    });
  },

  /**
   * Get nearby posts
   */
  async getNearbyPosts(
    latitude: number,
    longitude: number,
    radius = 5000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<Post[]>("/geo/nearby/posts", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
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
    return await apiClient.get<Event[]>("/geo/nearby/events", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
    });
  },

  /**
   * Get user's current location from browser
   */
  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
    });
  },

  /**
   * Watch user's location for changes
   */
  watchPosition(
    onSuccess: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationPositionError) => void,
  ): number {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by your browser");
    }

    return navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  },

  /**
   * Clear location watch
   */
  clearWatch(watchId: number) {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
};
