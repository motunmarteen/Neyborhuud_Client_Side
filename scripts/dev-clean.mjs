/**
 * Wipe bloated Turbopack cache and start dev (fixes 10+ min /feed compiles on Windows).
 *
 * Usage: pnpm run dev:clean
 */
import { rmSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");

const entries = existsSync(projectRoot)
  ? readdirSync(projectRoot, { withFileTypes: true })
  : [];
const nextDirs = entries
  .filter(
    (e) =>
      e.isDirectory() && (e.name === ".next" || e.name.startsWith(".next-")),
  )
  .map((e) => path.join(projectRoot, e.name));

if (nextDirs.length > 0) {
  console.log("Removing Next.js cache…");
  for (const dir of nextDirs) rmSync(dir, { recursive: true, force: true });
  console.log(`✓ Cleared ${nextDirs.length} folder(s)\n`);
} else {
  console.log("No .next folders — starting fresh.\n");
}

console.log("Starting dev…\n");
const result = spawnSync("pnpm", ["run", "dev"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
