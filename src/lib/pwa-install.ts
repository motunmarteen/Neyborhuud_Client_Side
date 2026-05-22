import { hasCompletedProductTour } from '@/lib/onboarding';

/** Persists across browser sessions on this device. */
export const PWA_INSTALL_STATE_KEY = 'neyborhuud_pwa_install_state';
export const PWA_INSTALL_SNOOZE_KEY = 'neyborhuud_pwa_install_snooze_until';
export const PWA_INSTALL_FEED_VISITS_KEY = 'neyborhuud_pwa_feed_visits';
export const PWA_INSTALL_SESSIONS_KEY = 'neyborhuud_pwa_sessions';
export const PWA_INSTALL_SESSION_FLAG = 'neyborhuud_pwa_session_recorded';

export type PwaInstallState = 'installed' | 'dismissed';

const SNOOZE_DAYS = 14;
const REOFFER_MIN_SESSIONS = 2;

export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return (
        /Android|iPhone|iPad|iPod/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

export function isIosDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

export function isAndroidDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
}

/** Safari on iOS — only browser that supports Add to Home Screen. */
export function isIosSafari(): boolean {
    if (!isIosDevice()) return false;
    const ua = navigator.userAgent;
    const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
    return !isOtherBrowser && /Safari/i.test(ua);
}

export function isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /FBAN|FBAV|Instagram|Twitter|Line\//i.test(ua);
}

/** Running inside the installed PWA (home-screen app). */
export function isPwaInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    const nav = navigator as Navigator & { standalone?: boolean };
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        nav.standalone === true
    );
}

export function getPwaInstallState(): PwaInstallState | null {
    try {
        const raw = localStorage.getItem(PWA_INSTALL_STATE_KEY);
        if (raw === 'installed' || raw === 'dismissed') return raw;
    } catch {
        /* private mode */
    }
    return null;
}

export function markPwaInstalled(): void {
    try {
        localStorage.setItem(PWA_INSTALL_STATE_KEY, 'installed');
        localStorage.removeItem(PWA_INSTALL_SNOOZE_KEY);
    } catch {
        /* ignore */
    }
}

export function snoozePwaInstallPrompt(days = SNOOZE_DAYS): void {
    try {
        localStorage.setItem(PWA_INSTALL_STATE_KEY, 'dismissed');
        localStorage.setItem(PWA_INSTALL_SNOOZE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
    } catch {
        /* ignore */
    }
}

export function isPwaInstallSnoozed(): boolean {
    try {
        const until = localStorage.getItem(PWA_INSTALL_SNOOZE_KEY);
        if (until && Date.now() < Number(until)) return true;
        if (getPwaInstallState() === 'dismissed' && !until) return true;
    } catch {
        /* ignore */
    }
    return false;
}

/** Count distinct app sessions (once per tab lifetime). */
export function recordPwaSession(): void {
    try {
        if (sessionStorage.getItem(PWA_INSTALL_SESSION_FLAG) === '1') return;
        sessionStorage.setItem(PWA_INSTALL_SESSION_FLAG, '1');
        const count = Number(localStorage.getItem(PWA_INSTALL_SESSIONS_KEY) || '0') + 1;
        localStorage.setItem(PWA_INSTALL_SESSIONS_KEY, String(count));
    } catch {
        /* ignore */
    }
}

export function getPwaSessionCount(): number {
    try {
        return Number(localStorage.getItem(PWA_INSTALL_SESSIONS_KEY) || '0');
    } catch {
        return 0;
    }
}

/** Authenticated feed visits — signals the user has seen product value. */
export function recordAuthenticatedFeedVisit(): void {
    try {
        const count = Number(localStorage.getItem(PWA_INSTALL_FEED_VISITS_KEY) || '0') + 1;
        localStorage.setItem(PWA_INSTALL_FEED_VISITS_KEY, String(count));
    } catch {
        /* ignore */
    }
}

export function getAuthenticatedFeedVisitCount(): number {
    try {
        return Number(localStorage.getItem(PWA_INSTALL_FEED_VISITS_KEY) || '0');
    } catch {
        return 0;
    }
}

/** User has completed onboarding or loaded the feed while signed in. */
export function hasPwaInstallIntent(): boolean {
    return hasCompletedProductTour() || getAuthenticatedFeedVisitCount() >= 1;
}

function isEligibleDeviceAndInstallState(): boolean {
    if (!isMobileDevice()) return false;
    if (isPwaInstalled()) return false;
    if (getPwaInstallState() === 'installed') return false;
    return true;
}

/**
 * When to show the install sheet:
 * - Mobile, not installed
 * - Signed-in user on /feed only (not landing, login, signup)
 * - After onboarding complete OR at least one authenticated feed visit
 * - Not during snooze; re-offer after snooze only on 2+ sessions
 */
export function canShowPwaInstallPrompt(pathname: string, isAuthenticated: boolean): boolean {
    if (!isEligibleDeviceAndInstallState()) return false;
    if (!isAuthenticated) return false;
    if (pathname !== '/feed') return false;
    if (!hasPwaInstallIntent()) return false;
    if (isPwaInstallSnoozed()) return false;
    if (getPwaInstallState() === 'dismissed' && getPwaSessionCount() < REOFFER_MIN_SESSIONS) {
        return false;
    }
    return true;
}

/** @deprecated Use canShowPwaInstallPrompt for gating; kept for simple checks. */
export function shouldOfferPwaInstall(): boolean {
    if (!isEligibleDeviceAndInstallState()) return false;
    if (isPwaInstallSnoozed()) return false;
    return true;
}
