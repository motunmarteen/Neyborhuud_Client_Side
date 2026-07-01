'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { getCurrentLocation } from '@/lib/geolocation';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute, validateStoredSession } from '@/lib/authSession';
import { getAuthErrorMessage } from '@/lib/error-handler';
import { useAuth } from '@/hooks/useAuth';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams.get('next');
    const { login, isLoggingIn } = useAuth();

    const [checkingSession, setCheckingSession] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            if (!apiClient.isAuthenticated()) {
                if (!cancelled) setCheckingSession(false);
                return;
            }

            const validation = await validateStoredSession();
            if (cancelled) return;

            if (validation === 'valid') {
                router.replace(resolvePostAuthRoute(nextParam));
                return;
            }

            if (validation === 'invalid') {
                apiClient.clearToken();
                if (!cancelled) setCheckingSession(false);
                return;
            }

            // Network error — show login form; do not auto-redirect on stale cache.
            if (!cancelled) setCheckingSession(false);
        }

        void restoreSession();
        return () => {
            cancelled = true;
        };
    }, [router, nextParam]);

    const loading = isLoggingIn;
    const canLogin = formData.email.trim().length > 0 && formData.password.length > 0 && !loading;
    const loginIdentity = formData.email.trim() || 'you@example.com';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            const response = await login({
                identifier: formData.email.trim(),
                password: formData.password,
            });

            if (!response.success || !apiClient.isAuthenticated()) {
                const msg = getAuthErrorMessage(response.message || 'Login failed');
                setFormError(msg);
                toast.error(msg, { duration: 5000 });
                return;
            }

            router.push(resolvePostAuthRoute(nextParam));
        } catch (error: unknown) {
            const friendlyMsg = getAuthErrorMessage(error);
            setFormError(friendlyMsg);
            toast.error(friendlyMsg, { duration: 5000 });
        }
    };

    if (checkingSession) {
        return <AuthFlowLoading />;
    }

    return (
        <form onSubmit={handleSubmit}>
            <AuthFlowPage
                ariaLabel="Enter your Huud"
                stageKey="login"
                showChrome={false}
                keyboardAware
                hero={
                    <AuthFlowHero
                        icon="fingerprint"
                        eyebrow={formData.email.trim() ? 'Pass ready' : 'Secure entry'}
                        title="Welcome back"
                        meta={loginIdentity}
                    />
                }
                footer={
                    <div>
                        <div className="auth-signup-actions">
                            <button type="submit" disabled={!canLogin} className="auth-btn auth-btn-primary">
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                                        <span>Opening…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Enter your Huud</span>
                                        <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                                    </>
                                )}
                            </button>
                            <Link href="/signup" className="auth-btn auth-btn-secondary no-underline">
                                <span className="material-symbols-outlined shrink-0" aria-hidden="true">person_add</span>
                                <span>Join NeyborHuud</span>
                            </Link>
                        </div>
                        <GoogleSignInButton />
                    </div>
                }
            >
                <div className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label="Email"
                        type="email"
                        icon="mail"
                        placeholder="nancy@example.com"
                        className="py-0.5"
                        value={formData.email}
                        onChange={(e) => {
                            setFormError(null);
                            setFormData({ ...formData, email: e.target.value });
                        }}
                        autoComplete="email"
                        inputMode="email"
                    />
                    <PremiumInput
                        label="Password"
                        type="password"
                        icon="lock"
                        placeholder="Enter password"
                        className="py-0.5"
                        value={formData.password}
                        onChange={(e) => {
                            setFormError(null);
                            setFormData({ ...formData, password: e.target.value });
                        }}
                        autoComplete="current-password"
                    />
                    <div className="flex justify-end px-1">
                        <Link
                            href="/forgot-password"
                            className="text-[10px] font-bold uppercase tracking-wider text-[var(--landing-green-deep,#006f35)]"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    {formError ? (
                        <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                            <span className="material-symbols-outlined shrink-0" aria-hidden="true">error</span>
                            <span>{formError}</span>
                        </div>
                    ) : (
                        <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                            Your Huud stays attached after login
                        </p>
                    )}
                </div>
            </AuthFlowPage>
        </form>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<AuthFlowLoading />}>
            <LoginPageContent />
        </Suspense>
    );
}
