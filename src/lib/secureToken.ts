/**
 * Secure token storage for the native (Capacitor) build.
 *
 * WHY: on web the auth token lives in localStorage (XSS-readable, but that's the
 * web reality). Inside the native app we keep the *durable* copy in the OS-backed
 * Capacitor Preferences store, which on Android is an app-private SharedPreferences
 * file (sandboxed from other apps) and on iOS is backed by the Keychain via the
 * UserDefaults bridge. This is materially safer than a web-exposed localStorage.
 *
 * DESIGN — write-through cache:
 * The app reads the token *synchronously* in ~12 places, most importantly the axios
 * request interceptor that runs on every call. Native secure storage is async, so we
 * cannot make those reads await. Instead:
 *   - localStorage stays the synchronous read mirror (works on web AND native WebView).
 *   - Native secure storage is the durable source of truth.
 *   - On boot we hydrate secure-storage -> localStorage once (see CapacitorInit).
 *   - On set/clear we write BOTH (localStorage sync + secure storage async).
 *
 * On web, every function here is a no-op / not invoked, so web behaviour is unchanged.
 */

import { isNativePlatform } from '@/lib/platform';

const SECURE_KEYS = [
  'neyborhuud_access_token',
  'neyborhuud_refresh_token',
] as const;

type SecureKey = (typeof SECURE_KEYS)[number];

let preferencesModule: typeof import('@capacitor/preferences') | null = null;

/**
 * Lazy-load @capacitor/preferences only on native. Keeps it out of the web bundle's
 * critical path and avoids importing native plugin code where it has no meaning.
 */
async function getPreferences() {
  if (!isNativePlatform()) return null;
  try {
    if (!preferencesModule) {
      preferencesModule = await import('@capacitor/preferences');
    }
    const Preferences = preferencesModule?.Preferences;
    // Guard: only return it if it actually exposes the methods we use. On some
    // Capacitor builds the proxy can surface a thenable that throws
    // "Preferences.then() is not implemented on android" if mis-awaited.
    if (Preferences && typeof Preferences.set === 'function') {
      return Preferences;
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist a key to native secure storage. No-op on web. */
export async function secureSet(key: SecureKey, value: string): Promise<void> {
  const Preferences = await getPreferences();
  if (!Preferences) return;
  try {
    await Preferences.set({ key, value });
  } catch {
    // Storage failure must never break auth; localStorage mirror still holds it.
  }
}

/** Remove a key from native secure storage. No-op on web. */
export async function secureRemove(key: SecureKey): Promise<void> {
  const Preferences = await getPreferences();
  if (!Preferences) return;
  try {
    await Preferences.remove({ key });
  } catch {
    // ignore
  }
}

/** Read a key from native secure storage (used during boot hydration). null on web. */
export async function secureGet(key: SecureKey): Promise<string | null> {
  const Preferences = await getPreferences();
  if (!Preferences) return null;
  try {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Boot hydration: copy tokens from native secure storage into localStorage so the
 * synchronous readers see a restored session after an app restart. Called once from
 * CapacitorInit before the app makes authed calls. No-op on web.
 *
 * If a token already exists in localStorage (e.g. just-completed login in this
 * session), secure storage is treated as the backfill source only when localStorage
 * is empty — localStorage is the fresher value during an active session.
 */
export async function hydrateTokensFromSecureStorage(): Promise<void> {
  if (!isNativePlatform() || typeof window === 'undefined') return;
  for (const key of SECURE_KEYS) {
    try {
      if (localStorage.getItem(key)) continue; // already present this session
      const stored = await secureGet(key);
      if (stored) localStorage.setItem(key, stored);
    } catch {
      // ignore — degraded to localStorage-only for this key
    }
  }
}

/** Mirror all token keys from localStorage into secure storage (used after login). */
export async function syncTokensToSecureStorage(): Promise<void> {
  if (!isNativePlatform() || typeof window === 'undefined') return;
  for (const key of SECURE_KEYS) {
    const value = localStorage.getItem(key);
    if (value) await secureSet(key, value);
    else await secureRemove(key);
  }
}
