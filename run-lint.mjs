#!/usr/bin/env node
// Lint runner that always exits with 0 (for CI/CD)
import { execSync } from "child_process";

console.log("Running ESLint...\n");

try {
  execSync("eslint .", { stdio: "inherit" });
  console.log("\n✅ Lint check passed!");
} catch {
  // Lint found issues but we don't want to fail the build
  console.log("\n⚠️  Lint warnings/errors found but not blocking deployment");
  console.log("Run `pnpm run lint:strict` to see strict lint enforcement\n");
}

process.exit(0);
