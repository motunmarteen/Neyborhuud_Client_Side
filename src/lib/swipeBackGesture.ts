/** Swipe-back gesture constants and pure helpers (unit-testable). */

export const SWIPE_BACK_EDGE_ZONE_PX = 28;
export const SWIPE_BACK_COMMIT_DISTANCE_PX = 72;
export const SWIPE_BACK_AXIS_RATIO = 1.25;

export const SWIPE_BACK_ROOT_ROUTES = new Set(['/', '/feed', '/welcome']);

export function isSwipeBackRootRoute(pathname: string): boolean {
  return SWIPE_BACK_ROOT_ROUTES.has(pathname);
}

export function isSwipeBackInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"], [data-no-swipe-back], .maplibregl-canvas, .no-swipe-back',
    ),
  );
}

export function isSwipeBackEdgeStart(clientX: number, safeLeftPx = 0): boolean {
  return clientX <= SWIPE_BACK_EDGE_ZONE_PX + safeLeftPx;
}

/** Progress 0–1 while dragging; 0 when gesture is invalid. */
export function swipeBackDragProgress(dx: number, dy: number): number {
  const absDy = Math.abs(dy);
  if (dx <= 0 || dx < absDy * SWIPE_BACK_AXIS_RATIO) return 0;
  return Math.min(dx / SWIPE_BACK_COMMIT_DISTANCE_PX, 1);
}

export function shouldCommitSwipeBack(dx: number, dy: number): boolean {
  const absDy = Math.abs(dy);
  return dx >= SWIPE_BACK_COMMIT_DISTANCE_PX && dx > absDy * SWIPE_BACK_AXIS_RATIO;
}

export type SwipeBackPointerPhase = 'ignore' | 'track' | 'commit';

export function classifySwipeBackPointerUp(dx: number, dy: number): SwipeBackPointerPhase {
  return shouldCommitSwipeBack(dx, dy) ? 'commit' : 'ignore';
}
