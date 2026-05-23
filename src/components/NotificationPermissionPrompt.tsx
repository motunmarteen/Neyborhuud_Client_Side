'use client';

/**
 * NotificationPermissionPrompt
 *
 * A bottom-sheet modal that appears after the user has logged in and
 * prompts them to enable push notifications.
 *
 * Rules:
 * - NEVER shown on auth / onboarding routes (/, /welcome, /login, /signup, etc.)
 * - NEVER shown to unauthenticated users
 * - NEVER shown while a subscription attempt is already in progress
 * - NEVER shown again once already subscribed
 * - Dismissible by tapping "Skip", tapping "Enable", or dragging the sheet down
 * - Re-prompts after SNOOZE_DAYS if the user skipped
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import apiClient from '@/lib/api-client';
import { isAccountSetupIncomplete, isOnboardingOrAuthRoute } from '@/lib/appShellGates';

const SNOOZE_KEY = 'nh_push_prompt_snoozed_until';
const SNOOZE_DAYS = 3;

function snoozePrompt(days = SNOOZE_DAYS) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  } catch {
    // Storage can fail in private/restricted contexts; the prompt should still dismiss.
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
  const [visible, setVisible] = useState(false);
  // Track whether we've started a registration so the effect won't re-show mid-flow
  const isRegisteringRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isRegisteringRef.current = isRegistering;
  }, [isRegistering]);

  useEffect(() => {
    // Never show on excluded routes or during incomplete account setup
    if (isExcludedRoute(pathname)) return;
    if (isAccountSetupIncomplete()) return;
    // Never show to unauthenticated users
    if (!apiClient.isAuthenticated()) return;
    // Already subscribed or browser permission granted — never show
    if (isSubscribed || permission === 'granted') return;
    // Don't re-show the sheet while a subscription attempt is in progress
    if (isRegisteringRef.current) return;
    // Browser denied — show the "how to fix" variant immediately
    if (permission === 'denied') {
      setVisible(true);
      return;
    }
    // Not supported (e.g. non-PWA desktop) — skip
    if (permission === 'unsupported') return;

    // Check snooze
    try {
      const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
      if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;
    } catch {
      // ignore
    }

    setVisible(true);
  }, [pathname, isSubscribed, permission]);

  const handleEnable = useCallback(() => {
    setVisible(false);
    isRegisteringRef.current = true;
    requestPermissionAndSubscribe().then((granted) => {
      isRegisteringRef.current = false;
      if (!granted) snoozePrompt(1);
    });
  }, [requestPermissionAndSubscribe]);

  const handleSnooze = useCallback(() => {
    setVisible(false);
    snoozePrompt();
  }, []);

  // ── Drag-to-dismiss ────────────────────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return; // only allow downward drag
    dragCurrentY.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease';
      if (dragCurrentY.current > 120) {
        // Dragged far enough — dismiss
        sheetRef.current.style.transform = `translateY(100%)`;
        setTimeout(() => {
          handleSnooze();
          if (sheetRef.current) sheetRef.current.style.transform = '';
        }, 300);
      } else {
        // Snap back
        sheetRef.current.style.transform = '';
      }
    }
    dragStartY.current = null;
    dragCurrentY.current = 0;
  }, [handleSnooze]);

  if (!visible || isExcludedRoute(pathname) || isSubscribed || permission === 'granted') return null;

  // ── DENIED STATE ─────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div
          ref={sheetRef}
          className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Pull bar */}
          <div className="w-10 h-1 rounded-full bg-brand-surface mx-auto mb-5 cursor-grab" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-brand-red text-[26px]">notifications_off</span>
            </div>
            <div>
              <p className="font-bold text-[var(--neu-text-muted)]">Notifications are blocked</p>
              <p className="text-sm text-[var(--neu-text-muted)]">You won&apos;t receive SOS and safety alerts</p>
            </div>
          </div>
          <p className="text-sm text-[var(--neu-text-secondary)] mb-5 leading-relaxed">
            To receive life-saving safety alerts, open your browser settings, find
            NeyborHuud, and change <strong>Notifications</strong> to <strong>Allow</strong>.
          </p>
          <button
            onClick={handleSnooze}
            className="w-full rounded-xl border border-black/[0.08] py-3 text-sm font-medium text-[var(--neu-text-secondary)] hover:bg-brand-surface transition-colors"
          >
            I&apos;ll do it later
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT STATE ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={sheetRef}
        className="w-full max-w-lg rounded-t-3xl bg-white pb-8 pt-4 px-6 shadow-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull bar — visual affordance for drag-to-dismiss */}
        <div className="w-10 h-1 rounded-full bg-brand-surface mx-auto mb-6 cursor-grab" />

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[44px]">emergency</span>
          </div>
        </div>

        {/* Title & description */}
        <h2 className="text-xl font-bold text-[var(--neu-text-muted)] text-center mb-2">
          Enable Safety Notifications
        </h2>
        <p className="text-sm text-[var(--neu-text-muted)] text-center leading-relaxed mb-2">
          NeyborHuud is a <strong className="text-[var(--neu-text-muted)]">community safety app</strong>.
          Push notifications are critical — you&apos;ll receive:
        </p>

        {/* Feature list */}
        <ul className="text-sm text-[var(--neu-text-secondary)] space-y-2 mb-6 mt-4">
          {[
            { icon: 'sos', label: 'Instant SOS alerts from neighbours', color: 'text-brand-red' },
            { icon: 'location_on', label: 'Geofence & safety zone alerts', color: 'text-brand-red' },
            { icon: 'route', label: 'Trip monitoring & overdue alerts', color: 'text-primary600' },
            { icon: 'chat', label: 'Messages & community updates', color: 'text-brand-blue' },
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
          className="w-full rounded-2xl py-3 text-sm text-[var(--neu-text-muted)] hover:text-[var(--neu-text-secondary)] transition-colors"
        >
          Skip for now (not recommended)
        </button>
      </div>
    </div>
  );
}
