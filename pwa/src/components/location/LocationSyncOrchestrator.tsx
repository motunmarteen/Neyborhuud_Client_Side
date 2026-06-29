"use client";

import { useEffect, useState } from "react";
import type { SmartLocationSyncResult } from "@/lib/frequentPlaces";
import { syncSmartLocationIfNeeded } from "@/lib/smartLocationSync";
import { HomeRefinementPrompt } from "@/components/location/HomeRefinementPrompt";

const HINT_SESSION_KEY = "nh_home_hint_shown";

export function LocationSyncOrchestrator() {
  const [hint, setHint] = useState<SmartLocationSyncResult | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SmartLocationSyncResult>).detail;
      if (!detail?.showHomeHint || !detail.homeRefinement) return;
      try {
        if (sessionStorage.getItem(HINT_SESSION_KEY) === "1") return;
      } catch {
        // ignore
      }
      setHint(detail);
    };
    window.addEventListener("neyborhuud:location-sync", handler);
    return () => window.removeEventListener("neyborhuud:location-sync", handler);
  }, []);

  function closeHint() {
    try {
      sessionStorage.setItem(HINT_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setHint(null);
  }

  if (!hint?.homeRefinement) return null;

  return (
    <HomeRefinementPrompt
      hint={hint.homeRefinement}
      currentHome={hint.primaryAddress}
      onDone={closeHint}
    />
  );
}

export function emitLocationSyncResult(result: SmartLocationSyncResult | null) {
  if (!result || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("neyborhuud:location-sync", { detail: result }));
}

/** Re-export for feed page — returns sync result for hint orchestrator */
export async function runSmartLocationSync(
  lat: number,
  lng: number,
  accuracy?: number,
): Promise<SmartLocationSyncResult | null> {
  const result = await syncSmartLocationIfNeeded(lat, lng, accuracy);
  emitLocationSyncResult(result);
  return result;
}
