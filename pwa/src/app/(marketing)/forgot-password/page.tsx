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
import { Send, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

function isNetworkError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('failed to fetch') || normalized.includes('load failed') || normalized.includes('network');
}

type Step = 'form' | 'sent' | 'error';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
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
            const message = getApiErrorMessage(error, t('auth.error.generic'));
            const status = getApiErrorStatus(error);

            if (status === 429 || (status !== undefined && status >= 400 && status < 500)) {
                setErrorMessage(message);
                setStep('error');
                toast.error(message);
                return;
            }

            if (status === undefined ? isNetworkError(message) : status >= 500) {
                const generic = t('auth.error.later');
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
            toast.success(t('auth.forgot.sent'));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('auth.error.resend');
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
            eyebrow={isError ? t('auth.forgot.failedKicker') : isSent ? t('auth.forgot.sentKicker') : t('auth.forgot.kicker')}
            title={isError ? t('auth.tryAgain') : isSent ? t('auth.forgot.sentTitle') : t('auth.forgot.title')}
            meta={email || t('auth.forgot.meta')}
            error={isError}
        />
    );

    const footer =
        step === 'form' ? (
            <button
                type="submit"
                form="forgot-password-form"
                disabled={loading || !emailValidation.isFormatValid}
                className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
                        <span>{t('auth.sending')}</span>
                    </>
                ) : (
                    <>
                        <span>{t('auth.forgot.submit')}</span>
                        <Send size={16} className="shrink-0" aria-hidden="true" />
                    </>
                )}
            </button>
        ) : step === 'sent' ? (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="auth-btn auth-btn-secondary flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
                    ) : (
                        <Send size={16} className="shrink-0" aria-hidden="true" />
                    )}
                    <span>{loading ? t('auth.sending') : resendCooldown > 0 ? `${resendCooldown}s` : t('auth.resend')}</span>
                </button>
                <Link href="/huud?login=1" className="auth-btn auth-btn-primary no-underline flex items-center justify-center gap-2">
                    <span>{t('auth.backToLogin')}</span>
                    <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
                </Link>
            </div>
        ) : (
            <button type="button" onClick={() => setStep('form')} className="auth-btn auth-btn-primary flex items-center justify-center gap-2">
                <span>{t('auth.tryAgain')}</span>
                <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
            </button>
        );

    return (
        <AuthFlowPage
            ariaLabel={t('auth.forgot.title')}
            stageKey={`forgot-${step}`}
            stepLabel={t('auth.forgot.step')}
            backHref="/huud?login=1"
            hero={hero}
            footer={footer}
            keyboardAware={step === 'form'}
        >
            {step === 'form' && (
                <form id="forgot-password-form" onSubmit={handleSubmit} className="auth-signup-sheet-fields flex flex-col gap-3">
                    <PremiumInput
                        label={t('auth.email')}
                        type="email"
                        icon="mail"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        validationStatus={emailValidation.status}
                        invalidText={t('auth.emailInvalid')}
                        autoComplete="email"
                        inputMode="email"
                    />
                    <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                        {t('auth.forgot.hint')}
                    </p>
                </form>
            )}

            {step === 'sent' && (
                <div className="auth-flow-notice auth-flow-notice--success flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary shrink-0" aria-hidden="true" />
                    <span>{t('auth.forgot.sentBody', { email })}</span>
                </div>
            )}

            {step === 'error' && errorMessage ? (
                <div className="auth-flow-notice auth-flow-notice--error flex items-center gap-2" role="alert">
                    <AlertCircle size={16} className="text-red-500 shrink-0" aria-hidden="true" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </AuthFlowPage>
    );
}
