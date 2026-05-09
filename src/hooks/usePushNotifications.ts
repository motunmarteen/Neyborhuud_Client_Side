'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';

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

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isRegistering: boolean;
  error: string | null;
  requestPermissionAndSubscribe: () => Promise<boolean>;
}

/**
 * usePushNotifications
 *
 * Handles the full Web Push subscription flow:
 *   1. Request Notification permission
 *   2. Subscribe via service worker pushManager using VAPID public key
 *   3. POST subscription object to POST /api/v1/mobile/push/subscribe
 *
 * Usage:
 *   const { permission, isSubscribed, requestPermissionAndSubscribe } = usePushNotifications();
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  // On mount, check current state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      const timer = window.setTimeout(() => setPermission('unsupported'), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setPermission(Notification.permission as PushPermissionState), 0);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {});

    return () => window.clearTimeout(timer);
  }, []);

  const requestPermissionAndSubscribe = async (): Promise<boolean> => {
    if (attemptedRef.current) return isSubscribed;
    attemptedRef.current = true;

    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return false;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // 1. Request permission
      const perm = await withTimeout(Notification.requestPermission(), 15_000, 'Notification permission');
      setPermission(perm as PushPermissionState);

      if (perm !== 'granted') {
        setIsRegistering(false);
        return false;
      }

      // 2. Get service worker registration
      const registration = await withTimeout(navigator.serviceWorker.ready, 12_000, 'Service worker readiness');

      // 3. Check if already subscribed
      let sub = await withTimeout(registration.pushManager.getSubscription(), 8_000, 'Push subscription lookup');
      if (!sub) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          setError('Push notifications are not configured.');
          setIsRegistering(false);
          return false;
        }

        // 4. Subscribe
        sub = await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
          }),
          12_000,
          'Push subscription',
        );
      }

      // 5. Send subscription to backend
      await withTimeout(
        apiClient.post('/mobile/push/subscribe', { subscription: sub.toJSON() }),
        10_000,
        'Push subscription sync',
      );

      setIsSubscribed(true);
      setIsRegistering(false);
      return true;
    } catch (err: unknown) {
      console.error('[Push] Subscription failed:', err);
      setError(getErrorText(err));
      attemptedRef.current = false;
      setIsRegistering(false);
      return false;
    }
  };

  return { permission, isSubscribed, isRegistering, error, requestPermissionAndSubscribe };
}
