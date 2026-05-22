'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { fetchAPI } from '@/lib/api';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';

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

    const footer =
        step === 'form' ? (
            <button
                type="submit"
                form="reset-password-form"
                disabled={!canSubmit}
                className="auth-btn auth-btn-primary"
            >
                {loading ? (
                    <>
                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                        <span>Updating…</span>
                    </>
                ) : (
                    <>
                        <span>Reset password</span>
                        <i className="bi bi-shield-lock shrink-0" aria-hidden />
                    </>
                )}
            </button>
        ) : step === 'success' ? (
            <Link href="/login" className="auth-btn auth-btn-primary no-underline">
                <span>Enter your Huud</span>
                <i className="bi bi-arrow-right shrink-0" aria-hidden />
            </Link>
        ) : (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={() => setStep('form')}
                    disabled={step === 'expired'}
                    className="auth-btn auth-btn-secondary"
                >
                    <span>Retry</span>
                </button>
                <Link href="/forgot-password" className="auth-btn auth-btn-primary no-underline">
                    <span>New link</span>
                    <i className="bi bi-arrow-right shrink-0" aria-hidden />
                </Link>
            </div>
        );

    return (
        <AuthFlowPage
            ariaLabel="Reset password"
            stageKey={`reset-${step}`}
            stepLabel="Password reset"
            backHref="/login"
            hero={
                <AuthFlowHero
                    icon={icon}
                    eyebrow={status}
                    title={headline}
                    meta="NeyborHuud account access"
                    error={isError}
                />
            }
            footer={footer}
            keyboardAware={step === 'form'}
        >
            {step === 'form' && (
                <form id="reset-password-form" onSubmit={handleSubmit} className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label="New password"
                        type="password"
                        icon="bi-lock"
                        placeholder="12+ chars, mixed case, number"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={password} showChecklist={false} />
                    {!isPassValid && password.length > 0 ? (
                        <p className="px-1 text-[10px] text-[var(--neu-text-muted)]">{policy.message}</p>
                    ) : null}
                    <PremiumInput
                        label="Confirm password"
                        type="password"
                        icon="bi-lock-fill"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                        success={passwordsMatch}
                        successText={passwordsMatch ? 'Passwords match' : undefined}
                        autoComplete="new-password"
                    />
                </form>
            )}

            {step === 'success' && (
                <div className="auth-flow-notice auth-flow-notice--success">
                    <i className="bi bi-check-circle-fill shrink-0" aria-hidden />
                    <span>Your password has been updated. You can sign in with the new password.</span>
                </div>
            )}

            {(step === 'error' || step === 'expired') && errorMessage ? (
                <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                    <i className="bi bi-exclamation-circle-fill shrink-0" aria-hidden />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </AuthFlowPage>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="auth-signup-page fixed-app flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
