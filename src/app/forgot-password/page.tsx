'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { fetchAPI } from '@/lib/api';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { toast } from 'sonner';

function forgotPasswordBody(email: string) {
    const normalized = email.trim().toLowerCase();
    return JSON.stringify({ email: normalized, identifier: normalized });
}

function getErrorStatus(error: unknown): number | undefined {
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        return typeof status === 'number' ? status : undefined;
    }
    return undefined;
}

function isNetworkError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('failed to fetch') || normalized.includes('load failed') || normalized.includes('network');
}

type Step = 'form' | 'sent' | 'error';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('form');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const emailValidation = useEmailValidation({ debounceMs: 400, checkAvailability: false });

    useEffect(() => {
        emailValidation.validate(email);
    }, [email]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const requestReset = async () => {
        await fetchAPI('/auth/forgot-password', {
            method: 'POST',
            body: forgotPasswordBody(email),
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!emailValidation.isFormatValid || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            await requestReset();
            setStep('sent');
            setResendCooldown(60);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            const status = getErrorStatus(error);

            if (status === 429 || (status !== undefined && status >= 400 && status < 500)) {
                setErrorMessage(message);
                setStep('error');
                toast.error(message);
                return;
            }

            if (status === undefined ? isNetworkError(message) : status >= 500) {
                const generic = 'Unable to process request. Please try again later.';
                setErrorMessage(generic);
                setStep('error');
                toast.error(generic);
                return;
            }

            setErrorMessage(message);
            setStep('error');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || loading) return;
        setLoading(true);
        setErrorMessage('');
        try {
            await requestReset();
            setResendCooldown(60);
            toast.success('Reset link sent.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Could not resend. Try again later.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const isSent = step === 'sent';
    const isError = step === 'error';

    return (
        <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 sm:px-6">
                <div className="flex h-11 shrink-0 items-center justify-between rounded-[1.15rem] bg-white/70 px-3 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
                    <button type="button" onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/55 transition-colors hover:text-primary" aria-label="Back" title="Back">
                        <i className="bi bi-arrow-left" aria-hidden />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Password help</span>
                    <button type="button" onClick={() => router.push('/login')} className="flex h-8 w-8 items-center justify-center rounded-xl text-charcoal/55 transition-colors hover:text-primary" aria-label="Login" title="Login">
                        <i className="bi bi-box-arrow-in-right" aria-hidden />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col py-3">
                    <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                        <div className="relative flex h-full items-center justify-center overflow-hidden px-6">
                            <div className="absolute left-4 top-7 h-2 w-36 rotate-12 rounded-full bg-brand-blue/16" aria-hidden />
                            <div className="absolute right-6 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-primary/14" aria-hidden />
                            <div className="absolute bottom-8 left-12 h-2 w-40 -rotate-6 rounded-full bg-brand-amber/18" aria-hidden />
                            <div className="relative w-full max-w-[19rem] overflow-hidden rounded-[1.6rem] border border-white/85 bg-white/[0.92] shadow-[0_26px_64px_rgba(26,26,46,0.16)] backdrop-blur-xl">
                                <div className={`h-1.5 ${isError ? 'bg-brand-red' : 'bg-gradient-to-r from-brand-blue via-primary to-brand-amber'}`} aria-hidden />
                                <div className="p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(0,135,81,0.25)] ${isError ? 'bg-brand-red' : isSent ? 'bg-primary' : 'bg-brand-blue'}`}>
                                            <i className={`bi ${isError ? 'bi-exclamation-triangle-fill' : isSent ? 'bi-envelope-check-fill' : 'bi-key-fill'} text-xl`} aria-hidden />
                                        </div>
                                        <div className="rounded-full border border-charcoal/5 bg-[#F8FAFC] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">NeyborHuud</div>
                                    </div>
                                    <p className={`mb-1 text-[9px] font-black uppercase tracking-[0.24em] ${isError ? 'text-brand-red' : 'text-primary'}`}>{isError ? 'Request failed' : isSent ? 'Inbox next' : 'Account recovery'}</p>
                                    <h1 className="truncate text-2xl font-black tracking-tighter text-[#1A1A2E]">{isError ? 'Try again' : isSent ? 'Check your inbox' : 'Reset password'}</h1>
                                    <p className="truncate text-[11px] font-semibold text-[#64748B]">{email || 'Use your account email'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                        <div className={`h-1.5 ${isError ? 'bg-brand-red' : 'bg-gradient-to-r from-brand-blue via-primary to-brand-amber'}`} aria-hidden />
                        <div className="p-4">
                            {step === 'form' && (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <PremiumInput label="Email Address" type="email" icon="bi-envelope" placeholder="nancy@example.com" value={email} onChange={event => setEmail(event.target.value)} validationStatus={emailValidation.status} error={emailValidation.status === 'invalid' ? 'Please enter a valid email' : undefined} />
                                    <button type="submit" disabled={loading || !emailValidation.isFormatValid} className={`flex h-[52px] items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest transition-all ${!loading && emailValidation.isFormatValid ? 'bg-brand-blue text-white shadow-[0_18px_34px_rgba(13,110,253,0.28)] active:scale-[0.98]' : 'border border-charcoal/5 bg-white text-[#94A3B8] shadow-[0_12px_30px_rgba(26,26,46,0.08)]'}`}>
                                        {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden /> : <i className="bi bi-send" aria-hidden />}
                                        Send reset link
                                    </button>
                                </form>
                            )}

                            {step === 'sent' && (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-primary">If an account exists for {email}, a reset link has been sent.</div>
                                    <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                                        <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading} className={`flex h-[50px] items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest transition-all ${resendCooldown > 0 || loading ? 'border border-charcoal/5 bg-white text-[#94A3B8] shadow-[0_12px_30px_rgba(26,26,46,0.08)]' : 'border border-charcoal/5 bg-white text-[#1A1A2E] shadow-[0_12px_30px_rgba(26,26,46,0.1)]'}`}>
                                            {loading ? <i className="bi bi-arrow-repeat animate-spin" aria-hidden /> : <i className="bi bi-send" aria-hidden />}
                                            {loading ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                                        </button>
                                        <button type="button" onClick={() => router.push('/login')} className="flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_18px_34px_rgba(0,135,81,0.34)] transition-all active:scale-[0.98]">
                                            Login
                                            <i className="bi bi-arrow-right" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'error' && (
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-2xl border border-brand-red/15 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-brand-red">{errorMessage || 'We could not process your request. Please try again.'}</div>
                                    <button type="button" onClick={() => setStep('form')} className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand-blue px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_18px_34px_rgba(13,110,253,0.28)] transition-all active:scale-[0.98]">
                                        Try again
                                        <i className="bi bi-arrow-right" aria-hidden />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}