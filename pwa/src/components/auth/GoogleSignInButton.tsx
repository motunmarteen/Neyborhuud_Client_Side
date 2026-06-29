'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:5000/api/v1';

interface GoogleSignInButtonProps {
    /** Label shown on the button. Defaults to "Continue with Google" */
    label?: string;
    /** Optional class additions to the outer wrapper */
    className?: string;
    /**
     * The URL the backend should redirect the browser to after OAuth completes.
     * Defaults to <origin>/auth-callback.
     */
    callbackURL?: string;
    /** Optional variant to apply specific styling (e.g., 'landing') */
    variant?: 'landing' | 'default';
}

/**
 * "Continue with Google" button
 *
 * Calls POST /api/v1/auth/social/google on our backend (social.controller.ts).
 * The backend asks Better Auth for the Google authorization URL and returns it.
 * We then redirect the browser to that URL so Google can authenticate the user.
 * After consent, Google redirects back to the backend callback, which then
 * redirects to `callbackURL` (our /auth-callback page) with the session.
 */
import { authClient } from '@/lib/auth-client';

export function GoogleSignInButton({
    label = 'Continue with Google',
    className = '',
    callbackURL,
    variant = 'default',
}: GoogleSignInButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const resolvedCallbackURL =
                callbackURL ??
                (typeof window !== 'undefined'
                    ? `${window.location.origin}/auth-callback`
                    : 'http://localhost:3001/auth-callback');

            const { data, error } = await authClient.signIn.social({
                provider: 'google',
                callbackURL: resolvedCallbackURL,
            });

            if (error) {
                throw new Error(error.message || 'Google sign-in failed. Please try again.');
            }

            // authClient automatically redirects for social sign-ins, 
            // but just in case it returns a URL instead:
            if (data?.url) {
                window.location.assign(data.url);
            }
        } catch (err: unknown) {
            setLoading(false);
            const message =
                err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
            toast.error(message, { duration: 5000 });
        }
        // Note: don't reset loading=false on success — the page will navigate away
    };

    return (
        <div className={`google-signin-wrapper ${variant} ${className}`}>
            {/* Divider */}
            <div className={`flex items-center gap-3 my-3 w-full ${variant === 'landing' ? 'text-white/45' : 'text-black/50'}`} aria-hidden="true">
                <span className={`flex-1 h-[1px] ${variant === 'landing' ? 'bg-white/15' : 'bg-black/20'}`} />
                <span className="text-[11px] font-medium tracking-widest uppercase whitespace-nowrap">or</span>
                <span className={`flex-1 h-[1px] ${variant === 'landing' ? 'bg-white/15' : 'bg-black/20'}`} />
            </div>

            {/* Button */}
            <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="google-signin-btn"
                aria-label={label}
            >
                {loading ? (
                    <>
                        <span
                            className="h-4 w-4 shrink-0 rounded-full border-2 border-[#444]/30 border-t-[#444] animate-spin"
                            aria-hidden
                        />
                        <span>Connecting…</span>
                    </>
                ) : (
                    <>
                        {/* Google G logo SVG */}
                        <svg
                            className="google-signin-btn__icon"
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>{label}</span>
                    </>
                )}
            </button>
        </div>
    );
}
