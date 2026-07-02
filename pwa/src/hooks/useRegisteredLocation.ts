'use client';

/**
 * useRegisteredLocation
 *
 * Single source of truth for a user's location in CONTENT features (marketplace
 * listings, posts, jobs, events, help requests, …). It reuses the location the
 * user declared at sign-up (`primaryLocation`) — NO live GPS prompt.
 *
 * Rationale: the user already told us where they are during onboarding. Asking
 * the browser for geolocation again on every create-form is intrusive, fails on
 * "denied" permission, and is unnecessary — their neighbourhood doesn't change
 * per listing. Live GPS is reserved for true safety features (SOS, live
 * tracking, trips) where real-time position matters.
 *
 * Returns registered coordinates plus the human-readable area labels, and a
 * `ready` flag so forms can gate submit on "we know where you live".
 */

import { useAuth } from '@/hooks/useAuth';
import { extractUserHomeCoords } from '@/lib/mapUserLocation';
import { authService } from '@/services/auth.service';

/**
 * Synchronous, non-React reader for the registered signup location — for
 * imperative call sites (e.g. inside submit handlers) that can't use the hook.
 * Reads the cached current user. Returns null if no registered coords.
 */
export function getRegisteredLocationSync(): {
  latitude: number;
  longitude: number;
} | null {
  try {
    const user = authService.getCachedUser();
    if (!user) return null;
    const coords = extractUserHomeCoords(user as never);
    return coords ? { latitude: coords.lat, longitude: coords.lng } : null;
  } catch {
    return null;
  }
}

export interface RegisteredLocation {
  latitude: number;
  longitude: number;
  state?: string;
  lga?: string;
  ward?: string;
  neighborhood?: string;
  formattedAddress?: string;
}

export function useRegisteredLocation() {
  const { user, isLoading } = useAuth();

  const u = (user ?? {}) as Record<string, unknown>;
  const coords = extractUserHomeCoords(u as never);

  const location: RegisteredLocation | null = coords
    ? {
        latitude: coords.lat,
        longitude: coords.lng,
        state: (u.state as string) || undefined,
        lga: (u.lga as string) || undefined,
        ward: (u.ward as string) || undefined,
        neighborhood: (u.neighborhood as string) || undefined,
        formattedAddress: (u.formattedAddress as string) || undefined,
      }
    : null;

  return {
    /** Registered location (from signup) or null if not set. */
    location,
    /** True when we have usable registered coordinates. */
    ready: !!location,
    /** True while the current user is still loading. */
    isLoading,
    /** Human label, e.g. "Ikeja, Lagos". */
    areaLabel: location
      ? [location.lga, location.state].filter(Boolean).join(', ')
      : '',
  };
}
