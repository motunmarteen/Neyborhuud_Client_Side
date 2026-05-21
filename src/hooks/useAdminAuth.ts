/**
 * Admin route auth — always loads role from GET /profile/me (no localStorage placeholder).
 * Avoids redirect-to-feed race when cached user still has role: "user" after promotion.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { isAdminUser } from "@/lib/adminAccess";
import type { User } from "@/types/api";

function normalizeProfileUser(raw: Record<string, unknown>): User {
  return {
    ...(raw as unknown as User),
    id: String(raw.id ?? raw._id ?? ""),
    role: (raw.role as User["role"]) ?? "user",
    isAdmin: Boolean(raw.isAdmin),
  };
}

export function useAdminAuth() {
  const query = useQuery({
    queryKey: ["adminUser"],
    queryFn: async (): Promise<User | null> => {
      if (!apiClient.isAuthenticated()) return null;
      const res = await apiClient.get<{ user: Record<string, unknown> }>(
        "/profile/me",
      );
      if (!res.success || !res.data?.user) {
        throw new Error(res.message || "Could not load profile");
      }
      const user = normalizeProfileUser(res.data.user);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("neyborhuud_user");
        const existing = cached ? JSON.parse(cached) : {};
        localStorage.setItem(
          "neyborhuud_user",
          JSON.stringify({ ...existing, ...user }),
        );
      }
      return user;
    },
    enabled: apiClient.isAuthenticated(),
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const user = query.data ?? null;
  const hasAdminAccess = isAdminUser(user ?? undefined);

  return {
    user,
    hasAdminAccess,
    isChecking: query.isPending || query.isFetching,
    isAuthenticated: apiClient.isAuthenticated(),
    error: query.error,
  };
}
