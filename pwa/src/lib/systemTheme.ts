/** System (OS) light/dark preference — single source of truth for theme application. */

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'neyborhuud:theme';

const THEME_COLOR: Record<AppTheme, string> = {
  light: '#F4F7F5',
  dark:  '#0B0E11',
};

export function getSystemPrefersDark(): boolean {
  return false;
}

/** Read stored preference — forced to light. */
export function getStoredTheme(): AppTheme | null {
  return 'light';
}

export function setStoredTheme(_theme: AppTheme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'light');
}

export function resolveSystemTheme(_isDark: boolean): AppTheme {
  return 'light';
}

/** Apply theme to `<html>`, meta theme-color, and color-scheme — always light. */
export function applySystemTheme(_isDark?: boolean): AppTheme {
  const theme: AppTheme = 'light';
  if (typeof document === 'undefined') return theme;
  const root = document.documentElement;

  root.classList.remove('dark');
  root.dataset.theme = 'light';
  root.style.colorScheme = 'light';

  updateThemeColorMeta('light');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('neyborhuud:theme', { detail: { theme: 'light', isDark: false } }));
  }

  return theme;
}

function updateThemeColorMeta(theme: AppTheme): void {
  const content = THEME_COLOR.light;
  for (const selector of [
    'meta[name="theme-color"]',
    'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
    'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
  ]) {
    const el = document.querySelector(selector);
    if (el) {
      el.setAttribute('content', content);
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

/** Subscribe to OS theme changes — always yields light. */
export function subscribeSystemTheme(onChange: (isDark: boolean, theme: AppTheme) => void): () => void {
  onChange(false, 'light');
  return () => undefined;
}

/**
 * Inline boot script (in layout `<head>`) — hides the app shell for the brief
 * moment before DesktopPhoneFrame knows whether it should render the phone
 * simulator, so the full-width app doesn't flash and then snap into the frame.
 */
export const SIMULATOR_BOOT_SCRIPT = `(function(){try{
  var h=location.hostname;
  var isApp=h.indexOf('app.')===0||h.indexOf('app.neyborhuud.local')===0;
  if(isApp&&window.self===window.top&&window.innerWidth>=768){
    document.documentElement.setAttribute('data-simulator-booting','');
  }
}catch(e){}}());`;

/** Inline boot script (in layout `<head>`) — strictly locks light theme on boot. */
export const SYSTEM_THEME_BOOT_SCRIPT = `(function(){try{
  var d=document.documentElement;
  d.classList.remove('dark');
  d.dataset.theme='light';
  d.style.colorScheme='light';
  try{localStorage.setItem('neyborhuud:theme','light');}catch(_){}
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content','#F4F7F5');
}catch(e){}}());`;
