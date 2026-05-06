'use client';

/**
 * NotificationPermissionPrompt
 *
 * A dismissible bottom banner that asks users to enable push notifications.
 * Shows after a 10-second delay once the user is authenticated.
 * Respects a 7-day "snoozed" localStorage flag so it's not annoying.
 * Disappears permanently once the user subscribes.
 */

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const SNOOZE_KEY = 'nh_push_prompt_snoozed_until';
const SNOOZE_DAYS = 7;

export default function NotificationPermissionPrompt() {
  const { permission, isSubscribed, isRegistering, requestPermissionAndSubscribe } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already subscribed, denied, or unsupported
    if (isSubscribed || permission === 'denied' || permission === 'unsupported') return;

    // Don't show if snoozed
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    // Show after 10 seconds
    const timer = setTimeout(() => setVisible(true), 10_000);
    return () => clearTimeout(timer);
  }, [isSubscribed, permission]);

  // Hide once subscribed
  useEffect(() => {
    if (isSubscribed) setVisible(false);
  }, [isSubscribed]);

  function handleEnable() {
    requestPermissionAndSubscribe().then((granted) => {
      if (granted) setVisible(false);
    });
  }

  function handleSnooze() {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    setVisible(false);
  }

  if (!visible) return null;

  // Special message for denied state
  if (permission === 'denied') {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-red-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-[22px] mt-0.5">
            notifications_off
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">Notifications blocked</p>
            <p className="text-xs text-red-600 mt-0.5">
              To receive safety alerts, go to your browser settings and allow notifications for
              NeyborHuud.
            </p>
          </div>
          <button
            onClick={handleSnooze}
            className="shrink-0 text-red-400 hover:text-red-600"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-white p-4 shadow-xl border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 text-[22px]">
            notifications_active
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Stay safe — enable notifications</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Get instant SOS alerts, safety updates, and messages from your community, even when
            the app is in the background.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isRegistering}
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isRegistering ? 'Enabling…' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleSnooze}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
