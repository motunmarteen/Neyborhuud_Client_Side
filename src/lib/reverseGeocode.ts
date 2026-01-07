// src/lib/reverseGeocode.ts

export interface LocationAddress {
    neighborhood?: string;
    lga?: string;
    state?: string;
    country?: string;
    formatted?: string;
    source?: 'backend' | 'osm' | 'google';
}

/**
 * Reverse geocode coordinates to get location address
 * Uses fallback chain: Backend API -> OpenStreetMap -> Google Maps (if configured)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationAddress | null> {
    console.log('🗺️ Starting reverse geocoding for:', { lat, lng });

    // Try backend API first
    try {
        const backendResult = await reverseGeocodeBackend(lat, lng);
        if (backendResult) {
            console.log('✅ Backend geocoding successful:', backendResult);
            return backendResult;
        }
    } catch (error) {
        console.warn('⚠️ Backend geocoding failed, trying fallback...', error);
    }

    // Fallback to OpenStreetMap
    try {
        const osmResult = await reverseGeocodeOSM(lat, lng);
        if (osmResult) {
            console.log('✅ OpenStreetMap geocoding successful:', osmResult);
            return osmResult;
        }
    } catch (error) {
        console.error('❌ OpenStreetMap geocoding failed:', error);
    }

    // Could add Google Maps fallback here if API key is available
    // try {
    //     const googleResult = await reverseGeocodeGoogle(lat, lng);
    //     if (googleResult) return googleResult;
    // } catch (error) {
    //     console.error('Google Maps geocoding failed:', error);
    // }

    console.error('❌ All geocoding methods failed');
    return null;
}

/**
 * Try backend API for geocoding
 */
async function reverseGeocodeBackend(lat: number, lng: number): Promise<LocationAddress | null> {
    const { fetchAPI } = await import('./api');
    
    const response = await fetchAPI('/geo/preview', {
        method: 'POST',
        body: JSON.stringify({ lat, lng })
    });

    const data = response.data || response;

    if (data.state && data.lga) {
        return {
            lga: data.lga,
            state: data.state,
            neighborhood: data.neighborhood || data.area,
            country: data.country || 'Nigeria',
            formatted: data.neighborhood 
                ? `${data.neighborhood}, ${data.lga}, ${data.state}`
                : `${data.lga}, ${data.state}`,
            source: 'backend'
        };
    }

    return null;
}

/**
 * Use OpenStreetMap Nominatim for reverse geocoding
 * Free service, no API key required
 * Rate limit: 1 request/second
 */
async function reverseGeocodeOSM(lat: number, lng: number): Promise<LocationAddress | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'NeyborHuud-PWA/1.0' // Required by Nominatim
        }
    });

    if (!response.ok) {
        throw new Error(`OpenStreetMap API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.address) {
        return null;
    }

    const addr = data.address;

    // Extract Nigerian location structure
    const neighborhood = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || addr.residential;
    const lga = addr.county || addr.municipality || addr.local_government || addr.state_district;
    const state = addr.state;
    const country = addr.country;

    // Build formatted address
    const parts = [neighborhood, lga, state].filter(Boolean);
    const formatted = parts.join(', ');

    console.log('🗺️ OpenStreetMap address data:', {
        neighborhood,
        lga,
        state,
        country,
        formatted,
        raw: addr
    });

    return {
        neighborhood,
        lga,
        state,
        country,
        formatted,
        source: 'osm'
    };
}

/**
 * Optional: Google Maps Geocoding API
 * Requires API key in environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 */
async function reverseGeocodeGoogle(lat: number, lng: number): Promise<LocationAddress | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('Google Maps API key not configured');
        return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
    }

    // Parse Google Maps address components
    const result = data.results[0];
    const components = result.address_components;

    let neighborhood = '';
    let lga = '';
    let state = '';
    let country = '';

    for (const component of components) {
        const types = component.types;

        if (types.includes('sublocality') || types.includes('neighborhood')) {
            neighborhood = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
            lga = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
        } else if (types.includes('country')) {
            country = component.long_name;
        }
    }

    const parts = [neighborhood, lga, state].filter(Boolean);
    const formatted = parts.join(', ');

    return {
        neighborhood,
        lga,
        state,
        country,
        formatted,
        source: 'google'
    };
}
