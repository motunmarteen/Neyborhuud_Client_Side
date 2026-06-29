/**
 * Capacitor static-export build.
 *
 * `output: 'export'` forbids Next.js Route Handlers (route.ts). This app has
 * three dev/proxy handlers under src/app/(app)/api (geocode search/reverse,
 * health). For the native build we read those files into memory, delete them,
 * run `next build` with NEXT_PUBLIC_CAP=1 (which flips next.config to export),
 * then rewrite them byte-for-byte — leaving the web/PWA source tree untouched.
 *
 * We operate per-file (delete + restore from memory) rather than renaming the
 * directory, because on Windows a running dev-server file watcher holds a lock
 * on the directory and rename fails with EPERM.
 *
 * The native app never needs these handlers: geocode goes direct-to-Nominatim
 * or to a backend proxy (see src/lib/nominatimClient.ts) and /api/health is
 * dev-only.
 *
 * Usage: node scripts/cap-build.mjs   (stop the dev server first)
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, cpSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiBase = path.join(root, 'src', 'app', '(app)', 'api');
const CAP_DIST = '.next-cap';

const tsconfigPath = path.join(root, 'tsconfig.json');
let tsconfigOriginal = null;

// The committed tsconfig.json includes per-port Next cache type dirs (.next-*,
// .next-3000, .next-3001) so multiple dev servers get type support. During this
// export build a live dev server may still be regenerating those dirs, and
// their stale/half-written validators reference files that don't exist in the
// export (the temporarily removed route handlers), breaking `tsc`.
//
// We temporarily rewrite tsconfig.json so its `include` only references this
// build's own cache dir (.next-cap), then restore it verbatim afterwards.
function narrowTsconfigToCapBuild() {
  tsconfigOriginal = readFileSync(tsconfigPath, 'utf8');
  const cfg = JSON.parse(tsconfigOriginal);
  cfg.include = [
    'next-env.d.ts',
    '**/*.ts',
    '**/*.tsx',
    '**/*.mts',
    `${CAP_DIST}/types/**/*.ts`,
    `${CAP_DIST}/dev/types/**/*.ts`,
  ];
  // Don't let `tsc` walk the other Next caches at all.
  cfg.exclude = Array.from(new Set([...(cfg.exclude || []), 'node_modules', '.next', '.next-3000', '.next-3001', '.next-3002', '.next-3003']));
  writeFileSync(tsconfigPath, JSON.stringify(cfg, null, 2), 'utf8');
  console.log('[cap-build] narrowed tsconfig include to .next-cap');
}

function restoreTsconfig() {
  if (tsconfigOriginal != null) {
    writeFileSync(tsconfigPath, tsconfigOriginal, 'utf8');
    tsconfigOriginal = null;
    console.log('[cap-build] restored tsconfig.json');
  }
}

// ── Production API env for the native build ──────────────────────────────────
// A native app can never reach the developer's localhost backend, so the
// Capacitor build must always target the production API/socket. `.env.local`
// (used for web dev, points at localhost) would otherwise override these, so we
// stash it and write a cap-only env for the duration of the build, then restore.
//
// Override on the CLI if needed, e.g.:
//   $env:CAP_API_BASE="https://staging.neyborhuud.com/api/v1"; pnpm build:cap
const CAP_API_BASE = process.env.CAP_API_BASE || 'https://api.neyborhuud.com/api/v1';
const CAP_SOCKET_URL = process.env.CAP_SOCKET_URL || 'https://api.neyborhuud.com';

const envLocalPath = path.join(root, '.env.local');
let envLocalOriginal = null; // contents of the original file, if one existed
let envLocalExisted = false; // did a .env.local exist before we touched it?
let envApplied = false; // have we swapped in the cap env (and not yet restored)?

