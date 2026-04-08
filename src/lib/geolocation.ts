// src/lib/geolocation.ts
export interface LocationCoords {
    lat: number;
    lng: number;
    accuracy?: number;
}

/**
 * Get user's current GPS location
 * Prompts browser for location permission
 * Tries multiple times to get better accuracy
 */
export const getCurrentLocation = (): Promise<LocationCoords | null> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            resolve(null);
            return;
        }

        let bestLocation: LocationCoords | null = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryGetLocation = () => {
            attempts++;
            console.log(`📍 Getting location (attempt ${attempts}/${maxAttempts})...`);
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    console.log(`📍 Location received: accuracy ${coords.accuracy}m`);
                    
                    // Keep the most accurate result
                    if (!bestLocation || coords.accuracy < (bestLocation.accuracy || Infinity)) {
                        bestLocation = coords;
                    }
                    
                    // If accuracy is good enough (< 100m) or we've tried enough times, return
                    if (coords.accuracy < 100 || attempts >= maxAttempts) {
                        if (coords.accuracy > 1000) {
                            console.warn(`⚠️ Location accuracy is poor: ${coords.accuracy}m. This may affect address resolution.`);
                        }
                        resolve(bestLocation);
                    } else {
                        // Try again for better accuracy
                        setTimeout(tryGetLocation, 500);
                    }
                },
                (error) => {
                    console.warn('Location permission denied or unavailable:', error);
                    // If we have any location, use it; otherwise return null
                    resolve(bestLocation);
                },
                {
                    enableHighAccuracy: true, // Use GPS, not just WiFi
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        };
        
        tryGetLocation();
    });
};
