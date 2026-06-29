/** System (OS) light/dark preference — single source of truth for theme application. */

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'neyborhuud:theme';

const THEME_COLOR: Record<AppTheme, string> = {
  light: '#F6FAF6',
  dark:  '#0D1A0F',
};

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Read stored preference. Returns null when user has never chosen (follow OS). */
export function getStoredTheme(): AppTheme | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

export function setStoredTheme(theme: AppTheme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function resolveSystemTheme(isDark: boolean): AppTheme {
  return isDark ? 'dark' : 'light';
}

/** Apply theme to `<html>`, meta theme-color, and color-scheme. */
export function applySystemTheme(isDark: boolean): AppTheme {
  const theme: AppTheme = isDark ? 'dark' : 'light';
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  updateThemeColorMeta(theme);
  window.dispatchEvent(new CustomEvent('neyborhuud:theme', { detail: { theme, isDark } }));

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
    if (el) {
      // Set correct value per media query
      if (selector.includes('prefers-color-scheme: light')) {
        el.setAttribute('content', THEME_COLOR.light);
      } else if (selector.includes('prefers-color-scheme: dark')) {
        el.setAttribute('content', THEME_COLOR.dark);
      } else {
        el.setAttribute('content', content);
      }
    }
  }

  let fallback = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!fallback) {
    fallback = document.createElement('meta');
    fallback.setAttribute('name', 'theme-color');
    document.head.appendChild(fallback);
  }
  fallback.setAttribute('content', content);
}

/** Subscribe to OS theme changes. Returns unsubscribe fn. */
export function subscribeSystemTheme(onChange: (isDark: boolean, theme: AppTheme) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    // Only follow OS if user hasn't pinned a preference
    if (getStoredTheme() === null) {
      onChange(e.matches, resolveSystemTheme(e.matches));
    }
  };

  mq.addEventListener('change', handler);
  // Immediate call with current state
  const stored = getStoredTheme();
  const isDark = stored !== null ? stored === 'dark' : mq.matches;
  onChange(isDark, resolveSystemTheme(isDark));

  return () => mq.removeEventListener('change', handler);
}

/** Inline boot script (in layout `<head>`) — prevents FOUC before React hydrates. */
export const SYSTEM_THEME_BOOT_SCRIPT = `(function(){try{
  var s=localStorage.getItem('neyborhuud:theme');
  var dark=s==='dark'||(s===null&&window.matchMedia('(prefers-color-scheme:dark)').matches);
  var d=document.documentElement;
  if(dark){d.classList.add('dark');}else{d.classList.remove('dark');}
  d.dataset.theme=dark?'dark':'light';
  d.style.colorScheme=dark?'dark':'light';
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',dark?'#0D1A0F':'#F6FAF6');
}catch(e){}}());`;
