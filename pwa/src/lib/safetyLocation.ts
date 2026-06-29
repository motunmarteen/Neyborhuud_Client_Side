import { getErrorMessage } from '@/lib/error-handler';
import { getGeolocation } from '@/lib/nativeGeolocation';

/** Resolve coordinates for safety status / SOS — GPS first, then profile fallback. */

export type SafetyCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'profile' | 'cached';
};

type ProfileLocation = {
  latitude?: number;
  longitude?: number;
};

function coordsFromProfile(loc?: ProfileLocation | null): SafetyCoords | null {
  if (loc?.latitude == null || loc?.longitude == null) return null;
  if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) return null;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    source: 'profile',
  };
}

function readPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const geo = getGeolocation();
    if (!geo) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }
    geo.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Best-effort location: cached/low-accuracy GPS → high-accuracy GPS → profile coords.
 */
export async function resolveSafetyCoords(
  profileLocation?: ProfileLocation | null,
): Promise<SafetyCoords | null> {
  if (getGeolocation()) {
    const attempts: PositionOptions[] = [
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 120_000 },
    ];

    for (const options of attempts) {
      try {
        const pos = await readPosition(options);
        const usedCache = options.maximumAge != null && options.maximumAge > 0 && pos.coords.accuracy === 0;
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: usedCache ? 'cached' : 'gps',
        };
      } catch {
        /* try next strategy */
      }
    }
  }

  return coordsFromProfile(profileLocation);
}

export function formatGeolocationFailure(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) {
      return 'Location permission denied. Allow location access, or we will use your profile location.';
    }
    if (code === 2) {
      return 'Location unavailable on this device.';
    }
    if (code === 3) {
      return 'GPS timed out. Allow a moment and try again, or enable location permissions.';
    }
  }
  const msg = err instanceof Error ? err.message : '';
  if (/timeout/i.test(msg)) return 'GPS timed out. Check location permissions and try again.';
  return msg || 'Unable to get location';
}

export function extractApiError(err: unknown, fallback: string): string {
  const resp = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
  if (resp?.data?.message) return resp.data.message;

  const friendly = getErrorMessage(err);
  if (friendly && !/request failed with status code \d+/i.test(friendly)) {
    return friendly;
  }

  if (resp?.status === 403) {
    return 'Account verification or a complete profile (name and phone) is required before live tracking.';
  }
  if (resp?.status === 404) return 'Status API is not available on the server yet.';
  return fallback;
}
