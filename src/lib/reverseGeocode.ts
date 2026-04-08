// src/lib/reverseGeocode.ts

export interface LocationAddress {
    neighborhood?: string;
    lga?: string;
    state?: string;
    country?: string;
    formatted?: string;
    source?: 'backend' | 'osm' | 'google';
    /** Backend /geo/preview: google | mapbox | openstreetmap | centroid */
    resolutionSource?: string;
    geocoderDisagreement?: boolean;
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
    
    // Debug: log what we got from the backend
    console.log('🗺️ Backend /geo/preview response:', {
        formattedAddress: data.formattedAddress,
        neighborhood: data.neighborhood,
        area: data.area,
        communityName: data.communityName,
        lga: data.lga,
        state: data.state
    });

    // ✅ CRITICAL: Log if backend is still returning communityId (should not happen)
    if (data.communityId || data.assignedCommunityId) {
        console.warn('⚠️ WARNING: /geo/preview response contains communityId/assignedCommunityId:', {
            communityId: data.communityId,
            assignedCommunityId: data.assignedCommunityId
        });
        console.warn('⚠️ These fields will be IGNORED - backend should not return them');
    }

    // ✅ Only extract allowed fields: state, lga, ward, communityName
    // ❌ Explicitly ignore communityId - backend no longer returns it
    if (data.state && data.lga) {
        // Check for Plus Codes (e.g., "C9WR+X4") and filter them out
        const plusCodePattern = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3},?\s*/i;
        let formattedFromApi =
            typeof data.formattedAddress === 'string' && data.formattedAddress.trim()
                ? data.formattedAddress.trim()
                : null;
        
        // Remove Plus Code from formatted address if present
        if (formattedFromApi && plusCodePattern.test(formattedFromApi)) {
            formattedFromApi = formattedFromApi.replace(plusCodePattern, '').trim();
            // Remove leading comma if any
            formattedFromApi = formattedFromApi.replace(/^,\s*/, '').trim();
        }
        
        // Check if formattedAddress is too generic (e.g., "Lagos, Lagos" or just state/country)
        // In these cases, prefer constructing from communityName/lga/state
        const isGenericAddress = !formattedFromApi || 
            formattedFromApi === data.country || 
            formattedFromApi === 'Nigeria' ||
            formattedFromApi === data.state ||
            formattedFromApi === `${data.state}, ${data.country}` ||
            formattedFromApi === `${data.state}, Nigeria` ||
            formattedFromApi === `${data.lga}, ${data.state}` ||
            // Also detect "City, City" or "State, State" patterns
            /^(\w+),\s*\1$/i.test(formattedFromApi);
        
        // Build a rich formatted address from components if we have good data
        let formatted: string;
        if (!isGenericAddress && formattedFromApi) {
            formatted = formattedFromApi;
        } else if (data.communityName || data.neighborhood) {
            // Use communityName for more specific location
            formatted = `${data.communityName || data.neighborhood}, ${data.lga}, ${data.state}`;
        } else {
            formatted = `${data.lga}, ${data.state}`;
        }

        const result = {
            lga: data.lga,
            state: data.state,
            neighborhood: data.neighborhood || data.area || data.communityName,
            country: data.country || 'Nigeria',
            formatted,
            source: 'backend' as const,
            resolutionSource:
                typeof data.resolutionSource === 'string'
                    ? data.resolutionSource
                    : undefined,
            geocoderDisagreement:
                typeof data.geocoderDisagreement === 'boolean'
                    ? data.geocoderDisagreement
                    : undefined,
            // ❌ DO NOT include communityId or assignedCommunityId
        };
        
        // Double-check: Ensure no communityId fields leaked in
        if ((result as any).communityId || (result as any).assignedCommunityId) {
            console.error('❌ ERROR: communityId leaked into LocationAddress result!');
            delete (result as any).communityId;
            delete (result as any).assignedCommunityId;
        }
        
        return result;
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
