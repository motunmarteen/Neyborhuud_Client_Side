'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';
import { AuthFlowBackdrop } from '@/components/auth/AuthFlowBackdrop';

export type AuthFlowProgress = {
    active: number;
    total: number;
    stepLabel: string;
};

type AuthFlowPageProps = {
    /** Sheet aria-label */
    ariaLabel: string;
    /** Unique key when sheet content changes (e.g. step) */
    stageKey: string;
    /** Optional label under progress area, e.g. "Verify email" */
    stepLabel?: string;
    /** Signup-style step dots — Step X of Y · label */
    progress?: AuthFlowProgress;
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
    /** Collapsed peek row (signup-aligned) */
    peek?: ReactNode;
    keyboardAware?: boolean;
    /** Landing video backdrop (default true) */
    landingBackdrop?: boolean;
};

/**
 * Shared auth layout: landing-aligned backdrop + wordmark chrome + white bottom sheet.
 * Use for login, verify-email, forgot/reset password, post-signup OTP, post-auth gates, and onboarding tour.
 */
export function AuthFlowPage({
    ariaLabel,
    stageKey,
    stepLabel,
    progress,
    backHref,
    backLabel = 'Back',
    onBackClick,
    children,
    footer,
    footerLink,
    hero,
    peek,
    keyboardAware = false,
    landingBackdrop = true,
}: AuthFlowPageProps) {
    const chromeRef = useRef<HTMLDivElement>(null);
    const [sheetCollapsed, setSheetCollapsed] = useState(false);

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
    }, [stepLabel, progress, syncChromeHeight]);

    const chromeLabel = progress
        ? `Step ${progress.active} of ${progress.total} · ${progress.stepLabel}`
        : stepLabel;

    const hasBack = Boolean(onBackClick || backHref);

    return (
        <div className="auth-signup-page fixed-app overflow-hidden">
            <div className="auth-signup-map-layer auth-signup-map-layer--readonly">
                {landingBackdrop ? (
                    <AuthFlowBackdrop sheetCollapsed={sheetCollapsed} />
                ) : (
                    <>
                        <div className="auth-signup-backdrop" aria-hidden />
                        <div
                            className={[
                                'auth-signup-map-scrim auth-signup-map-scrim--preview',
                                sheetCollapsed ? 'auth-signup-map-scrim--sheet-collapsed' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-hidden
                        />
                    </>
                )}
            </div>

            <div ref={chromeRef} className="auth-signup-chrome">
                <div className={`auth-signup-top${hasBack ? ' auth-flow-chrome' : ''}`}>
                    {onBackClick ? (
                        <button type="button" onClick={onBackClick} className="auth-flow-back" aria-label={backLabel}>
                            <i className="bi bi-arrow-left" aria-hidden />
                        </button>
                    ) : backHref ? (
                        <Link href={backHref} className="auth-flow-back" aria-label={backLabel}>
                            <i className="bi bi-arrow-left" aria-hidden />
                        </Link>
                    ) : null}

                    <NeyborHuudLogo layout="wordmark" size="md" textSize={22} tone="light" />

                    {progress ? (
                        <>
                            <div className="auth-signup-progress" role="group" aria-label="Setup progress">
                                {Array.from({ length: progress.total }).map((_, index) => {
                                    const stepNumber = index + 1;
                                    const isActive = stepNumber === progress.active;
                                    const isDone = stepNumber < progress.active;
                                    return (
                                        <span
                                            key={stepNumber}
                                            className={[
                                                'auth-signup-progress__dot',
                                                isActive ? 'auth-signup-progress__dot--active' : '',
                                                isDone ? 'auth-signup-progress__dot--done' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                            aria-hidden
                                        />
                                    );
                                })}
                            </div>
                            {chromeLabel ? (
                                <p className="auth-signup-progress__label">{chromeLabel}</p>
                            ) : null}
                        </>
                    ) : chromeLabel ? (
                        <p className="auth-signup-progress__label">{chromeLabel}</p>
                    ) : (
                        <span className="auth-flow-back--placeholder h-4" aria-hidden />
                    )}
                </div>
            </div>

            <div className="auth-signup-map-spacer" aria-hidden />

            <SignupBottomSheet
                ariaLabel={ariaLabel}
                stageKey={stageKey}
                peek={peek}
                onCollapsedChange={setSheetCollapsed}
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
