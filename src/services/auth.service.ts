/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient from "@/lib/api-client";
import {
  extractAccessToken,
  extractRefreshToken,
  applyAuthVerificationPayload,
  type AuthVerificationPayload,
} from "@/lib/authSession";
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
import { normalizeAuthUser } from "@/lib/userAvatar";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/apiErrors";

/** Throttle session keepalive pings (rolling expiry on server). */
let lastSessionTouchAt = 0;
const SESSION_TOUCH_MIN_MS = 4 * 60 * 1000;

type AuthSessionData = AuthVerificationPayload & {
  user: User;
};

type RegisterResponseData = AuthSessionData & {
  emailDelivery?: {
    sent?: boolean;
    message?: string;
    canResend?: boolean;
  };
};

function persistLoginSession(data: AuthSessionData): boolean {
  const token = extractAccessToken(data);
  if (!token) return false;

  apiClient.setToken(token);
  if (typeof window !== "undefined") {
    const refreshToken = extractRefreshToken(data);
    if (refreshToken) {
      localStorage.setItem("neyborhuud_refresh_token", refreshToken);
    }
    persistAuthSessionPayload({
      user: data.user,
      community: data.community,
      assignedCommunityId: data.assignedCommunityId,
      needsCommunitySelection: data.needsCommunitySelection,
      needsGpsLocationVerification: data.needsGpsLocationVerification,
      pickerContext: data.pickerContext ?? null,
    });
  }
  return true;
}

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

/** Merge a profile upload response into the cached auth user. */
function persistProfileUploadUser(userFragment?: Partial<User> | null): User | null {
  if (typeof window === "undefined" || !userFragment) return null;

  let current: User | null = null;
  const stored = localStorage.getItem("neyborhuud_user");
  if (stored) {
    try {
      current = JSON.parse(stored) as User;
    } catch {
      current = null;
    }
  }

  const merged = normalizeAuthUser({ ...current, ...userFragment } as User);
  localStorage.setItem("neyborhuud_user", JSON.stringify(merged));
  return merged;
}

type CompleteProfileInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string;
  dob?: string;
};

/** Backend expects camelCase on /auth/complete-profile (see auth.validation.ts). */
function buildCompleteProfilePayload(data: CompleteProfileInput) {
  const payload: Record<string, string> = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
  };
  const phone = data.phone?.trim();
  if (phone) payload.phoneNumber = phone;
  if (data.gender) payload.gender = data.gender;
  if (data.dob) payload.dateOfBirth = data.dob;
  return payload;
}

/** Fallback when profile was already rewarded or /auth/complete-profile is slow. */
function buildIdentityProfilePayload(data: CompleteProfileInput) {
  const payload: Record<string, string> = {
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
  };
  if (data.gender) payload.gender = data.gender;
  if (data.dob) payload.date_of_birth = data.dob;
  return payload;
}

async function syncCachedUserFromProfileMe(): Promise<User | null> {
  try {
    const res = await apiClient.get<{ user: User }>("/profile/me");
    if (res.success && res.data?.user) {
      return persistProfileUploadUser(res.data.user);
    }
  } catch {
    /* offline */
  }
  return null;
}

async function completeProfileViaIdentity(data: CompleteProfileInput): Promise<ApiResponse<User>> {
  const basePayload = buildIdentityProfilePayload(data);
  const phone = data.phone?.trim();

  try {
    let response = await apiClient.patch<{ user: User }>(
      "/identity/profile",
      phone ? { ...basePayload, phone_number: phone } : basePayload,
    );

    if (
      !response.success &&
      phone &&
      (response.message || "").toLowerCase().includes("password")
    ) {
      response = await apiClient.patch<{ user: User }>("/identity/profile", basePayload);
    }

    if (!response.success) {
      return { success: false, message: response.message || "Profile update failed." };
    }

    const user = response.data?.user
      ? persistProfileUploadUser(normalizeAuthUser(response.data.user))
      : await syncCachedUserFromProfileMe();

    return {
      success: true,
      message: response.message || "Profile updated successfully",
      data: user ?? undefined,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Profile update failed."),
    };
  }
}

/** Reward endpoint can hang on auth sync — keep this short and fall back quickly. */
const COMPLETE_PROFILE_TIMEOUT_MS = 12_000;

