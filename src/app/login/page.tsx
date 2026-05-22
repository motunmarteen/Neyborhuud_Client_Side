'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { getCurrentLocation } from '@/lib/geolocation';
import { fetchAPI } from '@/lib/api';
import apiClient from '@/lib/api-client';
import {
    persistAuthSessionPayload,
    getNeedsCommunitySelection,
    getNeedsGpsLocationVerification,
} from '@/lib/communityContext';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';

function friendlyLoginMessage(raw: string): string {
    const m = raw.toLowerCase();
    if (m.includes('load failed') || m.includes('failed to fetch') || m.includes('network')) {
        return 'Could not reach the server. Check your connection and try again.';
    }
    if (
        m.includes('invalid') &&
        (m.includes('password') || m.includes('credential') || m.includes('email') || m.includes('login'))
    ) {
        return 'Invalid email or password. Check your details or use Forgot password.';
    }
    if (m.includes('not found') || m.includes('no user') || m.includes('does not exist')) {
        return 'No account found with this email. You can create one from Join neyborhuud.';
    }
    return raw || 'Something went wrong. Please try again.';
}

type LoginResponseData = {
    session?: {
        access_token?: string;
        accessToken?: string;
        refresh_token?: string;
        refreshToken?: string;
    };
    token?: string;
    user?: unknown;
    community?: unknown;
    assignedCommunityId?: string | null;
    needsCommunitySelection?: boolean;
    needsGpsLocationVerification?: boolean;
    pickerContext?: { state: string; lga: string; locationKey?: string; hint?: string } | null;
};

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        if (!apiClient.isAuthenticated()) return;
        if (getNeedsCommunitySelection()) {
            router.replace('/pick-community');
            return;
        }
        if (getNeedsGpsLocationVerification()) {
            router.replace('/verify-location');
            return;
        }
        router.replace('/feed');
    }, [router]);

    const canLogin = formData.email.trim().length > 0 && formData.password.length > 0 && !loading;
    const loginIdentity = formData.email.trim() || 'you@example.com';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setLoading(true);

        try {
            const deviceLocation = await getCurrentLocation();

            const response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    identifier: formData.email,
                    password: formData.password,
                    deviceLocation: {
                        lat: deviceLocation?.lat,
                        lng: deviceLocation?.lng,
                    },
                }),
            });

            const data = response.data as LoginResponseData | undefined;
            const accessToken =
                data?.session?.access_token ?? data?.session?.accessToken ?? data?.token;
            const user = data?.user;
            const refreshToken = data?.session?.refresh_token ?? data?.session?.refreshToken;

            if (response.success && accessToken) {
                localStorage.setItem('neyborhuud_access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('neyborhuud_refresh_token', refreshToken);
                }
                persistAuthSessionPayload({
                    user,
                    community: data?.community,
                    assignedCommunityId: data?.assignedCommunityId,
                    needsCommunitySelection: data?.needsCommunitySelection,
                    needsGpsLocationVerification: data?.needsGpsLocationVerification,
                    pickerContext: data?.pickerContext ?? null,
                });
                apiClient.setToken(accessToken);
            }

            if (getNeedsCommunitySelection()) {
                router.push('/pick-community');
            } else if (getNeedsGpsLocationVerification()) {
                router.push('/verify-location');
            } else {
                router.push('/feed');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const friendlyMsg = friendlyLoginMessage(message);
            setFormError(friendlyMsg);
            toast.error(friendlyMsg, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <AuthFlowPage
                ariaLabel="Enter your Huud"
                stageKey="login"
                stepLabel="Enter your Huud"
                backHref="/"
                backLabel="Back to home"
                keyboardAware
                hero={
                    <AuthFlowHero
                        icon="bi-fingerprint"
                        eyebrow={formData.email.trim() ? 'Pass ready' : 'Secure entry'}
                        title="Welcome back"
                        meta={loginIdentity}
                    />
                }
                footer={
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
                                    <i className="bi bi-arrow-right shrink-0" aria-hidden />
                                </>
                            )}
                        </button>
                        <Link href="/signup" className="auth-btn auth-btn-secondary no-underline">
                            <i className="bi bi-person-plus shrink-0" aria-hidden />
                            <span>Join neyborhuud</span>
                        </Link>
                    </div>
                }
            >
                <div className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label="Email"
                        type="email"
                        icon="bi-envelope"
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
                        icon="bi-lock"
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
                            <i className="bi bi-exclamation-circle-fill shrink-0" aria-hidden />
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
