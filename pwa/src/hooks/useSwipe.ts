'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * A vertical swipe that starts on an element and may end anywhere (owner, 2026-10-15:
 * swipe up on the map's sheet for the Feed, swipe down on the Feed's sky for the map).
 * Returns an onPointerDown handler for the element. Buttons inside still work: a tap does
 * not move far enough to count.
 */
export function useVerticalSwipe(direction: 'up' | 'down', minPx: number, onSwipe: () => void) {
  const cleanup = useRef<(() => void) | null>(null);
  const cb = useRef(onSwipe);
  useEffect(() => {
    cb.current = onSwipe;
  }, [onSwipe]);
  useEffect(() => () => cleanup.current?.(), []);

  return useCallback(
    (e: React.PointerEvent) => {
      cleanup.current?.();
      const x0 = e.clientX;
      const y0 = e.clientY;
      const up = (ev: PointerEvent) => {
        done();
        const dy = direction === 'up' ? y0 - ev.clientY : ev.clientY - y0;
        if (dy > minPx && Math.abs(ev.clientX - x0) < dy * 0.6) cb.current();
      };
      const done = () => {
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', done);
        cleanup.current = null;
      };
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', done);
      cleanup.current = done;
    },
    [direction, minPx],
  );
}
