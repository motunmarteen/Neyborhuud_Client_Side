'use client';

import { useEffect, useRef, useState } from 'react';

const SCROLL_THRESHOLD = 10;

type ScrollTarget =
  | { kind: 'element'; el: HTMLElement }
  | { kind: 'window' };

/** Scroll container for the current page (main column or window). */
export function findAppScrollRoot(): ScrollTarget {
  if (typeof document === 'undefined') return { kind: 'window' };

  const mains = [
    ...document.querySelectorAll<HTMLElement>('main.feed-scroll-main'),
    ...document.querySelectorAll<HTMLElement>('main.overflow-y-auto'),
    ...document.querySelectorAll<HTMLElement>('main.flex-1.overflow-y-auto'),
  ];

  for (const el of mains) {
    if (el.scrollHeight > el.clientHeight + 1) {
      return { kind: 'element', el };
    }
  }

  if (document.documentElement.scrollHeight > window.innerHeight + 1) {
    return { kind: 'window' };
  }

  if (mains[0]) {
    return { kind: 'element', el: mains[0] };
  }

  return { kind: 'window' };
}

/**
 * Hide bottom nav when scrolling down, show when scrolling up (feed behavior).
 */
export function useScrollHideBottomNav(enabled = true, resetKey?: string) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }

    const target = findAppScrollRoot();
    const getY = () => (target.kind === 'element' ? target.el.scrollTop : window.scrollY);

    lastScrollY.current = getY();
    setHidden(false);

    const handleScroll = () => {
      const y = getY();
      if (y - lastScrollY.current > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (lastScrollY.current - y > SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };

    if (target.kind === 'element') {
      target.el.addEventListener('scroll', handleScroll, { passive: true });
      return () => target.el.removeEventListener('scroll', handleScroll);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, resetKey]);

  return hidden;
}
