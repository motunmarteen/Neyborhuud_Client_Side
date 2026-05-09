/**
 * Application-wide constants
 *
 * Centralises all magic strings and configuration values so they
 * can be found, updated, and audited in one place.
 */

// ─── localStorage / sessionStorage Keys ──────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "neyborhuud_access_token",
  REFRESH_TOKEN: "neyborhuud_refresh_token",
  USER: "neyborhuud_user",
  DEVICE_ID: "neyborhuud_device_id",
  COMMUNITY_CONTEXT: "neyborhuud_community_context",
  COMMUNITY_ID: "neyborhuud_community_id",
  NEEDS_COMMUNITY_SELECTION: "neyborhuud_needs_community_selection",
  NEEDS_GPS_VERIFICATION: "neyborhuud_needs_gps_verification",
  PICKER_CONTEXT: "neyborhuud_picker_context",
  SESSION_EXPIRES_AT: "neyborhuud_session_expires_at",
  TEXT_SIZE: "neyborhuud_text_size",
  OFFLINE_QUEUE: "neyborhuud_offline_queue",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  CURRENT_USER: ["currentUser"] as const,
  NOTIFICATIONS: ["notifications"] as const,
  UNREAD_COUNT: ["unreadCount"] as const,
  CONVERSATIONS: ["conversations"] as const,
  LOCATION_FEED: ["locationFeed"] as const,
  POSTS: ["posts"] as const,
  MARKETPLACE_PRODUCTS: ["marketplace", "products"] as const,
  KEY_VERIFICATION: ["keyVerification"] as const,
} as const;

// ─── API Base Paths ───────────────────────────────────────────────────────────
export const API_PATHS = {
  FEED: "/feed",
  POSTS: "/content/posts",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile/me",
  AUTH_LOGIN: "/auth/login",
  AUTH_SIGNUP: "/auth/signup",
  AUTH_VERIFY_EMAIL: "/auth/verify-email",
  AUTH_RESEND_VERIFICATION: "/auth/resend-verification",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/auth/reset-password",
  SETTINGS: "/profile/settings",
  SAFETY_SETTINGS: "/safety/settings",
} as const;

// ─── Timing / Intervals ───────────────────────────────────────────────────────
export const INTERVALS = {
  /** How often the unread notification count is polled (ms) */
  NOTIFICATION_POLL_MS: 30_000,
  /** Minimum time between session touch calls (ms) */
  SESSION_TOUCH_MIN_MS: 4 * 60 * 1_000,
  /** Background session ping interval (ms) */
  SESSION_PING_INTERVAL_MS: 12 * 60 * 1_000,
  /** Resend verification code cooldown (seconds) */
  RESEND_COOLDOWN_SECONDS: 60,
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  /** Debounce delay for settings saves (ms) */
  SETTINGS_SAVE_DEBOUNCE_MS: 500,
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SIDEBAR_EVENTS_LIMIT: 3,
  SIDEBAR_MARKETPLACE_LIMIT: 2,
} as const;

// ─── Roles ────────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
  VERIFIED: "verified",
} as const;
