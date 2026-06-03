'use client';

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

type UseBottomSheetDragOptions = {
  onDismiss: () => void;
  /** Drag distance (px) to close. */
  threshold?: number;
  /** Downward velocity (px/ms) to close. */
  velocityThreshold?: number;
  /** Tap on handle when barely moved also dismisses. */
  dismissOnHandleTap?: boolean;
};

export function useBottomSheetDrag({
  onDismiss,
  threshold = 100,
  velocityThreshold = 0.85,
  dismissOnHandleTap = true,
}: UseBottomSheetDragOptions) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  const reset = useCallback(() => {
    setDragY(0);
    setDragging(false);
    startYRef.current = null;
    startTsRef.current = null;
    movedRef.current = false;
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    setDragging(true);
    startYRef.current = e.clientY;
    startTsRef.current = performance.now();
    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!dragging || startYRef.current === null) return;
      const next = Math.max(0, e.clientY - startYRef.current);
      if (next > 4) movedRef.current = true;
      setDragY(next);
    },
    [dragging],
  );

  const onPointerEnd = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!dragging) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      const elapsed = startTsRef.current ? Math.max(1, performance.now() - startTsRef.current) : 1;
      const velocity = dragY / elapsed;
      const shouldDismiss =
        dragY > threshold ||
        velocity > velocityThreshold ||
        (dismissOnHandleTap && !movedRef.current && dragY < 8);

      setDragging(false);
      startYRef.current = null;
      startTsRef.current = null;

      if (shouldDismiss) {
        onDismiss();
        reset();
        return;
      }

      setDragY(0);
      movedRef.current = false;
    },
    [dragging, dragY, dismissOnHandleTap, onDismiss, reset, threshold, velocityThreshold],
  );

  const handleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    className:
      'flex shrink-0 cursor-grab touch-none select-none justify-center pt-3 pb-2 active:cursor-grabbing',
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': 'Drag down to close',
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    },
  };

  const getPanelStyle = useCallback(
    (visible: boolean, hiddenOffset = 480): CSSProperties => ({
      transform: `translate3d(0, ${(visible ? 0 : hiddenOffset) + dragY}px, 0)`,
      opacity: visible ? 1 : 0,
      transitionProperty: dragging ? 'none' : 'transform, opacity',
      transitionDuration: dragging ? '0ms' : '300ms',
      transitionTimingFunction: dragging ? 'linear' : 'cubic-bezier(0.22, 1, 0.36, 1)',
    }),
    [dragY, dragging],
  );

  return {
    dragY,
    dragging,
    handleProps,
    getPanelStyle,
    reset,
  };
}
