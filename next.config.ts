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
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
