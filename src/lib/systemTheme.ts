/** System (OS) light/dark preference — single source of truth for theme application. */

export type AppTheme = 'light' | 'dark';

const THEME_COLOR: Record<AppTheme, string> = {
  light: '#ffffff',
  dark: '#ffffff', // Forcing light background colour
};

export function getSystemPrefersDark(): boolean {
  return false; // Force light theme
}

export function resolveSystemTheme(isDark: boolean): AppTheme {
  return 'light'; // Always light theme
}

/** Apply theme to `<html>`, meta theme-color, and color-scheme. */
export function applySystemTheme(isDark: boolean): AppTheme {
  const theme = 'light';
  const root = document.documentElement;

  root.classList.remove('dark'); // Remove dark mode class
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  updateThemeColorMeta(theme);
  window.dispatchEvent(new CustomEvent('neyborhuud:theme', { detail: { theme, isDark: false } }));

  return theme;
}

function updateThemeColorMeta(theme: AppTheme): void {
  const content = THEME_COLOR[theme];
  for (const selector of [
    'meta[name="theme-color"]',
    'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
    'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
  ]) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  }

  let fallback = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!fallback) {
    fallback = document.createElement('meta');
    fallback.setAttribute('name', 'theme-color');
    document.head.appendChild(fallback);
  }
  fallback.setAttribute('content', content);
}

/** Subscribe to OS theme changes. Returns unsubscribe. */
export function subscribeSystemTheme(onChange: (isDark: boolean, theme: AppTheme) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const notify = () => onChange(false, 'light');
  notify();

  return () => undefined; // No-op since we don't need to listen to system shifts
}

/** Inline boot script (in layout `<head>`) — prevents flash before React hydrates. */
export const SYSTEM_THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;d.classList.remove('dark');d.dataset.theme='light';d.style.colorScheme='light';var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content','#ffffff');}catch(e){}}());`;
