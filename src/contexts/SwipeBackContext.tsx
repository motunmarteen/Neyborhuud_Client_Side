'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navigateBack } from '@/lib/navigateBack';
import {
  isSwipeBackEdgeStart,
  isSwipeBackInteractiveTarget,
  isSwipeBackRootRoute,
  shouldCommitSwipeBack,
  swipeBackDragProgress,
} from '@/lib/swipeBackGesture';

type SwipeBackHandler = () => void;

type SwipeBackContextValue = {
  registerOverride: (id: string, handler: SwipeBackHandler) => () => void;
  setDisabled: (reason: string, disabled: boolean) => () => void;
  triggerBack: () => void;
  progress: number;
};

const SwipeBackContext = createContext<SwipeBackContextValue | null>(null);

function parseSafeLeftPx(): number {
  if (typeof window === 'undefined') return 0;
  return Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--safe-left') || '0',
  );
}

export function SwipeBackProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overridesRef = useRef<Map<string, SwipeBackHandler>>(new Map());
  const disabledReasonsRef = useRef<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const registerOverride = useCallback((id: string, handler: SwipeBackHandler) => {
    overridesRef.current.set(id, handler);
    return () => {
      overridesRef.current.delete(id);
    };
  }, []);

  const setDisabled = useCallback((reason: string, disabled: boolean) => {
    if (disabled) {
      disabledReasonsRef.current.add(reason);
    } else {
      disabledReasonsRef.current.delete(reason);
    }
    return () => {
      disabledReasonsRef.current.delete(reason);
    };
  }, []);

  const triggerBack = useCallback(() => {
    if (disabledReasonsRef.current.size > 0) return;
    if (isSwipeBackRootRoute(pathname)) return;

    const overrides = Array.from(overridesRef.current.values());
    const handler = overrides[overrides.length - 1];
    if (handler) {
      handler();
      return;
    }
    navigateBack(router, { pathname });
  }, [pathname, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSwipeBackRootRoute(pathname)) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    let pointerId: number | null = null;

    const reset = () => {
      active = false;
      pointerId = null;
      setProgress(0);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (disabledReasonsRef.current.size > 0) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isSwipeBackInteractiveTarget(event.target)) return;

      if (!isSwipeBackEdgeStart(event.clientX, parseSafeLeftPx())) return;

      active = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      setProgress(0);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active || pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      setProgress(swipeBackDragProgress(dx, dy));
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!active || pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const shouldNavigate = shouldCommitSwipeBack(dx, dy);
      reset();
      if (shouldNavigate) triggerBack();
    };

    const onPointerCancel = () => reset();

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      reset();
    };
  }, [pathname, triggerBack]);

  const value = useMemo(
    () => ({ registerOverride, setDisabled, triggerBack, progress }),
    [registerOverride, setDisabled, triggerBack, progress],
  );

  return (
    <SwipeBackContext.Provider value={value}>
      {children}
      <SwipeBackAffordance progress={progress} />
    </SwipeBackContext.Provider>
  );
}

function SwipeBackAffordance({ progress }: { progress: number }) {
  if (progress <= 0) return null;
  return (
    <div
      className="swipe-back-affordance pointer-events-none fixed inset-y-0 left-0 z-[9998]"
      data-testid="swipe-back-affordance"
      style={{
        width: `${Math.min(progress * 100, 100)}%`,
        maxWidth: '120px',
        opacity: Math.min(progress * 0.85 + 0.15, 1),
      }}
      aria-hidden
    />
  );
}

export function useSwipeBackOverride(handler: () => void, enabled = true) {
  const ctx = useContext(SwipeBackContext);
  const id = useId();

  useEffect(() => {
    if (!ctx || !enabled) return;
    return ctx.registerOverride(id, handler);
  }, [ctx, enabled, handler, id]);
}

export function useSwipeBackDisabled(disabled: boolean, reason = 'local') {
  const ctx = useContext(SwipeBackContext);
  useEffect(() => {
    if (!ctx || !disabled) return;
    return ctx.setDisabled(reason, true);
  }, [ctx, disabled, reason]);
}

export function useSwipeBackTrigger() {
  const ctx = useContext(SwipeBackContext);
  return ctx?.triggerBack ?? (() => undefined);
}
