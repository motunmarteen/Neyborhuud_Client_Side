'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { fetchAPI } from '@/lib/api';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';

type Step = 'form' | 'success' | 'error' | 'expired';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [step, setStep] = useState<Step>('form');
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const policy = evaluatePasswordPolicy(password, {});
    const isPassValid = policy.ok;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = Boolean(token) && isPassValid && passwordsMatch && !loading;

    useEffect(() => {
        if (!token) {
            setStep('expired');
            setErrorMessage('Invalid or missing reset token. Please request a new password reset.');
        }
    }, [token]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit || !token) return;

        setLoading(true);
        setErrorMessage('');

        try {
            await fetchAPI('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword: password }),
            });
            setStep('success');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
            if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid')) {
                setStep('expired');
                setErrorMessage('This reset link has expired. Please request a new one.');
            } else {
                setStep('error');
                setErrorMessage(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const isError = step === 'error' || step === 'expired';
    const headline = step === 'success' ? 'Password updated' : step === 'expired' ? 'Link expired' : step === 'error' ? 'Reset failed' : 'Create new password';
    const status = step === 'success' ? 'Secure again' : step === 'expired' ? 'New link needed' : step === 'error' ? 'Needs attention' : 'Password reset';
    const icon = step === 'success' ? 'bi-shield-check' : isError ? 'bi-exclamation-triangle-fill' : 'bi-lock-fill';

    return (
        <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 sm:px-6">
                <div className="flex h-11 shrink-0 items-center justify-between rounded-[1.15rem] bg-white/70 px-3 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
                    <button type="button" onClick={() => router.push('/login')} className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/55 transition-colors hover:text-primary" aria-label="Login" title="Login">
                        <i className="bi bi-arrow-left" aria-hidden />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Password reset</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-primary"><i className="bi bi-key-fill" aria-hidden /></span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col py-3">
                    <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                        <div className="relative flex h-full items-center justify-center overflow-hidden px-6">
                            <div className="absolute left-6 top-8 h-2 w-36 rotate-12 rounded-full bg-primary/16" aria-hidden />
                            <div className="absolute right-8 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-brand-blue/14" aria-hidden />
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/12 bg-primary/[0.035]">
                                <div className="absolute h-24 w-24 rounded-full border border-brand-amber/20 bg-brand-amber/[0.04]" aria-hidden />
                                <div className={`relative flex h-20 w-20 items-center justify-center rounded-[2rem] text-white shadow-[0_24px_54px_rgba(0,111,53,0.3)] ${isError ? 'bg-brand-red' : 'bg-primary'}`}>
                                    <i className={`bi ${icon} text-4xl`} aria-hidden />
                                </div>
                            </div>
                            <div className="absolute bottom-5 left-1/2 w-[min(19rem,calc(100%-3rem))] -translate-x-1/2 rounded-2xl border border-white/85 bg-white/[0.9] px-4 py-3 shadow-[0_18px_40px_rgba(26,26,46,0.12)] backdrop-blur-xl">
                                <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${isError ? 'text-brand-red' : 'text-primary'}`}>{status}</p>
                                <h1 className="truncate text-2xl font-black tracking-tighter text-brand-black">{headline}</h1>
                                <p className="truncate text-[11px] font-semibold text-[var(--neu-text-muted)]">NeyborHuud account access</p>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                        <div className={`h-1.5 ${isError ? 'bg-brand-red' : 'bg-gradient-to-r from-primary via-brand-blue to-brand-amber'}`} aria-hidden />
                        <div className="p-4">
                            {step === 'form' && (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <PremiumInput label="New Password" type="password" icon="bi-lock" placeholder="12+ chars, mixed case, number" value={password} onChange={event => setPassword(event.target.value)} />
                                        <PasswordStrengthMeter password={password} showChecklist={false} />
                                        {!isPassValid && password.length > 0 && <p className="px-1 text-[10px] text-[var(--neu-text-muted)]">{policy.message}</p>}
                                    </div>
                                    <PremiumInput label="Confirm Password" type="password" icon="bi-lock-fill" placeholder="Repeat password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined} success={passwordsMatch} successText={passwordsMatch ? 'Passwords match' : undefined} />
                                    <button type="submit" disabled={!canSubmit} className="btn-glass-primary h-[52px] w-full gap-2">
                                        {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden /> : <i className="bi bi-shield-lock" aria-hidden />}
                                        Reset password
                                    </button>
                                </form>
                            )}

                            {step === 'success' && (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-primary">Your password has been updated. You can sign in with the new password.</div>
                                    <button type="button" onClick={() => router.push('/login')} className="btn-glass-primary h-[52px] w-full gap-2">
                                        Continue to login
                                        <i className="bi bi-arrow-right" aria-hidden />
                                    </button>
                                </div>
                            )}

                            {(step === 'error' || step === 'expired') && (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-brand-red/15 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-brand-red">{errorMessage || 'This reset link could not be used.'}</div>
                                    <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                                        <button type="button" onClick={() => setStep('form')} disabled={step === 'expired'} className="btn-secondary h-[50px] w-full gap-2">
                                            Retry
                                        </button>
                                        <button type="button" onClick={() => router.push('/forgot-password')} className="btn-glass-primary h-[50px] w-full gap-2">
                                            New link
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="h-[100dvh] neu-base flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}