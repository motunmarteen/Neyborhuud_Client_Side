/**
 * React Query Client Configuration
 */

import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { isLocalApiHost } from "@/lib/api-client";

function isOfflineNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError && !error.response) return true;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes("network error") || msg.includes("failed to fetch");
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
      retry: (failureCount, error: unknown) => {
        // Don't hammer a dead local backend during frontend-only dev.
        if (process.env.NODE_ENV === "development" && isLocalApiHost() && isOfflineNetworkError(error)) {
          return false;
        }
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});
