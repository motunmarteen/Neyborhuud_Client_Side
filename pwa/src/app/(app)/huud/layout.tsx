import { preconnect, preload } from 'react-dom';
import { MAPLIBRE_WORKER_URL } from '@/lib/maplibreWorkerUrl';

/**
 * Map home head start (M-16): the map's tile worker (142 KB) starts downloading with the
 * page instead of after the map code has loaded, saving a step on slow networks.
 */
export default function HuudLayout({ children }: { children: React.ReactNode }) {
  preconnect('https://tiles.openfreemap.org', { crossOrigin: 'anonymous' });
  // Low: it must not slow the page's own styles and text.
  preload(MAPLIBRE_WORKER_URL, { as: 'fetch', crossOrigin: 'anonymous', fetchPriority: 'low' });
  return children;
}
