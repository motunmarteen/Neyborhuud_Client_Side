'use client';

/**
 * CapacitorInit — native runtime bootstrap.
 *
 * Mounted once near the root (see app/layout.tsx). On the web/PWA build every
 * branch here is skipped (isNativePlatform() === false), so it renders nothing
 * and changes no web behaviour. Inside the native app it wires:
 *   - secure-token hydration (restore session from Keystore after app restart)
 *   - splash screen hide (once the shell is mounted -> no white flash)
 *   - status bar style + safe-area awareness
 *   - hardware back button (router back, or exit at root)
 *   - app foreground/background -> revalidate session + reconnect socket
 *   - network online/offline -> toast + let existing online listeners flush queues
 *
 * All plugin imports are dynamic so they never enter the web bundle's path.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isNativePlatform } from '@/lib/platform';

export default function CapacitorInit() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativePlatform()) return;

    // Flag the document so CSS can apply native-only adjustments (safe-area top
    // inset, no overscroll glow, etc.) the moment the app mounts.
    document.documentElement.setAttribute('data-capacitor', 'true');

    let cleanups: Array<() => void> = [];
    let cancelled = false;

    (async () => {
      // 1. Restore tokens from secure storage BEFORE anything authed runs.
      try {
        const { hydrateTokensFromSecureStorage } = await import('@/lib/secureToken');
        await hydrateTokensFromSecureStorage();
      } catch {
        /* degraded to localStorage-only */
      }
      if (cancelled) return;

      // 2. Status bar: overlay the web content (we manage safe areas in CSS),
      //    dark icons off / light content style to match the brand-dark shell.
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark }); // light text/icons
        // Android: draw behind the status bar so the app feels full-bleed.
        await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      } catch {
        /* status-bar not critical */
      }

      // 3. Hide the splash now that the shell + first paint are ready.
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }

      // 4. Hardware back button: navigate back within the SPA; if there's no
      //    history, let the OS minimise/exit the app.
      try {
        const { App } = await import('@capacitor/app');
        const sub = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack && window.history.length > 1) {
            router.back();
          } else {
            void App.exitApp();
          }
        });
        cleanups.push(() => sub.remove());

        // 5. Foreground/background: when the app returns to foreground, revalidate
        //    the stored session and let the socket reconnect.
        const stateSub = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) return;
          void (async () => {
            try {
              const { validateStoredSession } = await import('@/lib/authSession');
              await validateStoredSession();
            } catch {
              /* network blip — don't force logout */
            }
            try {
              const socketService = (await import('@/lib/socket')).default;
              // Reconnect if the socket dropped while backgrounded.
              // connect() is a no-op when already connected and reads the token itself.
              socketService.connect();
            } catch {
              /* socket optional */
            }
          })();
        });
        cleanups.push(() => stateSub.remove());
      } catch {
        /* @capacitor/app unavailable */
      }

      // 6. Network status -> user feedback; existing window 'online' listeners
      //    (e.g. useOfflineQueue) still handle queue flushing.
      try {
        const { Network } = await import('@capacitor/network');
        const netSub = await Network.addListener('networkStatusChange', (status) => {
          void import('sonner').then(({ toast }) => {
            if (status.connected) toast.success('Back online');
            else toast.error('You are offline');
          });
        });
        cleanups.push(() => netSub.remove());
      } catch {
        /* network plugin optional */
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
      cleanups = [];
    };
  }, [router]);

  return null;
}
