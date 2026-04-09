/**
 * Session Monitor Hook
 * Monitors session expiry and handles auto-logout with proactive token refresh
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { authStorage } from "@/lib/auth";
import apiClient from "@/lib/api-client";

interface UseSessionMonitorOptions {
  /** Redirect path when session expires */
  redirectTo?: string;
  /** Callback when session expires */
  onSessionExpired?: () => void;
  /** Callback when session is refreshed */
  onSessionRefreshed?: () => void;
  /** Check interval in milliseconds (default: 300000 = 5 minutes) */
  checkInterval?: number;
  /** Whether to enable the monitor (default: true) */
  enabled?: boolean;
  /** Whether to enable proactive refresh (default: true) */
  enableProactiveRefresh?: boolean;
}

/**
 * Hook that monitors session expiry and handles auto-logout
 *
 * Features:
 * - Periodic session expiry checks
 * - Proactive token refresh when < 2 hours remaining
 * - Visibility change detection (checks when user returns to tab)
 * - Automatic logout and redirect on session expiry
 */
export function useSessionMonitor(options: UseSessionMonitorOptions = {}) {
  const {
    redirectTo = "/login?expired=true",
    onSessionExpired,
    onSessionRefreshed,
    checkInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    enableProactiveRefresh = true,
  } = options;

  const router = useRouter();
  const isAuthenticated = apiClient.isAuthenticated();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshAttempt = useRef<number>(0);

  const handleSessionExpired = useCallback(() => {
    // Clear auth data
    authStorage.clearAuthData();
    apiClient.clearToken();

    // Call callback if provided
    onSessionExpired?.();

    // Redirect to login
    router.push(redirectTo);
  }, [router, redirectTo, onSessionExpired]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 60000) {
      // Don't retry within 1 minute
      return false;
    }
    lastRefreshAttempt.current = now;

    setIsRefreshing(true);
    try {
      const success = await authService.touchSession();
      if (success) {
        console.log("✅ Proactive session refresh successful");
        onSessionRefreshed?.();
      }
      return success;
    } catch (error) {
      console.error("Proactive session refresh failed:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [onSessionRefreshed]);

  const checkSession = useCallback(async () => {
    if (!isAuthenticated) return;

    // Check if session is expired
    if (authStorage.isSessionExpired()) {
      console.log("⚠️ Session expired, logging out...");
      handleSessionExpired();
      return;
    }

    // Proactive refresh if enabled and token needs refresh
    if (enableProactiveRefresh && authStorage.shouldRefreshToken()) {
      const hoursRemaining = authStorage.getHoursUntilExpiry();
      console.log(
        `🔄 Token expiring soon (${hoursRemaining.toFixed(1)} hours remaining), attempting refresh...`,
      );
      await refreshSession();
    }
  }, [
    isAuthenticated,
    handleSessionExpired,
    enableProactiveRefresh,
    refreshSession,
  ]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Check immediately
    checkSession();

    // Set up periodic check
    const interval = setInterval(checkSession, checkInterval);

    // Also check on visibility change (user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, isAuthenticated, checkSession, checkInterval]);

  return {
    isSessionExpired: authStorage.isSessionExpired(),
    timeUntilExpiry: authStorage.getTimeUntilExpiry(),
    hoursUntilExpiry: authStorage.getHoursUntilExpiry(),
    shouldRefresh: authStorage.shouldRefreshToken(),
    session: authStorage.getStoredSession(),
    isRefreshing,
    refreshSession,
  };
}

/**
 * Format time until expiry as a human-readable string
 */
export function formatTimeUntilExpiry(ms: number): string {
  if (ms <= 0) return "Expired";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}
