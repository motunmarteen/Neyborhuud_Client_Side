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
    if (!isAuthenticated || ranRef.current) return;
    ranRef.current = true;

    void (async () => {
      const loc = await getCurrentLocation();
      if (!loc) return;
      await runSmartLocationSync(loc.lat, loc.lng, loc.accuracy);
    })();
  }, [isAuthenticated]);

  return null;
}

export function triggerSmartLocationSync(lat: number, lng: number, accuracy?: number): void {
  void runSmartLocationSync(lat, lng, accuracy);
}
