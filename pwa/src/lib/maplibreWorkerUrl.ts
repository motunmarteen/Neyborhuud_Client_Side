import maplibrePkg from 'maplibre-gl/package.json';

/**
 * Where the map's tile worker is served (copied to public/ at build time). The version in
 * the query keeps phones from using an old worker after an upgrade. Shared by the map and by
 * the map page's head start (preload), which must ask for exactly the same address.
 */
export const MAPLIBRE_WORKER_URL = `/maplibre/maplibre-gl-worker.mjs?v=${maplibrePkg.version}`;
