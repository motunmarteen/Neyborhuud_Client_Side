// Minimal typings for next-pwa (replaces @types/next-pwa, which pulled an
// entire outdated Next.js 13/14 install — and its CVEs — into the tree).
declare module "next-pwa" {
  import type { NextConfig } from "next";
  type WithPWA = (config: NextConfig) => NextConfig;
  const withPWAInit: (options: Record<string, unknown>) => WithPWA;
  export default withPWAInit;
}
