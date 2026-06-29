/**
 * Better Auth Client
 * https://www.better-auth.com/docs/installation#client-setup
 *
 * This is the Better Auth SDK *client* — distinct from src/lib/auth.ts which is
 * the custom token-storage utility. This file powers social sign-in (Google, Apple)
 * via the Better Auth client SDK talking to our backend at /api/auth/*.
 */
import { createAuthClient } from "better-auth/react";

/**
 * Resolve the backend base URL (without the /api/v1 suffix).
 * The Better Auth handler is mounted at <BACKEND>/api/auth/* on the server.
 *
 * Environment variables:
 *  - NEXT_PUBLIC_BETTER_AUTH_URL  — explicit backend root (preferred)
 *  - NEXT_PUBLIC_API_URL          — fallback; strip the trailing /api/v1
 */
function resolveBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  // Strip /api/v1 (and any trailing slash) to get the root backend URL
  return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

export const authClient = createAuthClient({
  baseURL: resolveBackendUrl(),
});

export type { Session } from "better-auth/types";
