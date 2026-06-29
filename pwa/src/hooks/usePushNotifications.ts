'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';

const SYNCED_KEY = 'nh_push_backend_synced';
const PERMISSION_ACK_KEY = 'nh_push_permission_ack';

/**
 * Convert a URL-safe base64 VAPID public key to Uint8Array
 * (required by pushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timer));
  });
}

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to enable push notifications';
}

function readBrowserPermission(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermissionState;
}

async function serviceWorkerReady(timeoutMs = 4_000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await withTimeout(navigator.serviceWorker.ready, timeoutMs, 'Service worker readiness');
  } catch {
    return null;
  }
}

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  /** Browser push subscription exists OR permission granted + acknowledged */
  isSubscribed: boolean;
  isRegistering: boolean;
  error: string | null;
  requestPermissionAndSubscribe: () => Promise<boolean>;
  syncSubscription: () => Promise<boolean>;
}

/**
 * Full Web Push flow: permission → SW subscription → backend sync.
 * In local dev, next-pwa disables the service worker — we still treat
 * browser permission as sufficient so the prompt does not loop.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const refreshSubscribedState = useCallback(async () => {
    const perm = readBrowserPermission();
    setPermission(perm);

    if (perm === 'unsupported') {
      setIsSubscribed(false);
      return;
    }

    if (perm === 'granted') {
      try {
        localStorage.setItem(PERMISSION_ACK_KEY, '1');
      } catch {
        // ignore
      }
    }

    let hasPushSubscription = false;
    const registration = await serviceWorkerReady();
    if (registration) {
      try {
        const sub = await registration.pushManager.getSubscription();
        hasPushSubscription = !!sub;
      } catch {
        hasPushSubscription = false;
      }
    }

    let backendSynced = false;
    try {
      backendSynced = localStorage.getItem(SYNCED_KEY) === '1';
    } catch {
      backendSynced = false;
    }

    const permissionAcknowledged =
      perm === 'granted' &&
      (() => {
        try {
          return localStorage.getItem(PERMISSION_ACK_KEY) === '1';
        } catch {
          return true;
        }
      })();

    // Hide prompt when: push subscription exists, backend synced, or user granted permission
    // (dev localhost has no SW — permission alone is enough)
    setIsSubscribed(
      hasPushSubscription || backendSynced || (permissionAcknowledged && perm === 'granted'),
    );
  }, []);

  useEffect(() => {
    void refreshSubscribedState();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshSubscribedState();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshSubscribedState]);

  const syncSubscription = useCallback(async (): Promise<boolean> => {
    if (syncingRef.current) return false;
    if (!apiClient.isAuthenticated()) return false;

    const perm = readBrowserPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    syncingRef.current = true;
    setIsRegistering(true);
    setError(null);

    try {
      const registration = await serviceWorkerReady();
      if (!registration) {
        try {
          localStorage.setItem(PERMISSION_ACK_KEY, '1');
        } catch {
          // ignore
        }
        setIsSubscribed(true);
        return true;
      }

      let sub = await withTimeout(
        registration.pushManager.getSubscription(),
        8_000,
        'Push subscription lookup',
      );

      if (!sub) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          setError('Push notifications are not configured.');
          try {
            localStorage.setItem(PERMISSION_ACK_KEY, '1');
          } catch {
            // ignore
          }
          setIsSubscribed(true);
          return true;
        }

        sub = await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
          }),
          12_000,
          'Push subscription',
        );
      }

      await withTimeout(
        apiClient.post('/mobile/push/subscribe', { subscription: sub.toJSON() }),
        10_000,
        'Push subscription sync',
      );

      try {
        localStorage.setItem(SYNCED_KEY, '1');
        localStorage.setItem(PERMISSION_ACK_KEY, '1');
      } catch {
        // ignore
      }

      setIsSubscribed(true);
      return true;
    } catch (err: unknown) {
      console.error('[Push] Subscription failed:', err);
      setError(getErrorText(err));
      if (readBrowserPermission() === 'granted') {
        try {
          localStorage.setItem(PERMISSION_ACK_KEY, '1');
        } catch {
          // ignore
        }
        setIsSubscribed(true);
      }
      return false;
    } finally {
      syncingRef.current = false;
      setIsRegistering(false);
    }
  }, []);

  // Silent sync when user is already logged in with granted permission
  useEffect(() => {
    if (!apiClient.isAuthenticated()) return;
    if (readBrowserPermission() !== 'granted') return;
    void syncSubscription();
  }, [syncSubscription]);

  const requestPermissionAndSubscribe = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const perm = await withTimeout(
        Notification.requestPermission(),
        15_000,
        'Notification permission',
      );
      setPermission(perm as PushPermissionState);

      if (perm !== 'granted') {
        setIsRegistering(false);
        return false;
      }

      return await syncSubscription();
    } catch (err: unknown) {
      console.error('[Push] Permission request failed:', err);
      setError(getErrorText(err));
      setIsRegistering(false);
      return false;
    }
  };

  return {
    permission,
    isSubscribed,
    isRegistering,
    error,
    requestPermissionAndSubscribe,
    syncSubscription,
  };
}
