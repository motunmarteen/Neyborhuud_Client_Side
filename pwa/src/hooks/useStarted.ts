import { useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/**
 * False while the page is being matched to its pre-built HTML, true once it runs on the phone.
 * Anything that comes from this phone (who you are, the time of day, your area) waits for it,
 * so the first draw matches the pre-built page (no hydration errors).
 */
export function useStarted(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
