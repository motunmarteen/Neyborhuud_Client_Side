'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute } from '@/lib/authSession';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';

export function NotFoundPage() {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        setAuthenticated(apiClient.isAuthenticated());
    }, []);

    const primaryHref = authenticated ? resolvePostAuthRoute() : '/';
    const primaryLabel = authenticated ? 'Enter your Huud' : 'Back to home';
    const primaryIcon = authenticated ? 'bi-arrow-right' : 'bi-house-heart-fill';

    return (
        <AuthFlowPage
            ariaLabel="Page not found"
            stageKey="not-found"
            stepLabel="404"
            backHref="/"
            backLabel="Back to home"
            hero={
                <AuthFlowHero
                    icon="bi-signpost-split-fill"
                    eyebrow="Wrong turn"
                    title="This street isn't on the map"
                    meta="The page you requested doesn't exist on NeyborHuud yet."
                />
            }
            footer={
                <div className="auth-signup-actions">
                    <Link href={primaryHref} className="auth-btn auth-btn-primary no-underline">
                        <span>{primaryLabel}</span>
                        <i className={`bi ${primaryIcon} shrink-0`} aria-hidden />
                    </Link>
                    {!authenticated ? (
                        <>
                            <Link href="/signup" className="auth-btn auth-btn-secondary no-underline">
                                <i className="bi bi-person-plus shrink-0" aria-hidden />
                                <span>Join neyborhuud</span>
                            </Link>
                        </>
                    ) : (
                        <Link href="/explore" className="auth-btn auth-btn-secondary no-underline">
                            <i className="bi bi-compass shrink-0" aria-hidden />
                            <span>Explore NeyborHuud</span>
                        </Link>
                    )}
                </div>
            }
            footerLink={
                !authenticated ? (
                    <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                        Already on the Huud? <Link href="/login">Enter your Huud</Link>
                    </p>
                ) : undefined
            }
        >
            <div className="flex flex-col gap-3">
                <p className="text-center text-5xl font-black tracking-tighter text-brand-black">404</p>
                <div className="auth-flow-notice auth-flow-notice--info">
                    <i className="bi bi-info-circle-fill shrink-0" aria-hidden />
                    <span>
                        Check the link for typos, or head back to your Huud. If you followed a bookmark, the page may
                        have moved.
                    </span>
                </div>
            </div>
        </AuthFlowPage>
    );
}
