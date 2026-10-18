'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Step = 'form' | 'success' | 'error' | 'expired';

function ResetPasswordContent() {
    const { t } = useTranslation();
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
            setErrorMessage(t('auth.reset.badLink'));
        }
    }, [token]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit || !token) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authService.resetPassword(token, password);
            if (!response.success) {
                throw new Error(response.message || t('auth.reset.failed'));
            }
            setStep('success');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, t('auth.reset.failed'));
            if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid')) {
                setStep('expired');
                setErrorMessage(t('auth.reset.expiredBody'));
            } else {
                setStep('error');
                setErrorMessage(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const isError = step === 'error' || step === 'expired';
    const headline = step === 'success' ? t('auth.reset.doneTitle') : step === 'expired' ? t('auth.reset.expiredTitle') : step === 'error' ? t('auth.reset.errorTitle') : t('auth.reset.title');
    const status = step === 'success' ? t('auth.reset.doneKicker') : step === 'expired' ? t('auth.reset.expiredKicker') : step === 'error' ? t('auth.reset.errorKicker') : t('auth.reset.kicker');
    const icon = step === 'success' ? 'verified_user' : isError ? 'warning' : 'lock';

    const footer =
        step === 'form' ? (
            <button
                type="submit"
                form="reset-password-form"
                disabled={!canSubmit}
                className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
                        <span>{t('auth.reset.busy')}</span>
                    </>
                ) : (
                    <>
                        <span>{t('auth.reset.submit')}</span>
                        <Lock size={16} className="shrink-0" aria-hidden="true" />
                    </>
                )}
            </button>
        ) : step === 'success' ? (
            <Link href="/huud?login=1" className="auth-btn auth-btn-primary no-underline flex items-center justify-center gap-2">
                <span>{t('auth.login.submit')}</span>
                <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
            </Link>
        ) : (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={() => setStep('form')}
                    disabled={step === 'expired'}
                    className="auth-btn auth-btn-secondary"
                >
                    <span>{t('auth.tryAgain')}</span>
                </button>
                <Link href="/forgot-password" className="auth-btn auth-btn-primary no-underline flex items-center justify-center gap-2">
                    <span>{t('auth.reset.newLink')}</span>
                    <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
                </Link>
            </div>
        );

    return (
        <AuthFlowPage
            ariaLabel={t('auth.reset.title')}
            stageKey={`reset-${step}`}
            stepLabel={t('auth.forgot.step')}
            backHref="/huud?login=1"
            hero={
                <AuthFlowHero
                    icon={icon}
                    eyebrow={status}
                    title={headline}
                    meta={t('auth.reset.meta')}
                    error={isError}
                />
            }
            footer={footer}
            keyboardAware={step === 'form'}
        >
            {step === 'form' && (
                <form id="reset-password-form" onSubmit={handleSubmit} className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label={t('auth.reset.new')}
                        type="password"
                        icon="lock"
                        placeholder={t('auth.reset.newHint')}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={password} showChecklist={false} />
                    {!isPassValid && password.length > 0 ? (
                        <p className="px-1 text-[10px] text-[var(--neu-text-muted)]">{policy.message}</p>
                    ) : null}
                    <PremiumInput
                        label={t('auth.reset.confirm')}
                        type="password"
                        icon="lock"
                        placeholder={t('auth.reset.confirmHint')}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        error={confirmPassword && !passwordsMatch ? t('auth.reset.noMatch') : undefined}
                        success={passwordsMatch}
                        successText={passwordsMatch ? t('auth.reset.match') : undefined}
                        autoComplete="new-password"
                    />
                </form>
            )}

            {step === 'success' && (
                <div className="auth-flow-notice auth-flow-notice--success flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary shrink-0" aria-hidden="true" />
                    <span>{t('auth.reset.doneBody')}</span>
                </div>
            )}

            {(step === 'error' || step === 'expired') && errorMessage ? (
                <div className="auth-flow-notice auth-flow-notice--error flex items-center gap-2" role="alert">
                    <AlertCircle size={16} className="text-red-500 shrink-0" aria-hidden="true" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </AuthFlowPage>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<AuthFlowLoading />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
