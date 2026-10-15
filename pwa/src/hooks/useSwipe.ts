'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Vertical swipes that start on an element and may end anywhere (owner, 2026-10-15):
 * on the map's card, up opens the Feed and down hides the card; on the Feed, pulling down
 * from the top goes back to the map. Returns an onPointerDown handler for the element.
 * Taps still work: they do not move far enough to count.
 */
export function useVerticalSwipes(minPx: number, handlers: { onUp?: () => void; onDown?: () => void }) {
  const cleanup = useRef<(() => void) | null>(null);
  const cbs = useRef(handlers);
  useEffect(() => {
    cbs.current = handlers;
  }, [handlers]);
  useEffect(() => () => cleanup.current?.(), []);

  return useCallback(
    (e: React.PointerEvent) => {
      cleanup.current?.();
      const x0 = e.clientX;
      const y0 = e.clientY;
      const finish = (x: number, y: number) => {
        done();
        const dy = y - y0;
        if (Math.abs(x - x0) >= Math.abs(dy) * 0.6) return; // sideways: not ours
        if (dy < -minPx) cbs.current.onUp?.();
        else if (dy > minPx) cbs.current.onDown?.();
      };
      // Fingers: the browser may take over to scroll (pointercancel), but touchend still fires.
      const onTouchEnd = (ev: TouchEvent) => {
        const t = ev.changedTouches[0];
        if (t) finish(t.clientX, t.clientY);
        else done();
      };
      const onPointerUp = (ev: PointerEvent) => finish(ev.clientX, ev.clientY);
      const touch = e.pointerType === 'touch';
      const done = () => {
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', done);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', done);
        cleanup.current = null;
      };
      if (touch) {
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', done);
      } else {
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', done);
      }
      cleanup.current = done;
    },
    [minPx],
  );
}

/** One direction only (kept for the Feed's sky band). */
export function useVerticalSwipe(direction: 'up' | 'down', minPx: number, onSwipe: () => void) {
  return useVerticalSwipes(minPx, direction === 'up' ? { onUp: onSwipe } : { onDown: onSwipe });
}
