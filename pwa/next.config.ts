import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// The pnpm monorepo root is one level up from pwa/. Dependencies are hoisted
// into the root .pnpm store and only symlinked into pwa/node_modules, so the
// standalone output tracer MUST be rooted here — otherwise it can't follow the
// symlinks up to the store and Vercel ships a server bundle missing runtime
// modules, causing "Cannot find module" 500s on dynamic SSR routes.
const monorepoRoot = path.join(projectRoot, "..");

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
  // Navigations should always try the network first so a fresh deploy is picked
  // up immediately; fall back to cache only when offline. Without this, next-pwa
  // serves stale HTML and users keep running an old bundle after every deploy.
  cacheOnFrontEndNav: false,
  // NetworkFirst for the HTML document + the app's own JS/CSS chunks, so new
  // deploys are fetched fresh. Static assets (images/fonts) stay cache-first.
  runtimeCaching: [
    {
      urlPattern: ({ request }: any) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "html-pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    // The app's code files have a unique name per version (a new deploy = new names, found
    // through the fresh HTML above), so a saved copy is always right: use it at once (M-16).
    // NetworkFirst made every return visit on 3G wait up to 5 s per file before the cache.
    {
      urlPattern: /\/_next\/static\/.*\.(?:js|css)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-js-css",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
      },
    },
    // The map's tile worker (142 KB), versioned by ?v=<MapLibre version>.
    {
      urlPattern: /\/maplibre\/maplibre-gl-worker\.mjs/i,
      handler: "CacheFirst",
      options: {
        cacheName: "map-worker",
        expiration: { maxEntries: 4, maxAgeSeconds: 60 * 24 * 60 * 60 },
      },
    },
    // Low-data mode (M-15): map tiles are kept on the phone. Tile URLs carry the map's
    // version (planet/<date>/z/x/y.pbf) so a saved tile never goes stale: cache first, so
    // a second visit to an area costs almost no data and the map still shows offline.
    // Glyph fonts (.pbf too) never change either. ~1,500 tiles is roughly 30-60 MB at most.
    {
      urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*\.pbf$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "map-tiles",
        expiration: { maxEntries: 1500, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // The map's index (which version is newest), sprites: use the saved copy, refresh behind.
    {
      urlPattern: /^https:\/\/tiles\.openfreemap\.org\/(?!.*\.pbf$)/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "map-style",
        expiration: { maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?|ttf)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-left",
  },
  images: {
    // Every image goes through our custom loader: Cloudinary uploads are
    // resized + converted (AVIF/WebP, auto quality) by Cloudinary's CDN, in
    // the web build AND the static Capacitor build. This replaces Next's
    // own optimizer, which can't run in the native app and, with the old
    // `hostname: "**"` allow-list, let anyone use our Vercel account to
    // optimise arbitrary internet images.
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
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
  outputFileTracingRoot: monorepoRoot,
  // Native build => static export; web build => standalone Node server.
  output: IS_CAP ? "export" : "standalone",
};

export default IS_CAP ? (nextConfig as NextConfig) : withPWA(nextConfig as any);
