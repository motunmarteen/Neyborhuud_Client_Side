/** System (OS) light/dark preference — single source of truth for theme application. */

export type AppTheme = 'light' | 'dark';

const THEME_COLOR: Record<AppTheme, string> = {
  light: '#ffffff',
  dark: '#0d1a0f',
};

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveSystemTheme(isDark: boolean): AppTheme {
  return isDark ? 'dark' : 'light';
}

/** Apply theme to `<html>`, meta theme-color, and color-scheme. */
export function applySystemTheme(isDark: boolean): AppTheme {
  const theme = resolveSystemTheme(isDark);
  const root = document.documentElement;

  root.classList.toggle('dark', isDark);
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

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const notify = (matches: boolean) => onChange(matches, applySystemTheme(matches));

  notify(media.matches);

  const handler = (event: MediaQueryListEvent) => notify(event.matches);
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}

/** Inline boot script (in layout `<head>`) — prevents flash before React hydrates. */
export const SYSTEM_THEME_BOOT_SCRIPT = `(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');var d=document.documentElement;var a=function(x){d.classList.toggle('dark',x);d.dataset.theme=x?'dark':'light';d.style.colorScheme=x?'dark':'light';var c=x?'#0d1a0f':'#ffffff';var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',c);};a(m.matches);m.addEventListener('change',function(e){a(e.matches);});}catch(e){}}());`;
