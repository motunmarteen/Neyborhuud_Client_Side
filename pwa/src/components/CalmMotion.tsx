'use client';

import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { applyCalm } from '@/lib/calmMode';
import { useCalm } from '@/hooks/useCalm';

/**
 * F-11: keeps <html data-calm> in step with the phone (reduced motion, Data Saver) and
 * other tabs (the Save data setting), and makes every framer-motion animation respect it.
 */
export function CalmMotion({ children }: { children: ReactNode }) {
  const calm = useCalm();

  useEffect(() => {
    applyCalm();
    const update = () => applyCalm();
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    mq?.addEventListener?.('change', update);
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.('change', update);
    window.addEventListener('storage', update);
    return () => {
      mq?.removeEventListener?.('change', update);
      conn?.removeEventListener?.('change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return <MotionConfig reducedMotion={calm ? 'always' : 'user'}>{children}</MotionConfig>;
}
