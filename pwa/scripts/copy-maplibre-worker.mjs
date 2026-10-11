// Copies MapLibre's tile worker into public/ so the map can load it (tracker M-01).
// MapLibre 6 looks for maplibre-gl-worker.mjs next to its own code; after webpack bundles
// that code into /_next/static/chunks/ the file is not there, so street tiles never decode.
// HuudMap calls setWorkerUrl('/maplibre/maplibre-gl-worker.mjs'). Run on every build so the
// worker always matches the installed MapLibre version.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pkgDir = path.dirname(require.resolve('maplibre-gl/package.json'));
const from = path.join(pkgDir, 'dist', 'maplibre-gl-worker.mjs');
const outDir = path.join(process.cwd(), 'public', 'maplibre');
mkdirSync(outDir, { recursive: true });
copyFileSync(from, path.join(outDir, 'maplibre-gl-worker.mjs'));
console.log('[maplibre] worker copied to public/maplibre/');