function applyCapEnv() {
  // Preserve any non-API public vars from the existing .env.local (Maps key,
  // VAPID key, feature flags) but force the API/socket URLs to production.
  let preserved = '';
  if (existsSync(envLocalPath)) {
    envLocalExisted = true;
    envLocalOriginal = readFileSync(envLocalPath, 'utf8');
    preserved = envLocalOriginal
      .split(/\r?\n/)
      .filter((line) => {
        const key = line.split('=')[0]?.trim();
        return (
          key &&
          !key.startsWith('#') &&
          ![
            'NEXT_PUBLIC_API_URL',
            'NEXT_PUBLIC_API_BASE_URL',
            'NEXT_PUBLIC_SOCKET_URL',
            'NEXT_PUBLIC_ENABLE_LOCAL_SOCKET',
          ].includes(key)
        );
      })
      .join('\n');
  } else {
    envLocalExisted = false;
    envLocalOriginal = null;
  }

  const capEnv = [
    '# AUTO-GENERATED for the Capacitor build by scripts/cap-build.mjs.',
    '# The original .env.local is restored after the build.',
    `NEXT_PUBLIC_API_URL=${CAP_API_BASE}`,
    `NEXT_PUBLIC_API_BASE_URL=${CAP_API_BASE}`,
    `NEXT_PUBLIC_SOCKET_URL=${CAP_SOCKET_URL}`,
    preserved,
    '',
  ].join('\n');

  writeFileSync(envLocalPath, capEnv, 'utf8');
  envApplied = true;
  console.log(`[cap-build] env -> API ${CAP_API_BASE}`);
}

function restoreEnv() {
  // Guard: only act if we actually swapped the env in. restoreAll() is called
  // BOTH from the finally block AND the process 'exit' handler; without this
  // guard the second pass would delete the file the first pass just restored.
  if (!envApplied) return;
  envApplied = false;

  if (envLocalExisted) {
    writeFileSync(envLocalPath, envLocalOriginal ?? '', 'utf8');
    console.log('[cap-build] restored .env.local');
  } else if (existsSync(envLocalPath)) {
    // There was genuinely no .env.local before; remove the one we created.
    rmSync(envLocalPath);
    console.log('[cap-build] removed temporary .env.local');
  }
}

const ROUTE_FILES = [
  path.join(apiBase, 'geocode', 'reverse', 'route.ts'),
  path.join(apiBase, 'geocode', 'search', 'route.ts'),
  path.join(apiBase, 'health', 'route.ts'),
];

/** filepath -> original contents (kept in memory for guaranteed restore) */
const saved = new Map();

function stashRoutes() {
  for (const f of ROUTE_FILES) {
    if (existsSync(f)) {
      saved.set(f, readFileSync(f, 'utf8'));
      rmSync(f);
      console.log(`[cap-build] removed (temp): ${path.relative(root, f)}`);
    }
  }
}

function restoreRoutes() {
  for (const [f, content] of saved) {
    try {
      writeFileSync(f, content, 'utf8');
      console.log(`[cap-build] restored: ${path.relative(root, f)}`);
    } catch (e) {
      console.error(`[cap-build] FAILED to restore ${f}:`, e.message);
      console.error('[cap-build] Original contents below — restore by hand:\n');
      console.error(content);
    }
  }
  saved.clear();
}

/** page.tsx path -> original contents (Cap export needs dynamicParams = false literal) */
const savedDynamicPages = new Map();

function walkAppPages(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkAppPages(full, visitor);
    else if (entry === 'page.tsx') visitor(full);
  }
}

function patchDynamicRoutePagesForExport() {
  const appRoot = path.join(root, 'src', 'app');
  walkAppPages(appRoot, (file) => {
    const content = readFileSync(file, 'utf8');
    if (!content.includes('export const dynamicParams = true;')) return;
    savedDynamicPages.set(file, content);
    writeFileSync(
      file,
      content.replace(
        'export const dynamicParams = true;',
        'export const dynamicParams = false;',
      ),
      'utf8',
    );
    console.log(`[cap-build] dynamicParams=false (temp): ${path.relative(root, file)}`);
  });
}

function restoreDynamicRoutePages() {
  for (const [file, content] of savedDynamicPages) {
    try {
      writeFileSync(file, content, 'utf8');
      console.log(`[cap-build] restored dynamic route page: ${path.relative(root, file)}`);
    } catch (e) {
      console.error(`[cap-build] FAILED to restore ${file}:`, e.message);
    }
  }
  savedDynamicPages.clear();
}

