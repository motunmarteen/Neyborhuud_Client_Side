'use client';

import { useEffect, useState } from 'react';
import { CALM_EVENT, isCalm } from '@/lib/calmMode';

/** True while calm mode is on (reduced motion, Data Saver or the Save data setting). */
export function useCalm(): boolean {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    setCalm(isCalm());
    const on = (e: Event) => setCalm(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(CALM_EVENT, on);
    return () => window.removeEventListener(CALM_EVENT, on);
  }, []);
  return calm;
}
