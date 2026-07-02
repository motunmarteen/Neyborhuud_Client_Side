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
