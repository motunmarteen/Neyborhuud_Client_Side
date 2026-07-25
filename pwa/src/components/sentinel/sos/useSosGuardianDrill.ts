'use client';

/**
 * Real, server-reaching SOS drill — distinct from `useSosDrill` (which only
 * rehearses the local countdown UI and never contacts the server).
 *
 * This DOES reach the backend and DOES notify the caller's real accepted
 * guardians, so they get genuine practice acknowledging an alert — but it is
 * unambiguously marked as a drill everywhere it appears (guardian
 * notification text, incident recap, SOS history) and can NEVER create a
 * real Emergency record or reach agency dispatch, regardless of any
 * "notify emergency services" setting — see safetyService.triggerDrillSos
 * on the backend for how that's enforced structurally, not just by omission
 * here on the client.
 */

import { useCallback, useState } from 'react';
import { safetyService } from '@/services/safety.service';
import { getGeolocation } from '@/lib/nativeGeolocation';

function getCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const geo = getGeolocation();
    if (!geo) {
      resolve(null);
      return;
    }
    geo.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}

export function useSosGuardianDrill() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sosEventId: string; guardiansNotified: number } | null>(null);

  const start = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const coords = await getCoords();
      const res = await safetyService.triggerSosDrill({
        latitude: coords?.latitude ?? 0,
        longitude: coords?.longitude ?? 0,
      });
      if (!res.data) throw new Error('No response from server.');
      setResult({ sosEventId: res.data.sosEventId, guardiansNotified: res.data.guardiansNotified });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start guardian drill.');
    } finally {
      setRunning(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { running, error, result, start, clear };
}
