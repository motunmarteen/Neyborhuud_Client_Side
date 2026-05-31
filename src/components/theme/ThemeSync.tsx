'use client';

import { useEffect } from 'react';
import { applySystemTheme } from '@/lib/systemTheme';

/**
 * Forces app-wide light theme.
 */
export function ThemeSync() {
  useEffect(() => {
    applySystemTheme(false);
  }, []);

  return null;
}
