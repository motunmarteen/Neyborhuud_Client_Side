'use client';

/**
 * Branded install sheet — shown after value moments (post-onboarding / feed).
 * iOS: Safari Add to Home Screen steps. Android: native beforeinstallprompt.
 */

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { useAuth } from '@/hooks/useAuth';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
    canShowPwaInstallPrompt,
    isAndroidDevice,
    isInAppBrowser,
    isIosSafari,
    isPwaInstalled,
    markPwaInstalled,
    snoozePwaInstallPrompt,
} from '@/lib/pwa-install';

/** Wait until user has scanned the feed after login/onboarding. */
const SHOW_DELAY_MS = 6000;
const ANDROID_MANUAL_DELAY_MS = 9000;
const SESSION_KEY = 'neyborhuud_pwa_install_session';

function useLightInstallSheet(): boolean {
    const [light, setLight] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const sync = () => setLight(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return light;
}

const IOS_STEPS = [
    {
        num: 1,
        title: 'Tap Share',
        body: 'Use the Share button in Safari’s bottom bar',
        icon: 'ios_share',
    },
    {
        num: 2,
        title: 'Add to Home Screen',
        body: 'Scroll the menu and choose this option',
        icon: 'add_box',
    },
    {
        num: 3,
        title: 'Tap Add',
        body: 'Open neyborhuud from your home screen',
        icon: 'home',
    },
] as const;

const ANDROID_MANUAL_STEPS = [
    {
        num: 1,
        title: 'Open the menu',
        body: 'Tap the three dots in Chrome’s top bar',
        icon: 'more_vert',
    },
    {
        num: 2,
        title: 'Install app',
        body: 'Choose Install app or Add to Home screen',
        icon: 'download',
    },
] as const;

const ANDROID_BENEFITS = [
    'Full-screen app — no browser bars',
    'Faster launch from your home screen',
    'Safety alerts when the browser is closed',
] as const;

export default function PwaInstallPrompt() {
    const pathname = usePathname();
    const { user } = useAuth();
    const isAuthenticated = Boolean(user?.id);
    const { canNativeInstall, iosDevice, install } = usePwaInstall();
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [androidManual, setAndroidManual] = useState(false);
    const iosSafari = iosDevice && isIosSafari();
    const androidDevice = isAndroidDevice();
    const inAppBrowser = isInAppBrowser();
    const lightSheet = useLightInstallSheet();

    useEffect(() => {
        if (isPwaInstalled()) markPwaInstalled();
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (isPwaInstalled()) {
                markPwaInstalled();
                setVisible(false);
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    useEffect(() => {
        if (!canShowPwaInstallPrompt(pathname, isAuthenticated)) return;

        try {
            if (sessionStorage.getItem(SESSION_KEY) === '1') return;
        } catch {
            /* ignore */
        }

        const delay =
            androidDevice && !iosDevice && !canNativeInstall
                ? ANDROID_MANUAL_DELAY_MS
                : SHOW_DELAY_MS;

        if (!iosDevice && !canNativeInstall && !androidDevice) return;

        const timer = window.setTimeout(() => {
            if (!canShowPwaInstallPrompt(pathname, isAuthenticated)) return;
            if (isPwaInstalled()) return;
            try {
                sessionStorage.setItem(SESSION_KEY, '1');
            } catch {
                /* ignore */
            }
            setAndroidManual(androidDevice && !canNativeInstall);
            setVisible(true);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [pathname, canNativeInstall, iosDevice, androidDevice, isAuthenticated]);

    const dismiss = useCallback((mode: 'session' | 'snooze' = 'snooze') => {
        setVisible(false);
        if (mode === 'session') return;
        snoozePwaInstallPrompt(7);
    }, []);

    const handleAndroidInstall = useCallback(async () => {
        setInstalling(true);
        try {
            const accepted = await install();
            setVisible(false);
            if (!accepted) snoozePwaInstallPrompt(3);
        } finally {
            setInstalling(false);
        }
    }, [install]);

    if (!visible) return null;

    const showIosSteps = iosDevice && !inAppBrowser;
    const showAndroidManual = androidDevice && !iosDevice && androidManual;

    return (
        <div
            className={`pwa-install-overlay fixed inset-0 z-[9998] flex items-end justify-center${lightSheet ? ' pwa-install-overlay--light' : ''}`}
            role="presentation"
        >
            <div
                className={`pwa-install-sheet relative flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col rounded-t-[1.75rem] pt-5${lightSheet ? ' pwa-install-sheet--light' : ''}`}
                role="dialog"
                aria-labelledby="pwa-install-title"
                aria-modal="true"
            >
                <div className="pwa-install-handle mx-auto mb-4 h-1 w-10 shrink-0 rounded-full" />

                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
                    <div className="mb-5 flex flex-col items-center text-center">
                        <NeyborHuudLogo
                            layout="mark"
                            size="md"
                            tone={lightSheet ? 'dark' : 'hero'}
                        />
                        <h2
                            id="pwa-install-title"
                            className="pwa-install-title brand-wordmark mt-3 text-[1.35rem]"
                        >
                            install neyborhuud
                        </h2>
                        <p className="pwa-install-body mt-2 max-w-[19rem] text-sm leading-relaxed">
                            Get the full-screen Huud experience — safety alerts, faster access, and
                            a native app feel on your phone.
                        </p>
                    </div>

                    {inAppBrowser ? (
                        <div className="pwa-install-callout-warn mb-5 rounded-2xl px-4 py-3 text-sm leading-relaxed">
                            Open this page in <strong>Safari</strong> (tap the browser menu → Open
                            in Safari) to add neyborhuud to your home screen.
                        </div>
                    ) : null}

                    {showIosSteps ? (
                        <div className="mb-5 space-y-2.5">
                            {!iosSafari ? (
                                <div className="pwa-install-callout mb-3 rounded-2xl px-4 py-3 text-sm">
                                    For install, open{' '}
                                    <strong>app.neyborhuud.com</strong> in <strong>Safari</strong>.
                                </div>
                            ) : null}
                            {IOS_STEPS.map((step) => (
                                <div key={step.num} className="pwa-install-step">
                                    <span className="pwa-install-step-num">{step.num}</span>
                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[20px] text-[#00D431]">
                                                {step.icon}
                                            </span>
                                            <p className="pwa-install-step-title text-sm font-bold">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="pwa-install-step-body mt-0.5 text-xs leading-relaxed">
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : showAndroidManual ? (
                        <div className="mb-5 space-y-2.5">
                            {ANDROID_MANUAL_STEPS.map((step) => (
                                <div key={step.num} className="pwa-install-step">
                                    <span className="pwa-install-step-num">{step.num}</span>
                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[20px] text-[#00D431]">
                                                {step.icon}
                                            </span>
                                            <p className="pwa-install-step-title text-sm font-bold">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="pwa-install-step-body mt-0.5 text-xs leading-relaxed">
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !iosDevice ? (
                        <ul className="mb-5 space-y-2.5">
                            {ANDROID_BENEFITS.map((line) => (
                                <li key={line} className="pwa-install-benefit">
                                    <span className="material-symbols-outlined text-[18px] text-[#00D431]">
                                        check_circle
                                    </span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <div className="pwa-install-footer shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                    {!iosDevice && canNativeInstall ? (
                        <button
                            type="button"
                            onClick={handleAndroidInstall}
                            disabled={installing}
                            className="landing-btn-primary mb-3 flex h-[52px] w-full items-center justify-center text-sm font-bold transition-transform disabled:opacity-50"
                        >
                            {installing ? 'Installing…' : 'Install app'}
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => dismiss(iosSafari || showAndroidManual ? 'session' : 'snooze')}
                        className={
                            iosSafari || showAndroidManual
                                ? 'landing-btn-primary flex h-[52px] w-full items-center justify-center text-sm font-bold transition-transform'
                                : 'landing-btn-secondary flex h-[48px] w-full items-center justify-center text-sm font-bold transition-transform'
                        }
                    >
                        {iosSafari ? 'Got it' : showAndroidManual ? 'Got it' : 'Maybe later'}
                    </button>
                </div>
            </div>
        </div>
    );
}
