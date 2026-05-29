'use client';

import { useEffect, useState } from 'react';
import { subscribeSystemTheme, type AppTheme } from '@/lib/systemTheme';

/** Live OS / gadget light-dark preference (matches `html.dark`). */
export function useAppTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => subscribeSystemTheme((_isDark, next) => setTheme(next)), []);

  return theme;
}
