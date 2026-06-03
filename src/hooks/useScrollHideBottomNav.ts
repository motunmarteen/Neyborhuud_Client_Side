'use client';

import { useEffect, useRef, useState } from 'react';

const SCROLL_THRESHOLD = 10;

const SCROLL_ROOT_QUERY = [
  '[data-app-scroll-root]',
  'main.feed-scroll-main',
  '.feed-scroll-main',
  'main.overflow-y-auto',
  'main.flex-1.overflow-y-auto',
  '.app-shell .flex-1.overflow-y-auto',
].join(',');

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

/** Scroll containers for the current page (excludes immersive chat thread). */
export function collectAppScrollRoots(): HTMLElement[] {
  if (typeof document === 'undefined') return [];

  const seen = new Set<HTMLElement>();
  const roots: HTMLElement[] = [];

  for (const el of document.querySelectorAll<HTMLElement>(SCROLL_ROOT_QUERY)) {
    if (seen.has(el)) continue;
    if (el.closest('.chat-room--thread')) continue;
    if (!isVisible(el)) continue;
    seen.add(el);
    roots.push(el);
  }

  return roots;
}

/**
 * Hide bottom nav when scrolling down, show when scrolling up (feed behavior).
 */
export function useScrollHideBottomNav(enabled = true, resetKey?: string) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(new WeakMap<EventTarget, number>());
  const windowLastY = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }

    const attached = new Map<HTMLElement, () => void>();
    let windowAttached = false;

    const applyScrollDelta = (y: number, key: EventTarget) => {
      if (y <= 16) {
        setHidden(false);
        lastScrollY.current.set(key, y);
        return;
      }
      const last = lastScrollY.current.get(key) ?? y;
      if (y - last > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (last - y > SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current.set(key, y);
    };

    const onElementScroll = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      applyScrollDelta(el.scrollTop, el);
    };

    const onWindowScroll = () => {
      const y = window.scrollY;
      if (y <= 16) {
        setHidden(false);
        windowLastY.current = y;
        return;
      }
      const last = windowLastY.current;
      if (y - last > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (last - y > SCROLL_THRESHOLD) {
        setHidden(false);
      }
      windowLastY.current = y;
    };

    const bindRoot = (el: HTMLElement) => {
      if (attached.has(el)) return;
      lastScrollY.current.set(el, el.scrollTop);
      el.addEventListener('scroll', onElementScroll, { passive: true });
      attached.set(el, () => el.removeEventListener('scroll', onElementScroll));
    };

    const syncRoots = () => {
      for (const el of collectAppScrollRoots()) {
        bindRoot(el);
      }
      const hasRoots = collectAppScrollRoots().length > 0;
      if (
        !hasRoots &&
        !windowAttached &&
        document.documentElement.scrollHeight > window.innerHeight + 1
      ) {
        window.addEventListener('scroll', onWindowScroll, { passive: true });
        windowAttached = true;
      } else if (hasRoots && windowAttached) {
        window.removeEventListener('scroll', onWindowScroll);
        windowAttached = false;
      }
    };

    setHidden(false);
    windowLastY.current = window.scrollY;
    syncRoots();

    const ro = new ResizeObserver(() => {
      syncRoots();
    });

    collectAppScrollRoots().forEach((el) => ro.observe(el));
    const shell = document.querySelector('.app-shell');
    if (shell instanceof HTMLElement) {
      ro.observe(shell);
    }

    const mo = new MutationObserver(() => {
      requestAnimationFrame(syncRoots);
    });
    if (shell) {
      mo.observe(shell, { childList: true, subtree: true });
    }

    return () => {
      attached.forEach((off) => off());
      attached.clear();
      if (windowAttached) {
        window.removeEventListener('scroll', onWindowScroll);
      }
      ro.disconnect();
      mo.disconnect();
    };
  }, [enabled, resetKey]);

  return hidden;
}
