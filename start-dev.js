#!/usr/bin/env node
/**
 * Start Next.js dev server on a custom port with isolated build directory
 * Usage: node start-dev.js [port]
 * Example: node start-dev.js 3002
 */

import { spawn } from "child_process";

const port = process.argv[2] || "3000";
const distDir = `.next-${port}`;

console.log(`🚀 Starting Next.js dev server on port ${port}`);
console.log(`📁 Using build directory: ${distDir}`);

const env = {
  ...process.env,
  NEXT_DIST_DIR: distDir,
  PORT: port,
};

const child = spawn(
  "pnpm",
  ["exec", "next", "dev", "--turbopack", "--port", port],
  {
    env,
    stdio: "inherit",
    shell: true,
  },
);

child.on("error", (error) => {
  console.error(`❌ Failed to start server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

// Handle termination signals
process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
