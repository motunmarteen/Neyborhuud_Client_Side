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
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {});
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
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);

      if (perm !== 'granted') {
        setIsRegistering(false);
        return false;
      }

      // 2. Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Check if already subscribed
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
          setError('Push notifications are not configured.');
          setIsRegistering(false);
          return false;
        }

        // 4. Subscribe
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
        });
      }

      // 5. Send subscription to backend
      await apiClient.post('/mobile/push/subscribe', { subscription: sub.toJSON() });

      setIsSubscribed(true);
      setIsRegistering(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Subscription failed:', err);
      setError(err?.message ?? 'Failed to enable push notifications');
      setIsRegistering(false);
      return false;
    }
  };

  return { permission, isSubscribed, isRegistering, error, requestPermissionAndSubscribe };
}
