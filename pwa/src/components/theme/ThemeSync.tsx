'use client';

import { useEffect } from 'react';
import { applySystemTheme, getStoredTheme, getSystemPrefersDark, subscribeSystemTheme } from '@/lib/systemTheme';

/**
 * Syncs the app theme with the user's stored preference or OS setting.
 * Renders nothing — side-effects only.
 */
export function ThemeSync() {
  useEffect(() => {
    const stored = getStoredTheme();
    const isDark = stored !== null ? stored === 'dark' : getSystemPrefersDark();
    applySystemTheme(isDark);

    const unsubscribe = subscribeSystemTheme((dark) => applySystemTheme(dark));
    return unsubscribe;
  }, []);

  return null;
}
