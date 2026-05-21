/**
 * Smart location sync — throttled client calls to refine home without overwriting
 * when the user is at work or a saved frequent place.
 */
import apiClient from "@/lib/api-client";
import type { SmartLocationSyncResult } from "@/lib/frequentPlaces";

const STORAGE_KEY = "nh_smart_loc_sync_last";
const MIN_CLIENT_INTERVAL_MS = 15 * 60 * 1000;

export async function syncSmartLocationIfNeeded(
  lat: number,
  lng: number,
  accuracy?: number,
): Promise<SmartLocationSyncResult | null> {
  if (!apiClient.isAuthenticated()) return null;

  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < MIN_CLIENT_INTERVAL_MS) {
      return null;
    }
  } catch {
    // ignore
  }

  try {
    const res = await apiClient.post<SmartLocationSyncResult>("/auth/location/sync", {
      latitude: lat,
      longitude: lng,
      accuracy,
    });
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    return res.data ?? {};
  } catch (err) {
    console.warn("[SmartLocationSync] failed:", err);
    return null;
  }
}
