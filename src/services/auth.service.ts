/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient from "@/lib/api-client";
import {
  persistAuthSessionPayload,
  applyProfileMeCommunity,
  type PickerContext,
} from "@/lib/communityContext";
import {
  User,
  RegisterPayload,
  CommunitySummary,
  ConsentType,
  UserConsentRecord,
  ApiResponse,
} from "@/types/api";

/** Throttle session keepalive pings (rolling expiry on server). */
let lastSessionTouchAt = 0;
const SESSION_TOUCH_MIN_MS = 4 * 60 * 1000;

type AuthSessionData = {
  user: User;
  token: string;
  community?: CommunitySummary | null;
  assignedCommunityId?: string | null;
  needsCommunitySelection?: boolean;
  needsGpsLocationVerification?: boolean;
  pickerContext?: PickerContext | null;
};

/**
 * Try a list of (method, path) combinations for updating the user's profile.
 *
 * Different versions of the backend expose this on different routes
 * (`PUT /profile/me`, `PATCH /profile/me`, `PUT /auth/profile`, etc).
 * We try them in order and return the first one that doesn't 404.
 */
async function tryProfileUpdate(data: Record<string, unknown>) {
  const candidates: Array<{ method: "put" | "patch"; path: string }> = [
    { method: "put",   path: "/profile/me" },
    { method: "patch", path: "/profile/me" },
    { method: "put",   path: "/profile" },
    { method: "patch", path: "/profile" },
    { method: "put",   path: "/auth/profile" },
    { method: "patch", path: "/auth/profile" },
    { method: "put",   path: "/users/me" },
    { method: "patch", path: "/users/me" },
  ];

  let lastError: unknown = null;
  for (const c of candidates) {
    try {
      const res =
        c.method === "put"
          ? await apiClient.put<User>(c.path, data)
          : await apiClient.patch<User>(c.path, data);
      return res;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } } | undefined)
        ?.response?.status;
      // Only swallow "not found" / "method not allowed" so we keep probing.
      // Any other error (auth, validation, server) should bubble up so the
      // caller sees the real problem instead of a misleading 404 string.
      if (status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  // None of the candidates were found
  throw lastError ?? new Error("No profile-update endpoint available on backend");
}

