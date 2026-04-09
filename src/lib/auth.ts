/**
 * Authentication Utility for NeyborHuud
 * Handles token storage, retrieval, and validation with Remember Me support
 */

const TOKEN_KEY = "neyborhuud_access_token";
const REFRESH_TOKEN_KEY = "neyborhuud_refresh_token";
const USER_KEY = "neyborhuud_user";
const SESSION_KEY = "neyborhuud_session";

export interface SessionData {
  expiresIn: number;
  expiresAt: string;
  rememberMe: boolean;
}

export const authStorage = {
  /**
   * Store authentication data based on rememberMe preference
   * - rememberMe=true: uses localStorage (persists across browser sessions)
   * - rememberMe=false: uses sessionStorage (cleared when tab closes)
   */
  storeAuthData(
    token: string,
    session: SessionData,
    refreshToken?: string,
    user?: any,
  ) {
    if (typeof window === "undefined") return;

    const storage = session.rememberMe ? localStorage : sessionStorage;
    const otherStorage = session.rememberMe ? sessionStorage : localStorage;

    // Store in the appropriate storage
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }

    // Clear from the other storage to avoid conflicts
    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(SESSION_KEY);
    otherStorage.removeItem(REFRESH_TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);
  },

  /**
   * Get the stored access token (checks both storages)
   */
  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get the stored session data
   */
  getStoredSession(): SessionData | null {
    if (typeof window === "undefined") return null;
    const data =
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Get the stored user data
   */
  getStoredUser(): any | null {
    if (typeof window === "undefined") return null;
    const data =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Get the stored refresh token
   */
  getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },

  /**
   * Clear all auth data from both storages
   */
  clearAuthData() {
    if (typeof window === "undefined") return;
    // Clear from both storages
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  /**
   * Check if the current session is expired
   */
  isSessionExpired(): boolean {
    const session = this.getStoredSession();
    if (!session) return true;

    const expiresAt = new Date(session.expiresAt);
    const now = new Date();

    // Consider expired 5 minutes before actual expiry (buffer for API calls)
    const bufferMs = 5 * 60 * 1000;
    return now.getTime() >= expiresAt.getTime() - bufferMs;
  },

  /**
   * Check if token should be proactively refreshed
   * Returns true if less than 2 hours remaining but not yet expired
   */
  shouldRefreshToken(): boolean {
    const session = this.getStoredSession();
    if (!session) return false;

    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const hoursRemaining =
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Refresh if less than 2 hours remaining but still valid
    return hoursRemaining < 2 && hoursRemaining > 0;
  },

  /**
   * Get hours remaining until session expiry
   */
  getHoursUntilExpiry(): number {
    const session = this.getStoredSession();
    if (!session) return 0;

    const expiresAt = new Date(session.expiresAt);
    return Math.max(0, (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
  },

  /**
   * Get time until session expiry in milliseconds
   */
  getTimeUntilExpiry(): number {
    const session = this.getStoredSession();
    if (!session) return 0;

    const expiresAt = new Date(session.expiresAt);
    return Math.max(0, expiresAt.getTime() - Date.now());
  },

  /**
   * Update session expiry (used after token refresh)
   */
  updateSessionExpiry(expiresAt: string, expiresIn?: number) {
    if (typeof window === "undefined") return;

    const session = this.getStoredSession();
    if (!session) return;

    const updatedSession: SessionData = {
      ...session,
      expiresAt,
      expiresIn: expiresIn ?? session.expiresIn,
    };

    const storage = session.rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
  },

  /**
   * Update stored user data (preserves storage location)
   */
  updateUser(user: any) {
    if (typeof window === "undefined") return;
    const session = this.getStoredSession();
    const storage = session?.rememberMe ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  },
};

// Legacy authService for backward compatibility
export const authService = {
  /**
   * Store authentication tokens after login/signup
   * @deprecated Use authStorage.storeAuthData instead for Remember Me support
   */
  setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return authStorage.getStoredToken();
  },

  /**
   * Get the refresh token
   */
  getRefreshToken(): string | null {
    return authStorage.getStoredRefreshToken();
  },

  /**
   * Store user data
   * @deprecated Use authStorage.storeAuthData instead
   */
  setUser(user: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Get stored user data
   */
  getUser(): any | null {
    return authStorage.getStoredUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Clear all auth data (logout)
   */
  clearAuth() {
    authStorage.clearAuthData();
  },
};
