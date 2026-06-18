/**
 * Wipe bloated Next.js and Turbopack cache directories, including node_modules/.cache.
 * This completely clears out any corrupted compiler files on Windows.
 *
 * Usage: pnpm run dev:clean
 */
import { rmSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");

const entries = existsSync(projectRoot)
  ? readdirSync(projectRoot, { withFileTypes: true })
  : [];

// Find all .next and .next-* cache folders
const nextDirs = entries
  .filter(
    (e) =>
      e.isDirectory() && (e.name === ".next" || e.name.startsWith(".next-")),
  )
  .map((e) => path.join(projectRoot, e.name));

// Include node_modules/.cache if it exists
const cacheDir = path.join(projectRoot, "node_modules", ".cache");
if (existsSync(cacheDir)) {
  nextDirs.push(cacheDir);
}

if (nextDirs.length > 0) {
  console.log("🧹 Removing Next.js build caches and node_modules/.cache...");
  for (const dir of nextDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
      console.log(`✓ Removed: ${path.basename(dir)}`);
    } catch (err) {
      console.log(`⚠️ Could not remove ${path.basename(dir)}: ${err.message}`);
    }
  }
  console.log(`\n✓ Successfully cleared all cache folders.`);
} else {
  console.log("No cache folders found — already clean.\n");
}
