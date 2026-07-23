#!/usr/bin/env node
// Fails on production dependencies whose SOLE license has real redistribution/
// copyleft obligations (GPL/AGPL/SSPL family). Dual-licensed packages with a
// permissive option (e.g. "MIT OR Apache-2.0") and file-level copyleft
// consumed only as a dependency (MPL-2.0, LGPL) are not blocked — those don't
// impose obligations on this codebase's own source.
import { execSync } from "node:child_process";

const raw = execSync("pnpm licenses list --prod --json", {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 32,
});
const data = JSON.parse(raw);

const denylist = /(^|\s)(AGPL|SSPL|GPL-\d)/i;
const violations = [];
for (const [license, pkgs] of Object.entries(data)) {
  const isDual = /\bOR\b/i.test(license);
  if (denylist.test(license) && !isDual) {
    violations.push(`${license}: ${pkgs.map((p) => p.name).join(", ")}`);
  }
}

if (violations.length) {
  console.error("Found dependencies with restrictive licenses:");
  violations.forEach((v) => console.error("  " + v));
  process.exit(1);
}
console.log("License check passed — no restrictive-copyleft dependencies found.");
