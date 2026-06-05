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
    const primaryIcon = authenticated ? 'arrow_forward' : 'home';

    return (
        <AuthFlowPage
            ariaLabel="Page not found"
            stageKey="not-found"
            stepLabel="404"
            backHref="/"
            backLabel="Back to home"
            hero={
                <AuthFlowHero
                    icon="signpost"
                    eyebrow="Wrong turn"
                    title="This street isn't on the map"
                    meta="The page you requested doesn't exist on NeyborHuud yet."
                />
            }
            footer={
                <div className="auth-signup-actions">
                    <Link href={primaryHref} className="auth-btn auth-btn-primary no-underline">
                        <span>{primaryLabel}</span>
                        <span className="material-symbols-outlined shrink-0 text-[1.125rem]" aria-hidden="true">{primaryIcon}</span>
                    </Link>
                    {!authenticated ? (
                        <>
                            <Link href="/signup" className="auth-btn auth-btn-secondary no-underline">
                                <span className="material-symbols-outlined shrink-0" aria-hidden="true">person_add</span>
                                <span>Join NeyborHuud</span>
                            </Link>
                        </>
                    ) : (
                        <Link href="/explore" className="auth-btn auth-btn-secondary no-underline">
                            <span className="material-symbols-outlined shrink-0" aria-hidden="true">explore</span>
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
                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">info</span>
                    <span>
                        Check the link for typos, or head back to your Huud. If you followed a bookmark, the page may
                        have moved.
                    </span>
                </div>
            </div>
        </AuthFlowPage>
    );
}
