'use client';

import { useEffect, useState } from 'react';
import { subscribeSystemTheme, type AppTheme } from '@/lib/systemTheme';

/**
 * Keeps `html.dark`, CSS tokens, Tailwind `dark:` utilities, and theme-color
 * meta in sync with the device light/dark setting (live updates included).
 */
export function ThemeSync() {
  const [, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    return subscribeSystemTheme((_isDark, theme) => {
      setTheme(theme);
    });
  }, []);

  return null;
}
