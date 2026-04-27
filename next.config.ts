import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {},
  // Skip static generation for problematic pages
  experimental: {
    skipTrailingSlashRedirect: true,
  },
  // Disable static optimization to avoid pre-rendering errors
  output: 'standalone',
};

export default withPWA(nextConfig as any);
