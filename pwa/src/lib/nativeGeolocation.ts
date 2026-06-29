/**
 * Platform-aware geolocation shim.
 *
 * Exposes a *drop-in* replacement for `navigator.geolocation` so existing call
 * sites can swap `navigator.geolocation` -> `getGeolocation()` with no other
 * change. On the web/PWA build it delegates straight to the browser API. Inside
 * the native Capacitor shell it uses `@capacitor/geolocation`, which routes
 * through the OS location services (and the manifest ACCESS_FINE/COARSE
 * permissions) instead of the WebView's geolocation, which is unreliable on
 * Android WebView.
 *
 * @capacitor/geolocation is imported dynamically so the web bundle never loads
 * it and the build has no hard dependency on Capacitor at runtime.
 */
import { isNativePlatform } from './platform';

/** Subset of the Web Geolocation API the app actually uses. */
export interface GeolocationLike {
  getCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): void;
  watchPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): number;
  clearWatch(id: number): void;
}

// Shape of the Capacitor Geolocation plugin we rely on (typed loosely so we
// don't need the package types at web-build time).
type CapPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};
type CapGeoPlugin = {
  getCurrentPosition(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<CapPosition>;
  watchPosition(
    options: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
    callback: (position: CapPosition | null, err?: unknown) => void,
  ): Promise<string>;
  clearWatch(options: { id: string }): Promise<void>;
  requestPermissions?(): Promise<{ location?: string; coarseLocation?: string }>;
};

let capGeoPromise: Promise<CapGeoPlugin> | null = null;
function loadCapGeo(): Promise<CapGeoPlugin> {
  if (!capGeoPromise) {
    capGeoPromise = import('@capacitor/geolocation').then(
      (m) => m.Geolocation as unknown as CapGeoPlugin,
    );
  }
  return capGeoPromise;
}

/** Convert a Capacitor position into a Web GeolocationPosition shape. */
function toWebPosition(p: CapPosition): GeolocationPosition {
  return {
    coords: {
      latitude: p.coords.latitude,
      longitude: p.coords.longitude,
      accuracy: p.coords.accuracy,
      altitude: p.coords.altitude,
      altitudeAccuracy: p.coords.altitudeAccuracy,
      heading: p.coords.heading,
      speed: p.coords.speed,
      // toJSON is required on the DOM type; provide a minimal impl.
      toJSON() {
        return this;
      },
    },
    timestamp: p.timestamp,
    toJSON() {
      return this;
    },
  } as GeolocationPosition;
}

/** Build a GeolocationPositionError-like object from an arbitrary error. */
function toWebError(err: unknown): GeolocationPositionError {
  const message = err instanceof Error ? err.message : String(err);
  // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
  const denied = /denied|permission/i.test(message);
  return {
    code: denied ? 1 : 2,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

// Native watch IDs from Capacitor are strings; the Web API uses numbers. Map
// an incrementing number -> the plugin's string id so callers keep using
// numeric ids exactly as before.
let watchSeq = 1;
const nativeWatchIds = new Map<number, string>();

const nativeGeolocation: GeolocationLike = {
  getCurrentPosition(success, error, options) {
    void (async () => {
      try {
        const geo = await loadCapGeo();
        if (geo.requestPermissions) {
          try {
            await geo.requestPermissions();
          } catch {
            // Permission request may reject on some platforms; let the actual
            // getCurrentPosition call surface the real error below.
          }
        }
        const pos = await geo.getCurrentPosition({
          enableHighAccuracy: options?.enableHighAccuracy,
          timeout: options?.timeout,
          maximumAge: options?.maximumAge,
        });
        success(toWebPosition(pos));
      } catch (e) {
        error?.(toWebError(e));
      }
    })();
  },

  watchPosition(success, error, options) {
    const numericId = watchSeq++;
    void (async () => {
      try {
        const geo = await loadCapGeo();
        if (geo.requestPermissions) {
          try {
            await geo.requestPermissions();
          } catch {
            /* surfaced via watch callback below if it fails */
          }
        }
        const id = await geo.watchPosition(
          {
            enableHighAccuracy: options?.enableHighAccuracy,
            timeout: options?.timeout,
            maximumAge: options?.maximumAge,
          },
          (position, err) => {
            if (err) {
              error?.(toWebError(err));
              return;
            }
            if (position) success(toWebPosition(position));
          },
        );
        // If clearWatch was called before the plugin resolved, honour it now.
        if (nativeWatchIds.has(numericId)) {
          nativeWatchIds.set(numericId, id);
        } else {
          // already cleared
          await geo.clearWatch({ id });
          return;
        }
      } catch (e) {
        error?.(toWebError(e));
      }
    })();
    // Reserve the slot synchronously so clearWatch can target it.
    nativeWatchIds.set(numericId, '');
    return numericId;
  },

  clearWatch(id) {
    const stringId = nativeWatchIds.get(id);
    nativeWatchIds.delete(id);
    if (stringId) {
      void loadCapGeo().then((geo) => geo.clearWatch({ id: stringId })).catch(() => {});
    }
  },
};

/**
 * Returns the geolocation provider for the current platform: the native
 * Capacitor plugin (adapted to the Web API) on Android/iOS, otherwise
 * `navigator.geolocation`. Returns `undefined` only when neither is available
 * (e.g. SSR, or a browser without geolocation) — callers should null-check,
 * exactly as they already do with `navigator.geolocation`.
 */
export function getGeolocation(): GeolocationLike | undefined {
  if (isNativePlatform()) return nativeGeolocation;
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return navigator.geolocation;
  }
  return undefined;
}
