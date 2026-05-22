'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';

type AuthFlowPageProps = {
    /** Sheet aria-label */
    ariaLabel: string;
    /** Unique key when sheet content changes (e.g. step) */
    stageKey: string;
    /** Optional label under progress area, e.g. "Verify email" */
    stepLabel?: string;
    /** Back link — top-left in chrome */
    backHref?: string;
    backLabel?: string;
    /** Back button handler (e.g. signup edit details) — takes precedence over backHref */
    onBackClick?: () => void;
    /** Main sheet body */
    children: ReactNode;
    /** Sticky CTAs — safe-area padded footer inside sheet */
    footer?: ReactNode;
    /** Optional link row below footer CTAs */
    footerLink?: ReactNode;
    /** Optional hero card above form fields inside sheet */
    hero?: ReactNode;
    keyboardAware?: boolean;
};

/**
 * Shared auth layout: dark backdrop + wordmark chrome + white bottom sheet (signup-aligned).
 * Use for login, verify-email, forgot/reset password, and post-signup OTP.
 */
export function AuthFlowPage({
    ariaLabel,
    stageKey,
    stepLabel,
    backHref,
    backLabel = 'Back',
    onBackClick,
    children,
    footer,
    footerLink,
    hero,
    keyboardAware = false,
}: AuthFlowPageProps) {
    const chromeRef = useRef<HTMLDivElement>(null);

    const syncChromeHeight = useCallback(() => {
        const chromeH = chromeRef.current?.getBoundingClientRect().height;
        if (chromeH && chromeH > 0) {
            document.documentElement.style.setProperty('--signup-chrome-h', `${Math.ceil(chromeH)}px`);
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-auth', 'signup-map');
        return () => {
            if (document.documentElement.getAttribute('data-auth') === 'signup-map') {
                document.documentElement.removeAttribute('data-auth');
            }
        };
    }, []);

    useEffect(() => {
        syncChromeHeight();
        const el = chromeRef.current;
        if (!el) return;
        const observer = new ResizeObserver(syncChromeHeight);
        observer.observe(el);
        window.addEventListener('resize', syncChromeHeight);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', syncChromeHeight);
        };
    }, [stepLabel, syncChromeHeight]);

    return (
        <div className="auth-signup-page fixed-app overflow-hidden">
            <div className="auth-signup-map-layer auth-signup-map-layer--readonly">
                <div className="auth-signup-backdrop" aria-hidden />
                <div className="auth-signup-map-scrim auth-signup-map-scrim--preview" aria-hidden />
            </div>

            <div ref={chromeRef} className="auth-signup-chrome">
                <div className="auth-signup-top auth-flow-chrome">
                    {onBackClick ? (
                        <button type="button" onClick={onBackClick} className="auth-flow-back" aria-label={backLabel}>
                            <i className="bi bi-arrow-left" aria-hidden />
                        </button>
                    ) : backHref ? (
                        <Link href={backHref} className="auth-flow-back" aria-label={backLabel}>
                            <i className="bi bi-arrow-left" aria-hidden />
                        </Link>
                    ) : (
                        <span className="auth-flow-back auth-flow-back--placeholder" aria-hidden />
                    )}
                    <NeyborHuudLogo layout="wordmark" size="md" textSize={22} tone="light" />
                    {stepLabel ? (
                        <p className="auth-signup-progress__label">{stepLabel}</p>
                    ) : (
                        <span className="auth-flow-back--placeholder h-4" aria-hidden />
                    )}
                </div>
            </div>

            <div className="auth-signup-map-spacer" aria-hidden />

            <SignupBottomSheet
                ariaLabel={ariaLabel}
                stageKey={stageKey}
                footer={
                    footer || footerLink ? (
                        <div>
                            {footer}
                            {footerLink}
                        </div>
                    ) : undefined
                }
                keyboardAware={keyboardAware}
            >
                {hero ? <div className="auth-flow-hero">{hero}</div> : null}
                {children}
            </SignupBottomSheet>
        </div>
    );
}
