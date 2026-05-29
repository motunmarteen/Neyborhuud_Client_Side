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
            const vh = window.visualViewport?.height ?? window.innerHeight;
            root.style.setProperty('--app-height', `${Math.round(vh)}px`);
        };

        const syncStandalone = () => {
            root.toggleAttribute('data-standalone', isPwaInstalled());
        };

        syncHeight();
        syncStandalone();

        // Drop stale SW + reload once when brand UI changes (fixes installed PWA showing old CTAs).
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const prev = localStorage.getItem(BRAND_UI_VERSION_KEY);
            const next = String(BRAND_UI_VERSION);
            if (prev !== next) {
                localStorage.setItem(BRAND_UI_VERSION_KEY, next);
                void navigator.serviceWorker.getRegistrations().then((regs) => {
                    const hadSw = regs.length > 0;
                    regs.forEach((reg) => void reg.unregister());
                    if (prev != null || hadSw) {
                        window.location.reload();
                    }
                });
            } else if (process.env.NODE_ENV === 'development') {
                void navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((reg) => void reg.unregister());
                });
            }
        }

        window.addEventListener('resize', syncHeight);
        window.addEventListener('orientationchange', syncHeight);
        window.visualViewport?.addEventListener('resize', syncHeight);
        window.matchMedia('(display-mode: standalone)').addEventListener('change', syncStandalone);

        return () => {
            window.removeEventListener('resize', syncHeight);
            window.removeEventListener('orientationchange', syncHeight);
            window.visualViewport?.removeEventListener('resize', syncHeight);
        };
    }, []);

    return null;
}
