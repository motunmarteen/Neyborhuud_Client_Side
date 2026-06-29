"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentLocation } from "@/lib/geolocation";
import { runSmartLocationSync } from "@/components/location/LocationSyncOrchestrator";

/**
 * Runs smart location sync once per authenticated session (throttled).
 */
export function SmartLocationSync() {
  const { isAuthenticated } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    // Disabled automatic background location sync on startup to prevent unwanted permission prompts.
    // Location is only requested when explicitly needed by specific features.
    return;
  }, [isAuthenticated]);

  return null;
}

export function triggerSmartLocationSync(lat: number, lng: number, accuracy?: number): void {
  void runSmartLocationSync(lat, lng, accuracy);
}
