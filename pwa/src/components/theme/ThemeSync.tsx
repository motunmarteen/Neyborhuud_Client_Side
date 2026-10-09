'use client';

import { useEffect } from 'react';
import { applySystemTheme, getStoredTheme, getSystemPrefersDark, subscribeSystemTheme } from '@/lib/systemTheme';

/**
 * Syncs the app theme with the user's stored preference or OS setting.
 * Renders nothing — side-effects only.
 */
export function ThemeSync() {
  useEffect(() => {
    applySystemTheme(false);
  }, []);

  return null;
}
