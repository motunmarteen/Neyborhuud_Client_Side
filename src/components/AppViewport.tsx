'use client';

import { useEffect } from 'react';
import { isPwaInstalled } from '@/lib/pwa-install';

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
