'use client';

import { useEffect } from 'react';
import { BRAND_UI_VERSION } from '@/lib/brand';
import { isPwaInstalled } from '@/lib/pwa-install';

const BRAND_UI_VERSION_KEY = 'neyborhuud_brand_ui_version';

/** Keeps `--app-height` and install mode in sync for full-screen mobile shell. */
export function AppViewport() {
    useEffect(() => {
        const root = document.documentElement;

        const syncHeight = () => {
            const vv = window.visualViewport;
            const vh = vv?.height ?? window.innerHeight;
            root.style.setProperty('--app-height', `${Math.round(vh)}px`);

            // Safari / mobile browser bottom bar overlaps fixed UI when not in standalone PWA.
            const bottomInset =
                vv != null
                    ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
                    : 0;
            root.style.setProperty('--viewport-bottom-inset', `${bottomInset}px`);
        };

        const syncStandalone = () => {
            root.toggleAttribute('data-standalone', isPwaInstalled());
        };

        syncHeight();
        syncStandalone();

        // Drop stale SW + caches + reload once when brand UI changes (fixes
        // installed PWA showing old CTAs / running old bundle).
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const prev = localStorage.getItem(BRAND_UI_VERSION_KEY);
            const next = String(BRAND_UI_VERSION);
            if (prev !== next) {
                localStorage.setItem(BRAND_UI_VERSION_KEY, next);
                // IMPORTANT: unregistering the SW alone is NOT enough — the old
                // JS chunks live in Cache Storage and would still be served on
                // the very next load. Delete ALL caches too, THEN reload, so the
                // device fetches the fresh bundle from the network.
                void (async () => {
                    const hadSw = (await navigator.serviceWorker.getRegistrations()).length > 0;
                    try {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(regs.map((r) => r.unregister()));
                    } catch { /* best-effort */ }
                    try {
                        if ('caches' in window) {
                            const keys = await caches.keys();
                            await Promise.all(keys.map((k) => caches.delete(k)));
                        }
                    } catch { /* best-effort */ }
                    if (prev != null || hadSw) {
                        // reload(true)-style: bypass bfcache with a fresh navigation.
                        window.location.reload();
                    }
                })();
            } else if (process.env.NODE_ENV === 'development') {
                void navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((reg) => void reg.unregister());
                });
            }

            // Register the service worker ourselves, in production, on EVERY
            // load — not as an `else` of the version check above.
            //
            // Why explicitly: next-pwa is configured with `register: true`, but
            // on this Next 16 / App Router build it does not inject the
            // registration script. /sw.js is served (200) while the HTML has no
            // reference to serviceWorker at all, so nothing ever registered it.
            // No registration means no push subscription, and without that an
            // incoming call cannot ring a closed app — every call became a
            // "missed call" after the ring timeout, with nothing to explain why.
            //
            // Why unconditionally: on a first-ever visit the brand-version
            // branch above runs (prev === null), which unregisters and reloads.
            // Putting registration in its `else` meant a fresh browser never
            // registered at all. register() is idempotent — calling it when a
            // registration already exists is a no-op — so running it every load
            // is both safe and the only version that survives a cold start.
            if (process.env.NODE_ENV === 'production') {
                void navigator.serviceWorker.register('/sw.js').catch((err) => {
                    console.error('[SW] Registration failed — push notifications will not work:', err);
                });
            }
        }

        window.addEventListener('resize', syncHeight);
        window.addEventListener('orientationchange', syncHeight);
        window.visualViewport?.addEventListener('resize', syncHeight);
        window.visualViewport?.addEventListener('scroll', syncHeight);
        window.matchMedia('(display-mode: standalone)').addEventListener('change', syncStandalone);

        return () => {
            window.removeEventListener('resize', syncHeight);
            window.removeEventListener('orientationchange', syncHeight);
            window.visualViewport?.removeEventListener('resize', syncHeight);
            window.visualViewport?.removeEventListener('scroll', syncHeight);
        };
    }, []);

    return null;
}
