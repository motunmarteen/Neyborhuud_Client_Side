'use client';

/**
 * NotificationPermissionPrompt
 *
 * An X/Twitter-style toast pill asking the user to turn on push notifications,
 * replacing the full-screen bottom sheet this used to be. The sheet blocked the
 * whole app behind a backdrop for something the user hadn't asked for; a toast
 * says the same thing without taking the screen hostage.
 *
 * IMPORTANT — why this keeps a button rather than being a plain message:
 * browsers only open the notification permission dialog from a real user
 * gesture. The "Turn on" action is that gesture. An auto-dismissing toast with
 * no button would quietly break push registration entirely.
 *
 * Rules (unchanged from the sheet):
 * - NEVER shown on auth / onboarding routes, or during incomplete setup
 * - NEVER shown to unauthenticated users
 * - NEVER shown while a subscription attempt is in progress
 * - NEVER shown again once subscribed or already granted
 * - Skipping snoozes for SNOOZE_DAYS; a denied permission snoozes far longer,
 *   since only the user can undo that in browser settings
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import apiClient from '@/lib/api-client';
import { isAccountSetupIncomplete, isOnboardingOrAuthRoute } from '@/lib/appShellGates';

const SNOOZE_KEY = 'nh_push_prompt_snoozed_until';
const SNOOZE_DAYS = 3;
/** Denied can only be undone in browser settings, so don't re-nag for a fortnight. */
const DENIED_SNOOZE_DAYS = 14;
const TOAST_ID = 'nh-push-permission';

function snoozePrompt(days = SNOOZE_DAYS) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  } catch {
    // Storage can fail in private/restricted contexts; the prompt should still dismiss.
  }
}

function isSnoozed(): boolean {
  try {
    const until = localStorage.getItem(SNOOZE_KEY);
    return !!until && Date.now() < Number(until);
  } catch {
    return false;
  }
}

// Routes where the notification prompt must NEVER appear — see appShellGates.ts
function isExcludedRoute(pathname: string): boolean {
  return isOnboardingOrAuthRoute(pathname);
}

export default function NotificationPermissionPrompt() {
  const { permission, isSubscribed, isRegistering, requestPermissionAndSubscribe } =
    usePushNotifications();
  const pathname = usePathname();
  const isRegisteringRef = useRef(false);
  // Guards against re-firing the toast on every route change within a session.
  const shownRef = useRef(false);

  useEffect(() => {
    isRegisteringRef.current = isRegistering;
  }, [isRegistering]);

  const handleEnable = useCallback(() => {
    toast.dismiss(TOAST_ID);
    isRegisteringRef.current = true;
    // Called straight from the click handler so the browser still treats this
    // as a user gesture — see the note at the top of this file.
    requestPermissionAndSubscribe().then((granted) => {
      isRegisteringRef.current = false;
      if (granted) {
        toast.success('Safety notifications are on');
      } else {
        snoozePrompt(1);
      }
    });
  }, [requestPermissionAndSubscribe]);

  useEffect(() => {
    if (shownRef.current) return;
    if (isExcludedRoute(pathname)) return;
    if (isAccountSetupIncomplete()) return;
    if (!apiClient.isAuthenticated()) return;
    if (isSubscribed || permission === 'granted') return;
    if (isRegisteringRef.current) return;
    // Not supported (e.g. non-PWA desktop) — nothing to ask for.
    if (permission === 'unsupported') return;
    if (isSnoozed()) return;

    shownRef.current = true;

    if (permission === 'denied') {
      // Nothing we can do in-app; the user has to change it in browser settings.
      // State it once, quietly, then leave them alone for a fortnight.
      toast('Notifications are blocked', {
        id: TOAST_ID,
        description: 'Allow them in your browser settings to get SOS alerts.',
        duration: 7000,
        onDismiss: () => snoozePrompt(DENIED_SNOOZE_DAYS),
        onAutoClose: () => snoozePrompt(DENIED_SNOOZE_DAYS),
      });
      return;
    }

    // Persistent (duration: Infinity) because this needs a deliberate tap — an
    // auto-dismissing toast would make push a coin flip on whether the user
    // happened to be looking. Skipping is one tap and snoozes for 3 days.
    toast('Turn on safety alerts', {
      id: TOAST_ID,
      description: 'SOS alerts, trip check-ins, calls and messages.',
      duration: Infinity,
      action: {
        label: 'Turn on',
        onClick: handleEnable,
      },
      onDismiss: () => snoozePrompt(),
      onAutoClose: () => snoozePrompt(),
    });
  }, [pathname, isSubscribed, permission, handleEnable]);

  // Clear the prompt the moment it stops being relevant (e.g. granted in
  // another tab), so a stale pill can't linger.
  useEffect(() => {
    if (isSubscribed || permission === 'granted') toast.dismiss(TOAST_ID);
  }, [isSubscribed, permission]);

  return null;
}
