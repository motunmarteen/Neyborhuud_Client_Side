/**
 * Safe Storage Utilities
 *
 * SSR-safe wrappers around localStorage and sessionStorage.
 * All functions return null / undefined gracefully on the server
 * instead of throwing "localStorage is not defined".
 */

const isBrowser = typeof window !== "undefined";

export const safeStorage = {
  /**
   * Get an item from localStorage. Returns null on server or if key is missing.
   */
  get(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Set an item in localStorage. No-op on server.
   */
  set(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage quota exceeded or security error — silent fail
    }
  },

  /**
   * Remove an item from localStorage. No-op on server.
   */
  remove(key: string): void {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },

  /**
   * Get and JSON-parse a stored object. Returns null if missing, SSR, or parse fails.
   */
  getJSON<T = unknown>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * JSON-stringify and store an object. No-op on server.
   */
  setJSON(key: string, value: unknown): void {
    try {
      this.set(key, JSON.stringify(value));
    } catch {
      // Circular reference or other stringify failure — silent fail
    }
  },

  /**
   * Clear all localStorage entries. No-op on server.
   */
  clear(): void {
    if (!isBrowser) return;
    try {
      localStorage.clear();
    } catch {
      // Silent fail
    }
  },
};

export const safeSessionStorage = {
  get(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Silent fail
    }
  },

  remove(key: string): void {
    if (!isBrowser) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },
};
