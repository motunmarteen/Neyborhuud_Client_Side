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
import { User, RegisterPayload, CommunitySummary } from "@/types/api";

type AuthSessionData = {
  user: User;
  token: string;
  community?: CommunitySummary | null;
  assignedCommunityId?: string | null;
  needsCommunitySelection?: boolean;
  needsGpsLocationVerification?: boolean;
  pickerContext?: PickerContext | null;
};

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
   * Get current authenticated user
   */
  async getCurrentUser() {
    return await apiClient.get<User>("/auth/me");
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
    const response = await apiClient.put<User>("/auth/profile", data);

    if (response.success && response.data) {
      // Update stored user data
      if (typeof window !== "undefined") {
        localStorage.setItem("neyborhuud_user", JSON.stringify(response.data));
      }
    }

    return response;
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    file: File,
    onProgress?: (progress: number) => void,
  ) {
    return await apiClient.uploadFile<User>(
      "/auth/profile/picture",
      file,
      {},
      onProgress,
    );
  },

  /**
   * Upload cover photo
   */
  async uploadCoverPhoto(file: File, onProgress?: (progress: number) => void) {
    return await apiClient.uploadFile<User>(
      "/auth/profile/cover",
      file,
      {},
      onProgress,
    );
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
