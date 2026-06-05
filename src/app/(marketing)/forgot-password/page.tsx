'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiErrors';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { toast } from 'sonner';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';

function isNetworkError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('failed to fetch') || normalized.includes('load failed') || normalized.includes('network');
}

type Step = 'form' | 'sent' | 'error';

export default function ForgotPasswordPage() {
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
        await authService.requestPasswordReset(email);
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
            const message = getApiErrorMessage(error, 'Something went wrong.');
            const status = getApiErrorStatus(error);

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

    const hero = (
        <AuthFlowHero
            icon={isError ? 'warning' : isSent ? 'mark_email_read' : 'key'}
            eyebrow={isError ? 'Request failed' : isSent ? 'Inbox next' : 'Account recovery'}
            title={isError ? 'Try again' : isSent ? 'Check your inbox' : 'Reset password'}
            meta={email || 'Use your account email'}
            error={isError}
        />
    );

    const footer =
        step === 'form' ? (
            <button
                type="submit"
                form="forgot-password-form"
                disabled={loading || !emailValidation.isFormatValid}
                className="auth-btn auth-btn-primary"
            >
                {loading ? (
                    <>
                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                        <span>Sending…</span>
                    </>
                ) : (
                    <>
                        <span>Send reset link</span>
                        <span className="material-symbols-outlined shrink-0" aria-hidden="true">send</span>
                    </>
                )}
            </button>
        ) : step === 'sent' ? (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="auth-btn auth-btn-secondary"
                >
                    <span className={`material-symbols-outlined shrink-0 text-[1.125rem] ${loading ? 'animate-spin' : ''}`} aria-hidden="true">{loading ? 'progress_activity' : 'send'}</span>
                    <span>{loading ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}</span>
                </button>
                <Link href="/login" className="auth-btn auth-btn-primary no-underline">
                    <span>Back to login</span>
                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                </Link>
            </div>
        ) : (
            <button type="button" onClick={() => setStep('form')} className="auth-btn auth-btn-primary">
                <span>Try again</span>
                <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
            </button>
        );

    return (
        <AuthFlowPage
            ariaLabel="Reset password"
            stageKey={`forgot-${step}`}
            stepLabel="Password help"
            backHref="/login"
            hero={hero}
            footer={footer}
            keyboardAware={step === 'form'}
        >
            {step === 'form' && (
                <form id="forgot-password-form" onSubmit={handleSubmit} className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label="Email"
                        type="email"
                        icon="mail"
                        placeholder="nancy@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        validationStatus={emailValidation.status}
                        invalidText="Please enter a valid email"
                        autoComplete="email"
                        inputMode="email"
                    />
                    <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                        We&apos;ll email you a link to reset your password
                    </p>
                </form>
            )}

            {step === 'sent' && (
                <div className="auth-flow-notice auth-flow-notice--success">
                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">check_circle</span>
                    <span>If an account exists for {email}, a reset link has been sent.</span>
                </div>
            )}

            {step === 'error' && errorMessage ? (
                <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">error</span>
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </AuthFlowPage>
    );
}
