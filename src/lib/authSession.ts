/**
 * Shared auth session helpers — token extraction, validation, and post-login routing.
 */

import apiClient from '@/lib/api-client';
import {
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
  persistAuthSessionPayload,
  type PickerContext,
} from '@/lib/communityContext';
import { getPostSetupRoute } from '@/lib/onboarding';

type SessionLike = {
  token?: string;
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  session?: {
    access_token?: string;
    accessToken?: string;
    refresh_token?: string;
    refreshToken?: string;
  };
};

/** Extract bearer token from heterogeneous backend login/verify payloads. */
export function extractAccessToken(payload: SessionLike | null | undefined): string | null {
  if (!payload) return null;
  const sessionToken =
    typeof payload.session === 'object' && payload.session
      ? payload.session.access_token ?? payload.session.accessToken
      : undefined;
  return payload.token ?? payload.access_token ?? payload.accessToken ?? sessionToken ?? null;
}

export function extractRefreshToken(payload: SessionLike | null | undefined): string | null {
  if (!payload) return null;
  const sessionRefresh =
    typeof payload.session === 'object' && payload.session
      ? payload.session.refresh_token ?? payload.session.refreshToken
      : undefined;
  return payload.refresh_token ?? payload.refreshToken ?? sessionRefresh ?? null;
}

/** Payload returned by verify-email and create-account endpoints. */
export type AuthVerificationPayload = SessionLike & {
  user?: unknown;
  community?: unknown;
  assignedCommunityId?: string | null;
  needsCommunitySelection?: boolean;
  needsGpsLocationVerification?: boolean;
  pickerContext?: PickerContext | null;
};

/**
 * Persist tokens + community gates from a verify/register response.
 * Returns true when a bearer token is available afterward.
 */
export function applyAuthVerificationPayload(
  payload: AuthVerificationPayload | null | undefined,
): boolean {
  if (!payload) return apiClient.isAuthenticated();

  const token = extractAccessToken(payload);
  if (token) {
    apiClient.setToken(token);
  }

  if (typeof window !== 'undefined') {
    const refreshToken = extractRefreshToken(payload);
    if (refreshToken) {
      localStorage.setItem('neyborhuud_refresh_token', refreshToken);
    }
  }

  persistAuthSessionPayload({
    user: payload.user,
    community: payload.community,
    assignedCommunityId: payload.assignedCommunityId,
    needsCommunitySelection: payload.needsCommunitySelection,
    needsGpsLocationVerification: payload.needsGpsLocationVerification,
    pickerContext: payload.pickerContext ?? null,
  });

  return apiClient.isAuthenticated();
}

/** Whether the auth user record reflects a verified email. */
export function isUserEmailVerified(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  return (
    u.emailVerified === true ||
    u.email_verified === true ||
    u.isVerified === true ||
    u.verificationStatus === 'verified' ||
    u.identityVerified === true
  );
}

/** Strict 6-digit OTP — rejects partial input, spaces, or autofill junk. */
export function isValidEmailVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/**
 * Resolve post-verify navigation (signup inline verify uses gates before success screen).
 */
export function resolvePostVerifyRoute(): string | null {
  if (getNeedsCommunitySelection()) return '/pick-community';
  if (getNeedsGpsLocationVerification()) return '/verify-location';
  return null;
}

/**
 * Allow only same-origin relative paths (blocks open redirects).
 */
export function parseSafeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== 'string') return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes(':')) return null;
  if (trimmed.includes('\\')) return null;
  return trimmed;
}

/**
 * Resolve where to send the user after a successful login or session restore.
 * Setup gates take precedence over ?next=.
 */
export function resolvePostAuthRoute(next?: string | null): string {
  if (getNeedsCommunitySelection()) return '/pick-community';
  if (getNeedsGpsLocationVerification()) return '/verify-location';
  const safeNext = parseSafeNextPath(next);
  if (safeNext) return safeNext;
  return getPostSetupRoute();
}

export type SessionValidation = 'valid' | 'invalid' | 'unknown';

/**
 * Validate a stored access token against the backend.
 * Returns `unknown` on network errors so callers can avoid false logouts.
 */
export async function validateStoredSession(): Promise<SessionValidation> {
  if (!apiClient.isAuthenticated()) return 'invalid';
  try {
    const res = await apiClient.get('/profile/me');
    if (res.success) return 'valid';
    apiClient.clearToken();
    return 'invalid';
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
    if (status === 401 || status === 403) {
      apiClient.clearToken();
      return 'invalid';
    }
    return 'unknown';
  }
}