async function tryCompleteProfileReward(
  data: CompleteProfileInput,
): Promise<"success" | "already_completed" | "failed"> {
  try {
    const response = await apiClient.post(
      "/auth/complete-profile",
      buildCompleteProfilePayload(data),
      { timeout: COMPLETE_PROFILE_TIMEOUT_MS },
    );

    if (response.success) return "success";

    const msg = (response.message || "").toLowerCase();
    if (msg.includes("already completed")) return "already_completed";
    return "failed";
  } catch (error: unknown) {
    const status = getApiErrorStatus(error);
    const msg = getApiErrorMessage(error).toLowerCase();

    if (status === 401 || status === 403) throw error;
    if (status === 400 && msg.includes("already completed")) return "already_completed";
    return "failed";
  }
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

    const response = await apiClient.post<RegisterResponseData>(
      "/auth/create-account",
      sanitizedPayload,
    );

    if (response.success && response.data) {
      persistLoginSession(response.data);
    }

    return response;
  },

  /**
   * Login user
   */
  async login(
    identifier: string,
    password: string,
    options?: { deviceLocation?: { lat?: number; lng?: number } },
  ) {
    const response = await apiClient.post<AuthSessionData>("/auth/login", {
      identifier,
      password,
      ...(options?.deviceLocation && {
        deviceLocation: options.deviceLocation,
      }),
    });

    if (response.success && response.data) {
      const stored = persistLoginSession(response.data);
      if (!stored) {
        return {
          ...response,
          success: false,
          message: "Login succeeded but no session token was returned.",
        };
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
   * Upload profile picture via POST /profile/avatar (multipart field: avatar).
   */
  async uploadProfilePicture(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<User>> {
    const uploadRes = await apiClient.uploadFile<{
      avatarUrl?: string;
      user?: User;
    }>("/profile/avatar", file, undefined, onProgress, "avatar");

    if (!uploadRes.success) {
      throw new Error(uploadRes.message || "Profile picture upload failed");
    }

    const avatarUrl =
      uploadRes.data?.avatarUrl ?? uploadRes.data?.user?.avatarUrl ?? undefined;
    if (!avatarUrl) {
      throw new Error("Upload succeeded but no avatar URL was returned by the server");
    }

    const merged = persistProfileUploadUser({
      ...uploadRes.data?.user,
      avatarUrl,
      profilePicture: avatarUrl,
    });

    return {
      success: uploadRes.success,
      message: uploadRes.message,
      data: merged ?? normalizeAuthUser({ avatarUrl, profilePicture: avatarUrl } as User),
    };
  },

  /**
   * Upload cover photo via POST /profile/cover (multipart field: cover).
   */
  async uploadCoverPhoto(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<User>> {
    const uploadRes = await apiClient.uploadFile<{
      coverPhoto?: string;
      user?: User;
    }>("/profile/cover", file, undefined, onProgress, "cover");

    if (!uploadRes.success) {
      throw new Error(uploadRes.message || "Cover photo upload failed");
    }

    const coverPhoto =
      uploadRes.data?.coverPhoto ?? uploadRes.data?.user?.coverPhoto ?? undefined;
    if (!coverPhoto) {
      throw new Error("Upload succeeded but no cover photo URL was returned by the server");
    }

    const merged = persistProfileUploadUser({
      ...uploadRes.data?.user,
      coverPhoto,
    });

    return {
      success: uploadRes.success,
      message: uploadRes.message,
      data: merged ?? normalizeAuthUser({ coverPhoto } as User),
    };
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
   * Verify email with link token
   */
  async verifyEmailWithToken(token: string) {
    const response = await apiClient.post<AuthVerificationPayload>(
      "/auth/verify-email",
      { token },
    );
    if (response.success && response.data) {
      applyAuthVerificationPayload(response.data);
    }
    return response;
  },

  /**
   * Verify email with 6-digit OTP code
   */
  async verifyEmailWithCode(email: string, code: string) {
    const response = await apiClient.post<AuthVerificationPayload>(
      "/auth/verify-email",
      {
        email: email.trim().toLowerCase(),
        code,
      },
    );
    if (response.success && response.data) {
      applyAuthVerificationPayload(response.data);
    }
    return response;
  },

  /** @deprecated Use verifyEmailWithToken */
  async verifyEmail(token: string) {
    return this.verifyEmailWithToken(token);
  },

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email?: string) {
    if (email && email.trim()) {
      return await apiClient.post("/auth/resend-verification", {
        email: email.trim().toLowerCase(),
      });
    }
    return await apiClient.post("/auth/resend-verification");
  },

  /**
   * Complete optional profile enrichment after signup.
   * Uses PATCH /identity/profile for updates; only calls /auth/complete-profile
   * for first-time HuudCoin reward (skipped when name is already saved).
   */
  async completeProfile(data: CompleteProfileInput): Promise<ApiResponse<User>> {
    const persistLocal = () => {
      persistProfileUploadUser({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phone?.trim() || undefined,
        gender: (data.gender as User["gender"]) || undefined,
        dateOfBirth: data.dob || undefined,
      });
    };

    const cached = this.getCachedUser();
    const hasExistingName = !!(
      cached?.firstName?.trim() &&
      cached?.lastName?.trim()
    );

    if (!hasExistingName) {
      const rewardResult = await tryCompleteProfileReward(data);
      if (rewardResult === "success") {
        persistLocal();
        const synced = await syncCachedUserFromProfileMe();
        return {
          success: true,
          message: "Profile completed successfully! 100 HuudCoins awarded.",
          data: synced ?? undefined,
        };
      }
    }

    const fallback = await completeProfileViaIdentity(data);
    if (fallback.success) {
      return fallback;
    }

    const synced = await syncCachedUserFromProfileMe();
    if (synced?.firstName?.trim() && synced?.lastName?.trim()) {
      return {
        success: true,
        message: "Profile saved.",
        data: synced,
      };
    }

    return fallback;
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
