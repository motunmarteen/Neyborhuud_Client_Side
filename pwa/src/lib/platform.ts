/**
 * Runtime platform detection for the Capacitor native build.
 *
 * This file deliberately does NOT import @capacitor/core so that the web /
 * PWA build has zero dependency on Capacitor being installed. It sniffs the
 * global `Capacitor` object that the native runtime injects into the WebView.
 *
 * - On web / PWA: every check returns the web answer (isNative === false).
 * - Inside the Android/iOS Capacitor shell: isNative === true and getPlatform()
 *   returns 'android' | 'ios'.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, unknown>;
};

function getCap(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True only when running inside the native Capacitor WebView (Android/iOS). */
export function isNativePlatform(): boolean {
  const cap = getCap();
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
  // Older shape: presence of getPlatform returning a native value.
  if (typeof cap.getPlatform === 'function') {
    const p = cap.getPlatform();
    return p === 'android' || p === 'ios';
  }
  return false;
}

/** 'web' | 'android' | 'ios'. Always 'web' on the PWA build. */
export function getPlatform(): 'web' | 'android' | 'ios' {
  const cap = getCap();
  if (cap && typeof cap.getPlatform === 'function') {
    const p = cap.getPlatform();
    if (p === 'android' || p === 'ios') return p;
  }
  return 'web';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Whether this is the static-export build intended for Capacitor packaging.
 * Set at build time via `NEXT_PUBLIC_CAP=1`. Useful for compile-time branches
 * (e.g. skipping next-pwa registration) that must not depend on the runtime.
 */
export const IS_CAPACITOR_BUILD = process.env.NEXT_PUBLIC_CAP === '1';
