'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiErrors';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { toast } from 'sonner';
import { getAuthSetupProgress } from '@/lib/authSetupFlow';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';
import { useMyGamificationStats } from '@/hooks/useGamification';

const TOKEN_KEY = 'neyborhuud_access_token';

function clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('neyborhuud_refresh_token');
    localStorage.removeItem('neyborhuud_user');
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const submittingRef = useRef(false);
    const setupProgress = getAuthSetupProgress('profile');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const { data: gamificationStats } = useMyGamificationStats();
    const profileCoinBalance =
        typeof gamificationStats?.totalHuudCoins === 'number'
            ? gamificationStats.totalHuudCoins
            : null;
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        dob: '',
    });

    const isPhoneValid = /^(?:\+234|0)[789][01]\d{8}$/.test(formData.phone);
    const isFormValid = formData.firstName && formData.lastName;
    const displayName =
        formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : 'Your profile';

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        const userData = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;

        setHasToken(!!token);

        if (!token) {
            router.replace('/login');
            return;
        }

        if (userData) {
            try {
                const user = JSON.parse(userData);
                const isVerified =
                    user.emailVerified === true ||
                    user.isVerified === true ||
                    user.email_verified === true ||
                    user.verificationStatus === 'verified';

                if (!isVerified) {
                    toast.error('Please verify your email before completing your profile.');
                    router.replace('/verify-email');
                    return;
                }

                setFormData((prev) => ({
                    firstName: user.firstName || prev.firstName,
                    lastName: user.lastName || prev.lastName,
                    phone: user.phoneNumber || user.phone || prev.phone,
                    gender: user.gender || prev.gender,
                    dob: user.dateOfBirth?.slice(0, 10) || prev.dob,
                }));
            } catch (e) {
                void e;
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submittingRef.current || loading) return;

        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

        if (!token) {
            toast.error('Your session expired. Please sign up or log in again.');
            router.push('/login');
            return;
        }

        submittingRef.current = true;
        setLoading(true);

        try {
            const response = await authService.completeProfile(formData);
            if (!response.success) {
                throw new Error(response.message || 'Profile update failed.');
            }
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setStep('success');
        } catch (error: unknown) {
            const msg = getApiErrorMessage(error, 'Profile update failed.');
            const status = getApiErrorStatus(error);
            const msgLower = msg.toLowerCase();

            const storedUser = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;
            let userVerified = false;
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    userVerified =
                        user.emailVerified === true ||
                        user.isVerified === true ||
                        user.email_verified === true;
                } catch (e) {
                    void e;
                }
            }

            if (
                status === 403 ||
                msgLower.includes('verify your email') ||
                msgLower.includes('verification') ||
                msgLower.includes('email not verified')
            ) {
                toast.error(msg || 'Please verify your email before completing your profile.');
                router.push('/verify-email');
                return;
            }

            if (
                msgLower.includes('user not active') ||
                msgLower.includes("account isn't active") ||
                msgLower.includes('account is not active')
            ) {
                if (userVerified && status === 401) {
                    clearAuth();
                    toast.error('Your session expired. Please log in again.');
                    router.push('/login');
                    return;
                }

                if (status === 403) {
                    toast.error('Please verify your email before completing your profile.');
                    router.push('/verify-email');
                    return;
                }
                toast.error("Your account isn't active yet. Please verify your email first.");
                router.push('/verify-email');
                return;
            }

            if (
                status === 401 ||
                msgLower.includes('authentication required') ||
                msgLower.includes('session is invalid') ||
                msgLower.includes('expired') ||
                msgLower.includes('invalid token')
            ) {
                clearAuth();
                toast.error(msg || 'Your session is invalid or expired. Please log in again.');
                router.push('/login');
                return;
            }

            toast.error(`Profile Error: ${msg}`);
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    if (hasToken === false || hasToken === null) {
        return <AuthFlowLoading />;
    }

    if (step === 'success') {
        return (
            <AuthFlowPage
                ariaLabel="Profile complete"
                stageKey="complete-profile-success"
                stepLabel="Profile complete"
                hero={
                    <AuthFlowHero
                        icon="bi-gift-fill"
                        eyebrow="Identity unlocked"
                        title="Profile complete"
                        meta="You are now a Tier 1 Neyborh"
                    />
                }
                footer={
                    <div className="auth-signup-actions">
                        <button
                            type="button"
                            onClick={() => router.push('/feed')}
                            className="auth-btn auth-btn-primary"
                        >
                            <span>Enter the Huud</span>
                            <i className="bi bi-arrow-right shrink-0" aria-hidden />
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <div className="auth-flow-notice auth-flow-notice--success">
                        <i className="bi bi-check-circle-fill shrink-0" aria-hidden />
                        <span>Your trust score has increased. Welcome to the Huud.</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCoins</p>
                            <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Profile completion reward</p>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                            <span className="text-3xl font-black leading-none">
                                {profileCoinBalance ?? '—'}
                            </span>
                            <i className="bi bi-coin text-xl text-brand-amber" aria-hidden />
                        </div>
                    </div>
                    {profileCoinBalance === null ? (
                        <p className="text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                            Reward will appear in your wallet shortly
                        </p>
                    ) : null}
                </div>
            </AuthFlowPage>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <AuthFlowPage
                ariaLabel="Complete profile"
                stageKey="complete-profile-form"
                progress={setupProgress}
                keyboardAware
                peek={
                    <div className="auth-signup-identity-peek">
                        <span className="auth-signup-identity-peek__avatar" aria-hidden>
                            {formData.firstName.trim() ? formData.firstName.trim().charAt(0).toUpperCase() : 'N'}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="auth-signup-identity-peek__label">Complete profile</p>
                            <p className="auth-signup-identity-peek__name truncate">{displayName}</p>
                        </div>
                        <span className="auth-signup-identity-peek__chevron" aria-hidden>
                            <i className="bi bi-chevron-up" />
                        </span>
                    </div>
                }
                footer={
                    <div>
                        <div className="auth-signup-actions">
                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="auth-btn auth-btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                                        <span>Processing…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Claim 100 HuudCoins</span>
                                        <i className="bi bi-arrow-right shrink-0" aria-hidden />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/feed')}
                                className="auth-btn auth-btn-secondary"
                            >
                                <i className="bi bi-skip-forward shrink-0" aria-hidden />
                                <span>I&apos;ll do this later</span>
                            </button>
                        </div>
                        <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                            Already complete? <Link href="/feed">Enter the Huud</Link>
                        </p>
                    </div>
                }
            >
                <AuthSheetStageHeader
                    icon="bi-person-badge-fill"
                    eyebrow="Unlock your reward"
                    title={displayName}
                    meta="100 HuudCoins when you finish"
                    signal="Tier 1 Neyborh"
                    badge=""
                />

                <div className="auth-signup-sheet-fields flex max-h-[44dvh] flex-col gap-4 overflow-y-auto overscroll-contain pb-1">
                    <div className="grid grid-cols-2 gap-3">
                        <PremiumInput
                            label="First Name"
                            placeholder="John"
                            className="py-0.5"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                        <PremiumInput
                            label="Last Name"
                            placeholder="Doe"
                            className="py-0.5"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    <PremiumInput
                        label="Phone (Nigerian)"
                        type="tel"
                        icon="bi-telephone"
                        placeholder="08012345678"
                        className="py-0.5"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        error={formData.phone && !isPhoneValid ? 'Invalid format' : undefined}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[var(--neu-text-muted)]">
                            Gender
                        </label>
                        <div className="flex gap-2">
                            {['male', 'female', 'other'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    className={`flex-1 rounded-xl border py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        formData.gender === g
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-charcoal/10 bg-white text-[var(--neu-text-muted)]'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PremiumInput
                        label="Date of Birth"
                        type="date"
                        icon="bi-calendar-event"
                        className="py-0.5"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />

                    <div className="auth-flow-notice auth-flow-notice--info">
                        <i className="bi bi-shield-check shrink-0" aria-hidden />
                        <span>
                            Verified profiles help build a safer NeyborHuud. We never share your personal ID details.
                        </span>
                    </div>
                </div>
            </AuthFlowPage>
        </form>
    );
}
