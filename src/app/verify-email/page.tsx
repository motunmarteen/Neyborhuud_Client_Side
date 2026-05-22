'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import apiClient from '@/lib/api-client';
import { persistAuthSessionPayload } from '@/lib/communityContext';
import { OTPInput } from '@/components/ui/OTPInput';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

type Step = 'code-entry' | 'verifying' | 'success' | 'error' | 'expired';

type VerifyPayload = {
    user?: { username?: string } | unknown;
    community?: unknown;
    assignedCommunityId?: string | null;
    needsCommunitySelection?: boolean;
    needsGpsLocationVerification?: boolean;
    pickerContext?: { state: string; lga: string; locationKey?: string; hint?: string };
    token?: string;
    access_token?: string;
    accessToken?: string;
    session?: { access_token?: string; refresh_token?: string };
};

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    const [step, setStep] = useState<Step>(token ? 'verifying' : 'code-entry');
    const [errorMessage, setErrorMessage] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(emailParam || '');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [nextRoute, setNextRoute] = useState('/feed');

    useEffect(() => {
        if (token) void verifyWithToken(token);
    }, [token]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const applyVerificationPayload = (payload: VerifyPayload) => {
        const sessionToken = typeof payload.session === 'object' && payload.session?.access_token ? payload.session.access_token : undefined;
        const accessToken = payload.token ?? payload.access_token ?? payload.accessToken ?? sessionToken ?? null;

        if (accessToken) {
            localStorage.setItem('neyborhuud_access_token', accessToken);
            apiClient.setToken(accessToken);
        }

        if (payload.session?.refresh_token) {
            localStorage.setItem('neyborhuud_refresh_token', payload.session.refresh_token);
        }

        if (payload.user) {
            localStorage.setItem('neyborhuud_user', JSON.stringify(payload.user));
        }

        const user = payload.user as { username?: string } | undefined;
        if (user?.username) setUsername(user.username);

        persistAuthSessionPayload({
            user: payload.user,
            community: payload.community,
            assignedCommunityId: payload.assignedCommunityId,
            needsCommunitySelection: payload.needsCommunitySelection,
            needsGpsLocationVerification: payload.needsGpsLocationVerification,
            pickerContext: payload.pickerContext ?? null,
        });

        if (payload.needsCommunitySelection) {
            setNextRoute('/pick-community');
        } else if (payload.needsGpsLocationVerification) {
            setNextRoute('/verify-location');
        } else {
            setNextRoute('/feed');
        }
    };

    const verifyWithToken = async (verificationToken: string) => {
        setStep('verifying');
        setErrorMessage('');

        try {
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: verificationToken }),
            });
            if (response.data) applyVerificationPayload(response.data as VerifyPayload);
            setStep('success');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to verify email. Please try again.';
            if (message.toLowerCase().includes('expired')) {
                setStep('expired');
                setErrorMessage('This verification link has expired. Please request a new code.');
            } else if (message.toLowerCase().includes('already verified')) {
                setStep('success');
            } else {
                setStep('error');
                setErrorMessage(message);
            }
        }
    };

    const verifyWithCode = async (code?: string) => {
        const codeToVerify = code || verificationCode;
        if (codeToVerify.length !== 6 || !email || isVerifying) return;

        setIsVerifying(true);
        setErrorMessage('');

        try {
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeToVerify }),
            });
            if (response.data) applyVerificationPayload(response.data as VerifyPayload);
            setStep('success');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Verification failed. Please try again.';
            const normalized = message.toLowerCase();
            if (normalized.includes('expired')) {
                setErrorMessage('Code expired. Please request a new one.');
            } else if (normalized.includes('invalid') || normalized.includes('incorrect')) {
                setErrorMessage('Invalid code. Please check and try again.');
            } else if (normalized.includes('attempts')) {
                setErrorMessage('Too many attempts. Please request a new code.');
            } else if (normalized.includes('already verified')) {
                setStep('success');
                return;
            } else {
                setErrorMessage(message);
            }
            setVerificationCode('');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending || !email) return;

        setIsResending(true);
        setErrorMessage('');

        try {
            await fetchAPI('/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            setResendCooldown(60);
            setVerificationCode('');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const isError = step === 'error' || step === 'expired';
    const isSuccess = step === 'success';
    const isLoading = step === 'verifying';
    const headline = isSuccess ? 'Email verified' : isError ? 'Verification issue' : isLoading ? 'Verifying email' : 'Verify email';
    const status = isSuccess ? 'Account secured' : isError ? 'Needs attention' : isLoading ? 'Checking token' : 'One-time code';
    const icon = isSuccess ? 'bi-envelope-check-fill' : isError ? 'bi-exclamation-triangle-fill' : isLoading ? 'bi-envelope-open' : 'bi-shield-lock-fill';

    return (
        <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 sm:px-6">
                <div className="flex h-11 shrink-0 items-center justify-between rounded-[1.15rem] bg-white/70 px-3 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
                    <button type="button" onClick={() => router.push('/login')} className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/55 transition-colors hover:text-primary" aria-label="Login" title="Login">
                        <i className="bi bi-arrow-left" aria-hidden />
                    </button>
                    <NeyborHuudLogo layout="inline" size="sm" tone="primary" />
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-primary"><i className="bi bi-envelope-check" aria-hidden /></span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col py-3">
                    <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                        <div className="relative flex h-full items-center justify-center overflow-hidden px-6">
                            <div className="absolute left-4 top-7 h-2 w-36 rotate-12 rounded-full bg-brand-blue/16" aria-hidden />
                            <div className="absolute right-6 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-primary/14" aria-hidden />
                            <div className="absolute bottom-8 left-12 h-2 w-40 -rotate-6 rounded-full bg-brand-amber/18" aria-hidden />
                            <div className="relative w-full max-w-[19rem] overflow-hidden rounded-[1.6rem] border border-white/85 bg-white/[0.92] shadow-[0_26px_64px_rgba(26,26,46,0.16)] backdrop-blur-xl">
                                <div className={`h-1.5 ${isError ? 'bg-brand-red' : 'bg-gradient-to-r from-primary via-brand-blue to-brand-amber'}`} aria-hidden />
                                <div className="p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(0,111,53,0.25)] ${isError ? 'bg-brand-red' : isSuccess ? 'bg-primary' : 'bg-brand-blue'}`}>
                                            <i className={`bi ${icon} text-xl ${isLoading ? 'animate-pulse' : ''}`} aria-hidden />
                                        </div>
                                        <div className="rounded-full border border-charcoal/5 bg-brand-surface px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">Email</div>
                                    </div>
                                    <p className={`mb-1 text-[9px] font-black uppercase tracking-[0.24em] ${isError ? 'text-brand-red' : 'text-primary'}`}>{status}</p>
                                    <h1 className="truncate text-2xl font-black tracking-tighter text-brand-black">{headline}</h1>
                                    <p className="truncate text-[11px] font-semibold text-[var(--neu-text-muted)]">{username ? `@${username}` : email || 'Secure your account'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                        <div className={`h-1.5 ${isError ? 'bg-brand-red' : 'bg-gradient-to-r from-primary via-brand-blue to-brand-amber'}`} aria-hidden />
                        <div className="flex flex-col gap-4 p-4">
                            {step === 'code-entry' && (
                                <>
                                    {!emailParam && <PremiumInput type="email" icon="bi-envelope" placeholder="your@email.com" value={email} onChange={event => setEmail(event.target.value)} />}
                                    <OTPInput length={6} value={verificationCode} onChange={setVerificationCode} onComplete={verifyWithCode} disabled={isVerifying || !email} error={!!errorMessage} autoFocus={!!email} />
                                    {errorMessage && <div className="rounded-2xl border border-brand-red/15 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-brand-red">{errorMessage}</div>}
                                    <div className="grid grid-cols-[0.86fr_1.14fr] gap-3">
                                        <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || isResending || !email} className="btn-secondary h-[50px] w-full gap-2">
                                            <i className={`bi ${isResending ? 'bi-arrow-repeat animate-spin' : 'bi-send'}`} aria-hidden />
                                            {isResending ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                                        </button>
                                        <button type="button" onClick={() => verifyWithCode()} disabled={verificationCode.length !== 6 || isVerifying || !email} className="btn-glass-primary h-[50px] w-full gap-2">
                                            {isVerifying ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden /> : <i className="bi bi-check2-circle" aria-hidden />}
                                            Verify
                                        </button>
                                    </div>
                                </>
                            )}

                            {step === 'verifying' && <div className="flex h-[112px] items-center justify-center rounded-2xl border border-brand-blue/15 bg-brand-blue/10 text-[11px] font-black uppercase tracking-[0.22em] text-brand-blue"><span className="mr-2 h-4 w-4 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" aria-hidden />Verifying</div>}

                            {step === 'success' && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCoins</p>
                                            <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Email verification reward</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary"><span className="text-3xl font-black leading-none">10</span><i className="bi bi-coin text-xl text-brand-amber" aria-hidden /></div>
                                    </div>
                                    <button type="button" onClick={() => router.push(nextRoute)} className="btn-glass-primary h-[52px] w-full gap-2">
                                        Continue
                                        <i className="bi bi-arrow-right" aria-hidden />
                                    </button>
                                </div>
                            )}

                            {(step === 'error' || step === 'expired') && (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-brand-red/15 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-brand-red">{errorMessage || 'Verification failed. Please try again.'}</div>
                                    <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                                        <button type="button" onClick={() => token && verifyWithToken(token)} disabled={!token || step === 'expired'} className="btn-secondary h-[50px] w-full">Retry</button>
                                        <button type="button" onClick={() => { setStep('code-entry'); setErrorMessage(''); setVerificationCode(''); }} className="btn-glass-primary h-[50px] w-full gap-2">
                                            Enter code
                                            <i className="bi bi-arrow-right" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="h-[100dvh] neu-base flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}