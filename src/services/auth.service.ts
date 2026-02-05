/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient from "@/lib/api-client";
import { User, RegisterPayload } from "@/types/api";

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

    const response = await apiClient.post<{ user: User; token: string }>(
      "/auth/create-account",
      sanitizedPayload,
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      // Store user data
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "neyborhuud_user",
          JSON.stringify(response.data.user),
        );
      }
    }

    return response;
  },

  /**
   * Login user
   */
  async login(identifier: string, password: string) {
    const response = await apiClient.post<{ user: User; token: string }>(
      "/auth/login",
      {
        identifier,
        password,
      },
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      // Store user data
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "neyborhuud_user",
          JSON.stringify(response.data.user),
        );
      }
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
    return await apiClient.post("/auth/forgot-password", { email });
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
   * Delete account
   */
  async deleteAccount(password: string) {
    return await apiClient.post("/auth/delete-account", { password });
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
