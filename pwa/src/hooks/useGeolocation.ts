/**
 * Geolocation Hook
 * Manages user's geolocation
 */

import { useEffect, useState } from "react";
import { geoService } from "@/services/geo.service";
import { LocationData } from "@/types/api";

interface GeolocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
}

// Module-level flag: once the reverse-geocode endpoint returns 404, stop
// calling it for the rest of the session to avoid console noise.
let reverseGeocodeUnavailable = false;

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
  });

  const getCurrentLocation = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await geoService.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Reverse geocode is best-effort. Skip entirely if we already learned
      // the endpoint is unavailable on this backend.
      let resolved: LocationData = {
        latitude,
        longitude,
        resolutionSource: "gps",
      };

      if (!reverseGeocodeUnavailable) {
        try {
          const response = await geoService.reverseGeocode(latitude, longitude);
          if (response?.data) {
            resolved = response.data;
          }
        } catch (geocodeError: any) {
          if (geocodeError?.response?.status === 404) {
            reverseGeocodeUnavailable = true;
            console.warn(
              "[useGeolocation] /geo/reverse-geocode is not implemented on the backend; using raw GPS coords for the rest of the session.",
            );
          } else {
            console.warn(
              "[useGeolocation] reverse geocode failed, using raw GPS coords",
              geocodeError,
            );
          }
        }
      }

      setState({
        location: resolved,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        location: null,
        isLoading: false,
        error: error.message || "Failed to get location",
      });
    }
  };

  return {
    ...state,
    getCurrentLocation,
  };
}

/**
 * Hook to watch location changes
 */
export function useWatchLocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    let watchId: number;

    const startWatching = () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      watchId = geoService.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({
            location: {
              latitude,
              longitude,
              resolutionSource: "gps",
            },
            isLoading: false,
            error: null,
          });
        },
        (error) => {
          setState({
            location: null,
            isLoading: false,
            error: error.message || "Failed to watch location",
          });
        },
      );
    };

    startWatching();

    return () => {
      if (watchId !== undefined) {
        geoService.clearWatch(watchId);
      }
    };
  }, []);

  return state;
}
