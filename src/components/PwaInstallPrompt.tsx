'use client';

/**
 * Bottom sheet prompting first-time mobile visitors to install neyborhuud as a PWA.
 * Hidden when already running as installed app, after install, or while snoozed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { APP_ICON_192 } from '@/lib/brand-assets';
import {
    isPwaInstalled,
    markPwaInstalled,
    shouldOfferPwaInstall,
    snoozePwaInstallPrompt,
} from '@/lib/pwa-install';

const SHOW_DELAY_MS = 2800;

/** Entry routes where install makes sense for new visitors. */
const INSTALL_ROUTES = ['/', '/feed', '/explore', '/login', '/signup'];

function isInstallRoute(pathname: string): boolean {
    return INSTALL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function PwaInstallPrompt() {
    const pathname = usePathname();
    const { canNativeInstall, iosDevice, install } = usePwaInstall();
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPwaInstalled()) markPwaInstalled();
    }, []);

    useEffect(() => {
        if (!isInstallRoute(pathname)) return;
        if (!shouldOfferPwaInstall()) return;

        // Android: wait for native install prompt when possible; iOS always eligible.
        if (!iosDevice && !canNativeInstall) return;

        const timer = window.setTimeout(() => {
            if (isPwaInstalled() || !shouldOfferPwaInstall()) return;
            setVisible(true);
        }, SHOW_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [pathname, canNativeInstall, iosDevice]);

    const dismiss = useCallback(() => {
        setVisible(false);
        snoozePwaInstallPrompt();
    }, []);

    const handleInstall = useCallback(async () => {
        if (iosDevice) {
            dismiss();
            return;
        }
        setInstalling(true);
        try {
            const accepted = await install();
            setVisible(false);
            if (!accepted) snoozePwaInstallPrompt(7);
        } finally {
            setInstalling(false);
        }
    }, [dismiss, install, iosDevice]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/65 backdrop-blur-sm">
            <div
                ref={sheetRef}
                className="w-full max-w-lg rounded-t-3xl bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
                role="dialog"
                aria-labelledby="pwa-install-title"
                aria-modal="true"
            >
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-brand-surface" />

                <div className="mb-5 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#060908] shadow-[0_12px_40px_rgba(0,212,49,0.25)]">
                        <Image
                            src={APP_ICON_192}
                            alt=""
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <h2 id="pwa-install-title" className="text-xl font-bold text-[var(--neu-text-muted)]">
                        Install neyborhuud
                    </h2>
                    <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-[var(--neu-text-secondary)]">
                        Add the app to your home screen for faster access, safety alerts, and a full-screen
                        Huud experience.
                    </p>
                </div>

                {iosDevice ? (
                    <ol className="mb-6 space-y-2 text-left text-sm text-[var(--neu-text-secondary)]">
                        <li className="flex gap-3">
                            <span className="font-bold text-primary">1.</span>
                            <span>
                                Tap <strong>Share</strong>{' '}
                                <span className="inline-block align-middle text-base" aria-hidden>
                                    ⎙
                                </span>{' '}
                                in Safari&apos;s toolbar
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary">2.</span>
                            <span>
                                Choose <strong>Add to Home Screen</strong>
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary">3.</span>
                            <span>
                                Tap <strong>Add</strong> — open neyborhuud from your home screen
                            </span>
                        </li>
                    </ol>
                ) : (
                    <ul className="mb-6 space-y-2 text-sm text-[var(--neu-text-secondary)]">
                        {[
                            'Opens full-screen like a native app',
                            'Faster launch from your home screen',
                            'Safety alerts even when the browser is closed',
                        ].map((line) => (
                            <li key={line} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                                {line}
                            </li>
                        ))}
                    </ul>
                )}

                {!iosDevice ? (
                    <button
                        type="button"
                        onClick={handleInstall}
                        disabled={installing || !canNativeInstall}
                        className="landing-btn-primary mb-3 flex h-[52px] w-full items-center justify-center text-sm font-bold transition-transform disabled:opacity-60"
                    >
                        {installing ? 'Installing…' : 'Install app'}
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={dismiss}
                    className="w-full rounded-2xl py-3 text-sm font-medium text-[var(--neu-text-muted)] transition-colors hover:text-[var(--neu-text-secondary)]"
                >
                    {iosDevice ? 'Got it' : 'Not now'}
                </button>
            </div>
        </div>
    );
}
