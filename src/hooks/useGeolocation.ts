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

      // Reverse geocode to get location details
      const response = await geoService.reverseGeocode(latitude, longitude);

      setState({
        location: response.data || {
          latitude,
          longitude,
          resolutionSource: "gps",
        },
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
