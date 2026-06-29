import apiClient from "@/lib/api-client";
import type { FrequentPlace, HomeSummary, SmartLocationSyncResult } from "@/lib/frequentPlaces";

export const locationService = {
  async getMyPlaces(): Promise<{ home: HomeSummary; frequentPlaces: FrequentPlace[] }> {
    const res = await apiClient.get<{ home: HomeSummary; frequentPlaces: FrequentPlace[] }>(
      "/auth/locations/places",
    );
    const payload = res.data ?? { home: {}, frequentPlaces: [] };
    return {
      home: payload.home ?? {},
      frequentPlaces: payload.frequentPlaces ?? [],
    };
  },

  async addFrequentPlace(input: {
    kind: string;
    label?: string;
    latitude: number;
    longitude: number;
  }): Promise<FrequentPlace> {
    const res = await apiClient.post<{ place: FrequentPlace }>("/auth/locations/frequent", input);
    const place = res.data?.place;
    if (!place) throw new Error("Failed to save place");
    return place;
  },

  async removeFrequentPlace(placeId: string): Promise<FrequentPlace[]> {
    const res = await apiClient.delete<{ frequentPlaces: FrequentPlace[] }>(
      `/auth/locations/frequent/${placeId}`,
    );
    const data = (res as { data?: { frequentPlaces: FrequentPlace[] } }).data ?? res;
    return (data as { frequentPlaces: FrequentPlace[] }).frequentPlaces;
  },

  async confirmHomeRefinement(): Promise<void> {
    await apiClient.post("/auth/location/confirm-home");
  },

  async dismissHomeHint(): Promise<void> {
    await apiClient.post("/auth/location/dismiss-home-hint");
  },

  async syncSmartLocation(
    latitude: number,
    longitude: number,
    accuracy?: number,
  ): Promise<SmartLocationSyncResult> {
    const res = await apiClient.post<SmartLocationSyncResult>("/auth/location/sync", {
      latitude,
      longitude,
      accuracy,
    });
    return res.data ?? {};
  },
};
