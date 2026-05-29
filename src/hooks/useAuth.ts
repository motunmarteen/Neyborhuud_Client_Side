/**
 * Authentication Hook
 * Manages user authentication state with React Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { RegisterPayload, User } from "@/types/api";
import { handleApiError } from "@/lib/error-handler";
import apiClient from "@/lib/api-client";
import { normalizeAuthUser } from "@/lib/userAvatar";

export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch fresh user from GET /profile/me — ensures role/isAdmin is always current.
  // Falls back to localStorage cache if the server is unreachable.
  const {
    data: user,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!apiClient.isAuthenticated()) return null;
      try {
        const res = await apiClient.get<{ user: import("@/types/api").User }>("/profile/me");
        if (res.success && res.data?.user) {
          const freshUser = normalizeAuthUser(res.data.user);
          // Persist fresh data (including role) back to localStorage
          if (typeof window !== "undefined") {
            const cached = localStorage.getItem("neyborhuud_user");
            const existing = cached ? JSON.parse(cached) : {};
            localStorage.setItem(
              "neyborhuud_user",
              JSON.stringify({ ...existing, ...freshUser }),
            );
          }
          return freshUser;
        }
      } catch {
        /* offline or network error — fall back to cache */
      }
      await authService.syncCommunityFromProfile();
      return authService.getCachedUser();
    },
    enabled: apiClient.isAuthenticated(),
    retry: false,
    staleTime: 60_000,
    refetchOnMount: "always",
    /** Instant id for gated UI — admin routes must wait for isFetching (see admin/layout). */
    placeholderData: () => {
      const cached = apiClient.isAuthenticated() ? authService.getCachedUser() : null;
      return cached ? normalizeAuthUser(cached) : undefined;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({
      identifier,
      password,
      deviceLocation,
    }: {
      identifier: string;
      password: string;
      deviceLocation?: { lat?: number; lng?: number };
    }) => authService.login(identifier, password, { deviceLocation }),
    onSuccess: async () => {
      // Always refetch /profile/me so role/isAdmin from MongoDB is current (login payload may omit them).
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(["currentUser"], data.data.user);
      }
    },
    onError: handleApiError,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
    onError: handleApiError,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(["currentUser"], normalizeAuthUser(data.data));
      }
    },
    onError: handleApiError,
  });

  // Upload profile picture
  const uploadProfilePictureMutation = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => authService.uploadProfilePicture(file, onProgress),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(["currentUser"], normalizeAuthUser(data.data));
      }
    },
    onError: handleApiError,
  });

  // Upload cover photo
  const uploadCoverPhotoMutation = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => authService.uploadCoverPhoto(file, onProgress),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(["currentUser"], data.data);
      }
    },
    onError: handleApiError,
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
    onError: handleApiError,
  });

  return {
    // State
    user,
    isLoading,
    isFetching,
    error,
    isAuthenticated: apiClient.isAuthenticated(),

    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    uploadProfilePicture: uploadProfilePictureMutation.mutateAsync,
    uploadCoverPhoto: uploadCoverPhotoMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}

/**
 * Hook for password reset flow
 */
export function usePasswordReset() {
  const requestResetMutation = useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onError: handleApiError,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => authService.resetPassword(token, newPassword),
    onError: handleApiError,
  });

  return {
    requestReset: requestResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isRequestingReset: requestResetMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}

/**
 * Hook for email verification
 */
export function useEmailVerification() {
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onError: handleApiError,
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () => authService.resendVerificationEmail(),
    onError: handleApiError,
  });

  return {
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    isVerifying: verifyEmailMutation.isPending,
    isResending: resendVerificationMutation.isPending,
  };
}
