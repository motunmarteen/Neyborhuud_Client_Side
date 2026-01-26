/**
 * Central API Utility for NeyborHuud
 * Handles environment-aware URL switching and robust error parsing.
 */

const PRODUCTION_API_URL = 'https://neyborhuud-serverside.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:5000/api/v1';

export const getApiUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined') return envUrl;
    return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiUrl();

export interface APIResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
}

/**
 * Recursively remove assignedCommunityId and communityId from any object
 * This prevents BSON casting errors on the backend
 */
function sanitizePayload(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(sanitizePayload);
    }
    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            // Skip communityId fields completely
            if (key === 'assignedCommunityId' || key === 'communityId') {
                continue;
            }
            sanitized[key] = sanitizePayload(obj[key]);
        }
        return sanitized;
    }
    return obj;
}

/**
 * Enhanced fetch wrapper for the NeyborHuud backend
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Auto-inject Authorization header if token exists
    if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('neyborhuud_access_token');
        if (accessToken) {
            (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        }
    }

    // ✅ CRITICAL: Sanitize request body to remove assignedCommunityId/communityId
    // This prevents BSON casting errors on registration requests
    let sanitizedBody = options.body;
    if (options.body && typeof options.body === 'string') {
        try {
            const parsed = JSON.parse(options.body);
            const sanitized = sanitizePayload(parsed);
            sanitizedBody = JSON.stringify(sanitized);
            
            // Debug: Log if we found and removed communityId fields
            if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
                console.warn('⚠️ Removed assignedCommunityId/communityId from request body');
                console.warn('⚠️ Original payload had:', {
                    hasAssignedCommunityId: 'assignedCommunityId' in parsed,
                    hasCommunityId: 'communityId' in parsed,
                    endpoint
                });
            }
            
            // For registration requests, log the sanitized payload for debugging
            if (endpoint.includes('/auth/register')) {
                console.log('🔍 Registration request payload (after sanitization):', JSON.stringify(sanitized, null, 2));
                if (sanitized.assignedCommunityId || sanitized.communityId) {
                    console.error('❌ CRITICAL ERROR: assignedCommunityId/communityId still present after sanitization!');
                }
            }
        } catch (e) {
            // If body is not JSON, leave it as is
        }
    }

    try {
        const response = await fetch(url, {
            ...options,
            body: sanitizedBody,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }

        if (!response.ok) {
            // Extract detailed error for backend debugging
            const errorMsg = data.message || data.error || `Server Error (${response.status})`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (error: any) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
}
