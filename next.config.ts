import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Capacitor build mode.
 *
 * When `NEXT_PUBLIC_CAP=1`, we produce a fully static export (`out/`) that
 * Capacitor packages into the native Android/iOS app. In this mode:
 *   - output: 'export' (no Node server — Capacitor serves files from the WebView)
 *   - next-pwa is disabled (its service worker conflicts with the capacitor://
 *     scheme and is redundant on native)
 *   - images are unoptimized (the Next image optimizer needs a server)
 *   - redirects() are dropped (not supported by static export — handled
 *     client-side instead; see src/app/(app)/messages)
 *
 * When the flag is off, the web / PWA build is byte-for-byte unchanged.
 */
const IS_CAP = process.env.NEXT_PUBLIC_CAP === "1";

const withPWA = withPWAInit({
  dest: "public",
  disable: IS_CAP || process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Bundle service_worker/index.js into the Workbox-generated sw.js
  customWorkerDir: "service_worker",
});

const nextConfig: NextConfig = {
  images: {
    // Static export cannot use the Next.js image optimizer (no server).
    // Also disable in dev so slow upstream images (like picsum.photos) don't crash the optimizer.
    unoptimized: IS_CAP || process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // redirects() is unsupported by `output: 'export'`. Keep it only for the
  // web/server build; the native build handles /messages client-side.
  ...(IS_CAP
    ? {}
    : {
        async redirects() {
          return [
            {
              source: "/messages",
              destination: "/chat",
              permanent: false,
            },
            {
              source: "/messages/:conversationId",
              destination: "/chat/:conversationId",
              permanent: false,
            },
          ];
        },
      }),
  // React Compiler disabled: on this codebase (Next 16 + Turbopack on Windows)
  // it caused pathologically slow / hanging dev compilation. It's an optimization
  // only — the app behaves identically without it. Re-enable for prod builds later
  // if desired, but keep it off for the dev server's stability.
  reactCompiler: false,
  // Allow running multiple dev servers by isolating cache/output directories.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // Native build => static export; web build => standalone Node server.
  output: IS_CAP ? "export" : "standalone",
};

export default IS_CAP ? (nextConfig as NextConfig) : withPWA(nextConfig as any);