export const authService = {
  /**
   * Register a new user
   */
  async register(payload: RegisterPayload) {
    // ✅ Safeguard: Explicitly remove assignedCommunityId, communityId, and communityName
    // Backend handles community assignment automatically - these fields cause BSON casting errors
    const sanitizedPayload = { ...payload };
    delete (sanitizedPayload as any).assignedCommunityId;
    delete (sanitizedPayload as any).communityId;
    delete (sanitizedPayload as any).communityName;
    if (sanitizedPayload.location) {
      delete (sanitizedPayload.location as any).assignedCommunityId;
      delete (sanitizedPayload.location as any).communityId;
      delete (sanitizedPayload.location as any).communityName;
    }

    const response = await apiClient.post<AuthSessionData>(
      "/auth/create-account",
      sanitizedPayload,
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      if (typeof window !== "undefined") {
        persistAuthSessionPayload({
          user: response.data.user,
          community: response.data.community,
          assignedCommunityId: response.data.assignedCommunityId,
          needsCommunitySelection: response.data.needsCommunitySelection,
          needsGpsLocationVerification:
            response.data.needsGpsLocationVerification,
          pickerContext: response.data.pickerContext ?? null,
        });
      }
    }

    return response;
  },

  /**
   * Login user
   */
  async login(identifier: string, password: string) {
    const response = await apiClient.post<AuthSessionData>("/auth/login", {
      identifier,
      password,
    });

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      if (typeof window !== "undefined") {
        persistAuthSessionPayload({
          user: response.data.user,
          community: response.data.community,
          assignedCommunityId: response.data.assignedCommunityId,
          needsCommunitySelection: response.data.needsCommunitySelection,
          needsGpsLocationVerification:
            response.data.needsGpsLocationVerification,
          pickerContext: response.data.pickerContext ?? null,
        });
      }
    }

    return response;
  },

  /** Flow A: confirm ward/LGA-area after signup (Bearer token). */
  async confirmCommunity(body: {
    communityId: string;
    state: string;
    lga: string;
  }) {
    const response = await apiClient.post<{
      assignedCommunityId?: string | null;
      community?: CommunitySummary;
      needsCommunitySelection?: boolean;
      needsGpsLocationVerification?: boolean;
    }>("/auth/confirm-community", body);
    if (response.success && response.data && typeof window !== "undefined") {
      let existing: unknown;
      try {
        existing = JSON.parse(
          localStorage.getItem("neyborhuud_user") || "null",
        );
      } catch {
        existing = null;
      }
      persistAuthSessionPayload({
        user: existing && typeof existing === "object" ? existing : undefined,
        community: response.data.community,
        assignedCommunityId: response.data.assignedCommunityId,
        needsCommunitySelection: response.data.needsCommunitySelection ?? false,
        needsGpsLocationVerification:
          response.data.needsGpsLocationVerification ?? true,
        pickerContext: null,
      });
    }
    return response;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await apiClient.post("/auth/logout", { allDevices: false });
    } finally {
      apiClient.clearToken();
    }
  },

  /**
   * Get current authenticated user (full profile payload).
   */
  async getCurrentUser() {
    return await apiClient.get<User>("/profile/me");
  },

  /**
   * Light ping so Better Auth can roll session expiry while the app is open (social-style persistence).
   * Uses GET /profile/me — safe to call on an interval / visibility resume.
   */
  async touchSession(): Promise<boolean> {
    if (!apiClient.isAuthenticated()) return false;
    const now = Date.now();
    if (now - lastSessionTouchAt < SESSION_TOUCH_MIN_MS) return true;
    try {
      const res = await apiClient.get("/profile/me");
      if (res.success) {
        lastSessionTouchAt = Date.now();
        return true;
      }
    } catch {
      /* 401 etc. — caller / interceptor handles auth */
    }
    return false;
  },

  /**
   * Full GET /profile/me (user, community, username change policy).
   */
  async getMyProfileFull(): Promise<
    ApiResponse<{
      user: User & {
        usernameTimeline?: unknown;
        usernameChangeHistory?: unknown;
      };
      usernameChangePolicy?: {
        cooldownDays: number;
        canChangeUsername: boolean;
        nextUsernameChangeAt: string | null;
        lastUsernameRenameAt: string | null;
      };
      assignedCommunityId?: string | null;
      community?: CommunitySummary | null;
      needsCommunitySelection?: boolean;
      needsGpsLocationVerification?: boolean;
      pickerContext?: PickerContext | null;
    }>
  > {
    return await apiClient.get("/profile/me");
  },

  /** PATCH /profile/username — 429 when inside cooldown window. */
  async changeUsername(newUsername: string) {
    return await apiClient.patch<{
      username: string;
      usernameTimeline: unknown;
    }>("/profile/username", { newUsername });
  },

  /**
   * Sync assigned community from GET /profile/me (patches localStorage only).
   */
  async syncCommunityFromProfile(): Promise<void> {
    try {
      const response = await apiClient.get<{
        user?: unknown;
        community?: CommunitySummary;
        assignedCommunityId?: string | null;
        needsCommunitySelection?: boolean;
        needsGpsLocationVerification?: boolean;
        pickerContext?: PickerContext | null;
      }>("/profile/me");
      if (response.success && response.data && typeof window !== "undefined") {
        applyProfileMeCommunity({
          assignedCommunityId: response.data.assignedCommunityId,
          community: response.data.community,
          needsCommunitySelection: response.data.needsCommunitySelection,
          needsGpsLocationVerification:
            response.data.needsGpsLocationVerification,
          pickerContext: response.data.pickerContext ?? null,
        });
      }
    } catch {
      /* offline or old backend — ignore */
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>) {
    const response = await tryProfileUpdate(data);

    if (response.success && response.data) {
      // Update stored user data
      if (typeof window !== "undefined") {
        localStorage.setItem("neyborhuud_user", JSON.stringify(response.data));
      }
    }

    return response;
  },

  /**
   * Upload profile picture.
   *
   * Backend does not expose a dedicated /auth/profile/picture endpoint,
   * so we implement this in two steps:
   *   1. Upload the binary to the generic /media/upload endpoint (returns a URL).
   *   2. Update the user profile with avatarUrl + profilePicture pointing at that URL.
   */
  async uploadProfilePicture(
    file: File,
    onProgress?: (progress: number) => void,
  ) {
    // Step 1: upload binary to the generic media endpoint
    const uploadRes = await apiClient.uploadFiles<{ files: { url: string }[] }>(
      "/media/upload",
      [file],
      undefined,
      onProgress,
    );
    const uploadedUrl = uploadRes.data?.files?.[0]?.url;
    if (!uploadedUrl) {
      throw new Error("Upload succeeded but no URL was returned by the server");
    }

    // Step 2: write the URL onto the user profile
    const updateRes = await tryProfileUpdate({
      avatarUrl: uploadedUrl,
      profilePicture: uploadedUrl,
    });

    // Mirror updateProfile() behaviour so localStorage stays consistent
    if (updateRes.success && updateRes.data && typeof window !== "undefined") {
      localStorage.setItem("neyborhuud_user", JSON.stringify(updateRes.data));
    }

    return updateRes;
  },

  /**
   * Upload cover photo. Same two-step pattern as uploadProfilePicture.
   */
  async uploadCoverPhoto(file: File, onProgress?: (progress: number) => void) {
    const uploadRes = await apiClient.uploadFiles<{ files: { url: string }[] }>(
      "/media/upload",
      [file],
      undefined,
      onProgress,
    );
    const uploadedUrl = uploadRes.data?.files?.[0]?.url;
    if (!uploadedUrl) {
      throw new Error("Upload succeeded but no URL was returned by the server");
    }

    const updateRes = await tryProfileUpdate({
      coverPhoto: uploadedUrl,
      coverUrl: uploadedUrl,
    });

    if (updateRes.success && updateRes.data && typeof window !== "undefined") {
      localStorage.setItem("neyborhuud_user", JSON.stringify(updateRes.data));
    }

    return updateRes;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    return await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    return await apiClient.post("/auth/forgot-password", {
      email: normalized,
      identifier: normalized,
    });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    return await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    return await apiClient.post("/auth/verify-email", { token });
  },

  /**
   * Resend email verification
   */
  async resendVerificationEmail() {
    return await apiClient.post("/auth/resend-verification");
  },

  /**
   * Update user settings
   */
  async updateSettings(settings: any) {
    return await apiClient.put("/auth/settings", settings);
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: any) {
    return await apiClient.put("/auth/settings/notifications", settings);
  },

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: any) {
    return await apiClient.put("/auth/settings/privacy", settings);
  },

  /**
   * Update accessibility settings
   */
  async updateAccessibilitySettings(settings: any) {
    return await apiClient.put("/auth/settings/accessibility", settings);
  },

  /**
   * NDPR consent ledger — GET /auth/consents (Bearer).
   */
  async getConsents() {
    return await apiClient.get<{ consents: UserConsentRecord[] }>(
      "/auth/consents",
    );
  },

  /**
   * Update one consent flag — POST /auth/consents (Bearer).
   */
  async updateConsent(consentType: ConsentType, granted: boolean) {
    return await apiClient.post<{ consent: UserConsentRecord }>(
      "/auth/consents",
      { consentType, granted },
    );
  },

  /**
   * NDPR: audit of who accessed this user’s data — GET /auth/data-access-history (Bearer).
   */
  async getDataAccessHistory(page = 1, limit = 20) {
    return await apiClient.get<{
      accessHistory: {
        id: string;
        accessType: string;
        reason?: string;
        ipAddress?: string;
        createdAt: string;
        accessor: {
          id: string;
          firstName?: string;
          lastName?: string;
          role?: string;
        } | null;
      }[];
      pagination: { page: number; limit: number; total: number };
    }>(`/auth/data-access-history?page=${page}&limit=${limit}`);
  },

  /**
   * NDPR export — GET /auth/export-data (Bearer).
   */
  async exportUserData() {
    return await apiClient.get<{ export?: unknown }>("/auth/export-data");
  },

  /**
   * Delete account — DELETE /auth/delete-account (Bearer). Backend soft-deletes PII; optional reason in body.
   */
  async deleteAccount(reason?: string) {
    const res = await apiClient.delete("/auth/delete-account", {
      data: reason ? { reason } : {},
    });
    if (res.success !== false && typeof window !== "undefined") {
      apiClient.clearToken();
    }
    return res;
  },

  /**
   * Get user from local storage (offline)
   */
  getCachedUser(): User | null {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("neyborhuud_user");
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },
};
