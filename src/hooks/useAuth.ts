/**
 * Authentication Hook
 * Manages user authentication state with React Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { RegisterPayload, User } from "@/types/api";
import { handleApiError } from "@/lib/error-handler";
import apiClient from "@/lib/api-client";

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response.data || null;
    },
    enabled: apiClient.isAuthenticated(),
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({
      identifier,
      password,
    }: {
      identifier: string;
      password: string;
    }) => authService.login(identifier, password),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(["currentUser"], data.data.user);
      }
    },
    onError: handleApiError,
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
        queryClient.setQueryData(["currentUser"], data.data);
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
        queryClient.setQueryData(["currentUser"], data.data);
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
    error,
    isAuthenticated: !!user,

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
