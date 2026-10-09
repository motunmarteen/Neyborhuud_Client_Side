/**
 * Demo / design-preview mode.
 *
 * Enables the offline "demo resident" login and the mock feed padding used
 * while designing screens. It is impossible to turn on in a production
 * build: real users must only ever see real, server-issued sessions and
 * real community content (fabricated emergency posts in a safety feed are
 * dangerous, and a fake local session bypasses every server check).
 *
 * Opt in locally with NEXT_PUBLIC_ENABLE_DEMO_MODE=true in .env.local.
 */
export const DEMO_MODE: boolean =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
