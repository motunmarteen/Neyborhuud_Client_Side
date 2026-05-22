'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { getCurrentLocation } from '@/lib/geolocation';
import { fetchAPI } from '@/lib/api';
import apiClient from '@/lib/api-client';
import {
    persistAuthSessionPayload,
    getNeedsCommunitySelection,
    getNeedsGpsLocationVerification,
} from '@/lib/communityContext';

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
        return 'No account found with this email. You can create one from Join for Free.';
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
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const canLogin = formData.email.trim().length > 0 && formData.password.length > 0 && !loading;
    const loginStatus = formData.email.trim() ? 'Pass ready' : 'Enter your email';
    const loginIdentity = formData.email.trim() || 'you@example.com';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setLoading(true);

        try {
            // Get GPS location as per guide
            const deviceLocation = await getCurrentLocation();

            const response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    identifier: formData.email,
                    password: formData.password,
                    deviceLocation: {
                        lat: deviceLocation?.lat,
                        lng: deviceLocation?.lng
                    }
                })
            });

            // Store authentication tokens and user data
            // Backend may return either data.session.access_token or data.token
            const data = response.data as LoginResponseData | undefined;
            const accessToken =
                data?.session?.access_token ??
                data?.session?.accessToken ??
                data?.token;
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
        <div className="fixed-app neu-base overflow-hidden">
            <form onSubmit={handleSubmit} className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 sm:px-6">
                <div className="grid shrink-0 grid-cols-[1fr_auto] gap-2 rounded-[1.15rem] bg-white/70 p-1.5 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
                    <div className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-white shadow-[0_12px_24px_rgba(0,111,53,0.24)]">
                        <i className="bi bi-shield-lock-fill text-lg" aria-hidden />
                        <span className="text-[10px] font-black uppercase tracking-widest">Huud Login</span>
                    </div>
                    <Link
                        href="/signup"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-charcoal/45 transition-colors hover:text-brand-blue"
                        aria-label="Create account"
                        title="Create account"
                    >
                        <i className="bi bi-person-plus-fill text-lg" aria-hidden />
                    </Link>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 py-3">
                    <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                        <div className="relative flex h-full min-h-[112px] items-center justify-center overflow-hidden px-6">
                            <div className="absolute left-4 top-7 h-2 w-36 rotate-12 rounded-full bg-brand-blue/16" aria-hidden />
                            <div className="absolute right-4 top-1/2 h-2 w-36 -rotate-12 rounded-full bg-primary/16" aria-hidden />
                            <div className="absolute bottom-7 left-10 h-2 w-40 -rotate-6 rounded-full bg-brand-amber/20" aria-hidden />
                            <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/24 to-transparent" aria-hidden />
                            <div className="relative w-full max-w-[19rem] overflow-hidden rounded-[1.6rem] border border-white/85 bg-white/[0.92] shadow-[0_26px_64px_rgba(26,26,46,0.16)] backdrop-blur-xl">
                                <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                                <div className="p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-[0_16px_34px_rgba(0,111,53,0.3)]">
                                            <NeyborHuudLogo layout="mark" size="md" priority />
                                        </div>
                                        <div className="rounded-full border border-charcoal/5 bg-brand-surface px-3 py-1 text-[9px] font-black lowercase tracking-[0.12em] text-primary">
                                            neyborhuud pass
                                        </div>
                                    </div>
                                    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.24em] text-primary">{loginStatus}</p>
                                    <h1 className="truncate text-2xl font-black tracking-tighter text-brand-black">Welcome back</h1>
                                    <p className="truncate text-[11px] font-semibold text-[var(--neu-text-muted)]">{loginIdentity}</p>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[var(--neu-text-secondary)]">
                                        <i className="bi bi-broadcast-pin text-brand-blue" aria-hidden />
                                        <span className="truncate">Your Huud stays attached after login</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                        <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                        <div className="flex flex-col gap-3 p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-[0_18px_34px_rgba(0,111,53,0.34)]">
                                    <i className="bi bi-fingerprint text-xl" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">Secure entry</p>
                                    <h2 className="truncate text-[1.3rem] font-black tracking-tighter text-brand-black">Open your Huud</h2>
                                    <p className="truncate text-[11px] font-medium text-[var(--neu-text-muted)]">Continue to feed, messages, safety and local updates.</p>
                                </div>
                            </div>

                            <PremiumInput
                                label="Email Address"
                                type="email"
                                icon="bi-envelope"
                                placeholder="nancy@example.com"
                                className="py-0.5"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormError(null);
                                    setFormData({ ...formData, email: e.target.value });
                                }}
                            />

                            <div className="flex flex-col gap-2">
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
                                />
                                <div className="flex justify-end px-2">
                                    <Link
                                        href="/forgot-password"
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-blue/70"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="rounded-2xl border border-brand-red/25 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-brand-red"
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
                                <button
                                    type="submit"
                                    disabled={!canLogin}
                                    className="btn-glass-primary h-[50px] w-full gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                                            Opening
                                        </>
                                    ) : (
                                        <>
                                            Log In
                                            <i className="bi bi-arrow-right" aria-hidden />
                                        </>
                                    )}
                                </button>
                                <Link
                                    href="/signup"
                                    className="btn-secondary h-[50px] w-full gap-2 no-underline"
                                >
                                    Join
                                    <i className="bi bi-person-plus" aria-hidden />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
