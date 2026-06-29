/**
 * Unified share entry point.
 *
 * Native (Capacitor): uses @capacitor/share -> the real OS share sheet, which is
 *   more reliable inside a WebView than navigator.share (which is often missing or
 *   flaky in Android WebViews).
 * Web/PWA: falls back to navigator.share when available, else returns false so the
 *   caller can show its own copy-link / social-buttons UI (unchanged web behaviour).
 *
 * Returns true if the share sheet was invoked, false if no share mechanism exists
 * (caller should fall back to its in-app share UI).
 */

import { isNativePlatform } from '@/lib/platform';

export interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
  /** Dialog title on Android. */
  dialogTitle?: string;
}

export async function share(payload: SharePayload): Promise<boolean> {
  // Native: prefer the Capacitor Share plugin.
  if (isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      const canShare = await Share.canShare().catch(() => ({ value: true }));
      if (canShare.value) {
        await Share.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
          dialogTitle: payload.dialogTitle ?? payload.title,
        });
        return true;
      }
    } catch {
      // User cancelled or plugin failed — fall through to web path / caller UI.
      // A cancellation should NOT trigger the fallback UI, so treat as handled:
      return true;
    }
  }

  // Web: Web Share API if present.
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
      return true;
    } catch {
      // User cancelled the native web sheet — treat as handled.
      return true;
    }
  }

  // No share mechanism — caller should show its own share UI.
  return false;
}
