/**
 * Wipe bloated Turbopack cache and start dev (fixes 10+ min /feed compiles on Windows).
 *
 * Usage: pnpm run dev:clean
 */
import { rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');
const nextDir = path.join(projectRoot, '.next');

if (existsSync(nextDir)) {
  console.log('Removing .next cache…');
  rmSync(nextDir, { recursive: true, force: true });
  console.log('✓ Cleared .next\n');
} else {
  console.log('No .next folder — starting fresh.\n');
}

console.log('Starting next dev --turbopack…\n');
const result = spawnSync('pnpm', ['exec', 'next', 'dev', '--turbopack'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