/**
 * Work around vercel/next.js#85374 (Next 16 static export RSC 404s).
 *
 * Next writes RSC segment payloads into nested directories whose first segment
 * starts with `__next.`, e.g.:
 *     feed/__next.!KGFwcCk/feed.txt
 *     feed/__next.!KGFwcCk/feed/__PAGE__.txt
 * but the client's soft-navigation prefetch requests the FLATTENED dotted form:
 *     feed/__next.!KGFwcCk.feed.txt
 *     feed/__next.!KGFwcCk.feed.__PAGE__.txt
 *
 * For every file living under a `__next.*` directory, we create a sibling copy
 * at the flattened dotted path the client expects. Idempotent and additive — it
 * never deletes the originals.
 */
function flattenRscPayloads(dir) {
  let created = 0;

  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        // Find a path component that begins with "__next." and is NOT the file
        // itself (i.e. there are further components after it).
        const rel = path.relative(dir, full);
        const parts = rel.split(path.sep);
        const idx = parts.findIndex(
          (p, i) => p.startsWith('__next.') && i < parts.length - 1,
        );
        if (idx === -1) continue;

        // Flatten everything from the __next.* segment onward into one dotted
        // filename: ["__next.X","feed","__PAGE__.txt"] -> "__next.X.feed.__PAGE__.txt"
        const prefix = parts.slice(0, idx);
        const flatName = parts.slice(idx).join('.');
        const target = path.join(dir, ...prefix, flatName);
        if (!existsSync(target)) {
          copyFileSync(full, target);
          created++;
        }
      }
    }
  };

  walk(dir);
  console.log(`[cap-build] RSC payload flatten: created ${created} dotted aliases (next#85374 fix)`);
}

function restoreAll() {
  restoreRoutes();
  restoreDynamicRoutePages();
  restoreTsconfig();
  restoreEnv();
}

process.on('exit', restoreAll);
process.on('SIGINT', () => { restoreAll(); process.exit(1); });
process.on('SIGTERM', () => { restoreAll(); process.exit(1); });

try {
  narrowTsconfigToCapBuild();
  applyCapEnv();
  stashRoutes();
  patchDynamicRoutePagesForExport();
  const env = {
    ...process.env,
    NEXT_PUBLIC_CAP: '1',
    NEXT_DIST_DIR: CAP_DIST,
  };
  console.log('[cap-build] running: next build (export, NEXT_PUBLIC_CAP=1)');
  // Resolve the Next CLI from node_modules rather than relying on `next` being
  // on PATH — when this script is run via `node scripts/cap-build.mjs` (not an
  // npm/pnpm script) the local .bin shims are NOT on PATH.
  const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  execSync(`node ${JSON.stringify(nextCli)} build --webpack`, { stdio: 'inherit', env, cwd: root });

  // With a custom distDir, Next emits the static export into that dir rather
  // than ./out. Copy it to a clean ./out so Capacitor has a stable webDir.
  const outDir = path.join(root, 'out');
  const exportSrc = path.join(root, CAP_DIST);
  if (!existsSync(path.join(exportSrc, 'index.html'))) {
    throw new Error(`[cap-build] export did not produce ${CAP_DIST}/index.html — aborting`);
  }
  rmSync(outDir, { recursive: true, force: true });
  cpSync(exportSrc, outDir, { recursive: true });

  // Fix the Next.js 16 static-export RSC payload 404s (vercel/next.js#85374).
  // Next 16's Cache-Components RSC fetch writes segment payloads into NESTED
  // dirs (e.g. feed/__next.<grp>/feed/__PAGE__.txt) but the client requests the
  // FLATTENED dotted name (feed/__next.<grp>.feed.__PAGE__.txt). The mismatch
  // 404s every soft navigation -> the app bounces to "/". We create the dotted
  // aliases the client expects. Verified against the real export tree.
  flattenRscPayloads(outDir);

  // Dynamic-route note: Capacitor's WebView serves root index.html for unmatched
  // paths; SpaRouteRescue.tsx re-navigates to the real URL on boot, and
  // resolveDynamicParam() reads the real id from window.location.
  console.log('[cap-build] export complete — copied to ./out');
} finally {
  restoreAll();
}
