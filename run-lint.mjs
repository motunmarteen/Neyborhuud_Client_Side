#!/usr/bin/env node
// Lint runner — exits non-zero when ESLint reports errors
import { execSync } from "child_process";

console.log("Running ESLint...\n");

try {
  execSync("eslint .", { stdio: "inherit" });
  console.log("\n✅ Lint check passed!");
  process.exit(0);
} catch {
  console.log("\n⚠️  Lint found issues — fix errors above (or run `pnpm run lint:strict`).");
  process.exit(1);
}
