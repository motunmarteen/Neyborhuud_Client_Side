'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authStorage } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';

/**
 * /auth-callback
 *
 * This page is the OAuth redirect landing point for Google (and any future
 * social providers). After the user grants consent on Google's side, the
 * Better Auth backend completes the OAuth code exchange, creates/updates the
 * user + session in MongoDB, and then redirects the browser here.
 *
 * Better Auth attaches the session via an HTTP-only cookie automatically.
 * We then call /api/v1/profile/me (which the existing apiClient already
 * supports) to hydrate the user object, store the session token, and route
 * the user to the correct next page.
 *
 * URL params Better Auth may append (optional — we handle both cases):
 *  ?error=...         OAuth error from Google or Better Auth
 *  ?token=...         Session token (when cookie-less / PWA mode)
 */

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:5000/api/v1';

const BACKEND_ROOT =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    (API_BASE_URL.replace(/\/api\/v1\/?$/, ''));

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasRun = useRef(false);
    const [statusMessage, setStatusMessage] = useState('Completing sign-in…');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
            const message = errorDescription || `Authentication failed: ${error}`;
            setErrorMessage(message);
            toast.error(message, { duration: 6000 });
            setTimeout(() => router.replace('/login'), 3000);
            return;
        }

        void completeOAuthSignIn();
    }, []);

    const completeOAuthSignIn = async () => {
        try {
            setStatusMessage('Verifying your account…');

            // Step 1: Ask Better Auth for the current session.
            // After the OAuth callback, Better Auth sets an HTTP-only session cookie.
            // We hit the /api/auth/get-session endpoint to retrieve the session token.
            const sessionRes = await fetch(`${BACKEND_ROOT}/api/auth/get-session`, {
                method: 'GET',
                credentials: 'include', // send the cookie Better Auth set
                headers: { 'Content-Type': 'application/json' },
            });

            if (!sessionRes.ok) {
                throw new Error('Could not verify your session. Please try signing in again.');
            }

            const sessionData = await sessionRes.json();
            const sessionToken: string | undefined =
                sessionData?.session?.token ?? sessionData?.token;

            if (!sessionToken) {
                throw new Error('No session token received. Please try signing in again.');
            }

            // Step 2: Store the token so the existing apiClient picks it up
            // (Better Auth uses bearer tokens on our PWA — see src/lib/auth-client.ts)
            const expiresAt = sessionData?.session?.expiresAt
                ? new Date(sessionData.session.expiresAt).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            authStorage.storeAuthData(
                sessionToken,
                {
                    expiresIn: 60 * 60 * 24 * 30,
                    expiresAt,
                    rememberMe: true, // social sign-in = always remember
                },
            );

            // Update in-memory token in Axios client immediately
            apiClient.setToken(sessionToken);

            setStatusMessage('Loading your profile…');

            // Step 3: Fetch the user profile via the existing backend endpoint
            const profileRes = await fetch(`${API_BASE_URL}/profile/me`, {
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            let userData: Record<string, unknown> | null = null;
            if (profileRes.ok) {
                const profileJson = await profileRes.json();
                userData = profileJson?.data?.user ?? profileJson?.user ?? profileJson?.data ?? null;
                if (userData) {
                    authStorage.updateUser(userData);
                }
            }

            setStatusMessage('Welcome to NeyborHuud!');

            // Step 4: Determine where to send the user
            // - New Google user (no username set) → /onboarding or /complete-profile
            // - Returning user → /feed (main app)
            const hasUsername =
                userData &&
                typeof userData.username === 'string' &&
                userData.username.trim().length > 0;

            const hasCompletedProfile =
                userData &&
                (userData.profileCompletedAt != null || hasUsername);

            if (!hasCompletedProfile) {
                // New user via Google — they still need to pick a location and username
                router.replace('/onboarding');
            } else {
                router.replace('/feed');
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Authentication failed. Please try again.';
            setErrorMessage(message);
            toast.error(message, { duration: 6000 });
            setTimeout(() => router.replace('/login'), 3500);
        }
    };

    if (errorMessage) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--neu-bg,#f5f7f5)] px-6">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-white px-8 py-8 shadow-lg text-center max-w-sm w-full">
                    <span className="material-symbols-outlined text-4xl text-red-500" aria-hidden>
                        error
                    </span>
                    <h1 className="text-lg font-black text-brand-black">Sign-in failed</h1>
                    <p className="text-sm text-[var(--neu-text-muted)]">{errorMessage}</p>
                    <p className="text-xs text-[var(--neu-text-muted)]">Redirecting you back to login…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--neu-bg,#f5f7f5)] px-6">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-charcoal/10 bg-white px-8 py-10 shadow-lg text-center max-w-sm w-full">
                {/* Animated Google logo placeholder */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                    >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span
                        className="absolute inset-0 rounded-2xl border-2 border-primary border-t-transparent animate-spin"
                        aria-hidden
                    />
                </div>

                <div>
                    <h1 className="text-lg font-black text-brand-black">Signing you in</h1>
                    <p className="mt-1 text-sm text-[var(--neu-text-muted)]">{statusMessage}</p>
                </div>

                <div className="flex gap-1.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <React.Suspense fallback={<AuthFlowLoading />}>
            <AuthCallbackContent />
        </React.Suspense>
    );
}
