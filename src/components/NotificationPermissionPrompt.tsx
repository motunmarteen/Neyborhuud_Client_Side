'use client';

/**
 * NotificationPermissionPrompt
 *
 * A FULL-SCREEN blocking modal that appears immediately after login and requires
 * the user to either enable push notifications or explicitly decline.
 *
 * Browser security REQUIRES a user gesture to call Notification.requestPermission(),
 * so we cannot silently enable notifications for everyone — but we make it
 * impossible to miss and very hard to skip.
 *
 * Strategy:
 * - Appears immediately (no delay) once the user is logged in
 * - Full-screen overlay — user must interact with it
 * - Tapping "Enable" calls requestPermissionAndSubscribe()
 * - Tapping "Skip for now" dismisses for 3 days (not 7 — safety app urgency)
 * - If browser permission was already denied, shows instructions to re-enable
 * - Does NOT show again once subscribed
 */

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const SNOOZE_KEY = 'nh_push_prompt_snoozed_until';
const SNOOZE_DAYS = 3; // Re-prompt every 3 days since it's a safety app

export default function NotificationPermissionPrompt() {
  const { permission, isSubscribed, isRegistering, requestPermissionAndSubscribe } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already subscribed — never show
    if (isSubscribed) return;
    // Browser denied — show the "how to fix" variant immediately
    if (permission === 'denied') { setVisible(true); return; }
    // Not supported (e.g. non-PWA desktop) — skip
    if (permission === 'unsupported') return;

    // Check snooze
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    // Show immediately — no delay for a safety app
    setVisible(true);
  }, [isSubscribed, permission]);

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

  // ── DENIED STATE ─────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-500 text-[26px]">notifications_off</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Notifications are blocked</p>
              <p className="text-sm text-gray-500">You won't receive SOS and safety alerts</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            To receive life-saving safety alerts, open your browser settings, find
            NeyborHuud, and change <strong>Notifications</strong> to <strong>Allow</strong>.
          </p>
          <button
            onClick={handleSnooze}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            I'll do it later
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT STATE ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-white pb-8 pt-6 px-6 shadow-2xl">
        {/* Pull bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[44px]">emergency</span>
          </div>
        </div>

        {/* Title & description */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Enable Safety Notifications
        </h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-2">
          NeyborHuud is a <strong className="text-gray-700">community safety app</strong>.
          Push notifications are critical — you'll receive:
        </p>

        {/* Feature list */}
        <ul className="text-sm text-gray-600 space-y-2 mb-6 mt-4">
          {[
            { icon: 'sos', label: 'Instant SOS alerts from neighbours', color: 'text-red-500' },
            { icon: 'location_on', label: 'Geofence & safety zone alerts', color: 'text-orange-500' },
            { icon: 'route', label: 'Trip monitoring & overdue alerts', color: 'text-yellow-600' },
            { icon: 'chat', label: 'Messages & community updates', color: 'text-blue-500' },
          ].map(({ icon, label, color }) => (
            <li key={icon} className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${color} text-[20px]`}>{icon}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <button
          onClick={handleEnable}
          disabled={isRegistering}
          className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors mb-3"
        >
          {isRegistering ? 'Enabling…' : '🔔 Enable Notifications'}
        </button>
        <button
          onClick={handleSnooze}
          className="w-full rounded-2xl py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now (not recommended)
        </button>
      </div>
    </div>
  );
}
