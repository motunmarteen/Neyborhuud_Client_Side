'use client';

import { useEffect } from 'react';
import { applyTextSize, savedAccessibility } from '@/lib/calmMode';

/**
 * Re-applies the Settings text size after the app starts (the early CALM_BOOT_SCRIPT sets
 * it before the first paint; this covers a size that arrived later with the user record).
 */
export default function TextSizeApplier() {
  useEffect(() => {
    const size = savedAccessibility().textSize;
    if (size) applyTextSize(size);
  }, []);

  return null;
}
