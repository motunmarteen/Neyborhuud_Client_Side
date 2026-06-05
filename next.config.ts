import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Bundle service_worker/index.js into the Workbox-generated sw.js
  customWorkerDir: "service_worker",
});

const nextConfig: NextConfig = {
  /* config options here */
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
  // Disable static optimization to avoid pre-rendering errors  
  output: 'standalone',
};

export default withPWA(nextConfig as any);
