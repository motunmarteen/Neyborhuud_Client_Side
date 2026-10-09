'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type AppTheme,
  getStoredTheme,
  setStoredTheme,
  applySystemTheme,
  getSystemPrefersDark,
} from '@/lib/systemTheme';

/**
 * useAppTheme hook:
 * Provides reactive access to the current theme ('dark' | 'light'),
 * whether dark mode is currently active, and a toggleTheme function.
 * Automatically synchronizes with OS preference and user selection.
 */
export function useAppTheme() {
  const [theme] = useState<AppTheme>('light');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    applySystemTheme(false);
  }, []);

  const setTheme = useCallback((_newTheme: AppTheme) => {
    applySystemTheme(false);
  }, []);

  const toggleTheme = useCallback(() => {
    applySystemTheme(false);
  }, []);

  return {
    theme: 'light' as AppTheme,
    isDark: false,
    isMounted,
    setTheme,
    toggleTheme,
  };
}
