import * as maplibregl from 'maplibre-gl';
import { MAPLIBRE_WORKER_URL } from '@/lib/maplibreWorkerUrl';

/**
 * MapLibre 6 decodes vector tiles in a worker it expects next to its own code; after webpack
 * bundling it is not there, so maps stay blank. The worker is copied to public/ at build time
 * (scripts/copy-maplibre-worker.mjs). Call before creating any map.
 */
let done = false;
export function ensureMaplibreWorker() {
  if (done) return;
  maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
  done = true;
}
