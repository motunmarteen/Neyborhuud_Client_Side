'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    isUserEmailVerified,
    isValidEmailVerificationCode,
    resolvePostAuthRoute,
} from '@/lib/authSession';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { OTPInput } from '@/components/ui/OTPInput';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { useMyGamificationStats } from '@/hooks/useGamification';
import {
    ArrowRight,
    Loader2,
    Send,
    AlertCircle,
    CheckCircle2,
    Coins,
} from 'lucide-react';

type Step = 'code-entry' | 'verifying' | 'success' | 'error' | 'expired';

function setUsernameFromPayload(user: unknown, setUsername: (v: string) => void) {
    const u = user as { username?: string } | undefined;
    if (u?.username) setUsername(u.username);
}

function resolveNextRouteFromSession(): string {
    return resolvePostAuthRoute();
}

function VerifyEmailContent() {
    const { t } = useTranslation();
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
    const { data: gamificationStats } = useMyGamificationStats();
    const verifyCoinBalance =
        typeof gamificationStats?.totalHuudCoins === 'number'
            ? gamificationStats.totalHuudCoins
            : null;

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const applyVerificationPayload = (user: unknown) => {
        setUsernameFromPayload(user, setUsername);
        setNextRoute(resolveNextRouteFromSession());
    };

    const verifyWithToken = async (verificationToken: string) => {
        setStep('verifying');
        setErrorMessage('');

        try {
            const response = await authService.verifyEmailWithToken(verificationToken);
            if (!response.success) {
                throw new Error(response.message || t('auth.verify.failed'));
            }
            applyVerificationPayload(response.data?.user);
            setStep('success');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, t('auth.verify.failed'));
            if (message.toLowerCase().includes('expired')) {
                setStep('expired');
                setErrorMessage(t('auth.verify.linkExpired'));
            } else if (message.toLowerCase().includes('already verified')) {
                setStep('success');
            } else {
                setStep('error');
                setErrorMessage(message);
            }
        }
    };

    useEffect(() => {
        if (token) void verifyWithToken(token);
    }, [token]);

    const verifyWithCode = async () => {
        const codeToVerify = verificationCode.trim();
        if (!email || isVerifying || !isValidEmailVerificationCode(codeToVerify)) {
            if (codeToVerify.length > 0 && !isValidEmailVerificationCode(codeToVerify)) {
                setErrorMessage(t('auth.verify.allDigits'));
            }
            return;
        }

        setIsVerifying(true);
        setErrorMessage('');

        try {
            const response = await authService.verifyEmailWithCode(email, codeToVerify);
            if (!response.success) {
                throw new Error(response.message || t('auth.verify.failed'));
            }
            const verifiedUser = response.data?.user;
            if (verifiedUser && !isUserEmailVerified(verifiedUser)) {
                throw new Error(t('auth.verify.notAccepted'));
            }
            applyVerificationPayload(verifiedUser);
            setStep('success');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, t('auth.verify.failed'));
            const normalized = message.toLowerCase();
            if (normalized.includes('expired')) {
                setErrorMessage(t('auth.verify.codeExpired'));
            } else if (normalized.includes('invalid') || normalized.includes('incorrect')) {
                setErrorMessage(t('auth.verify.wrongCode'));
            } else if (normalized.includes('attempts')) {
                setErrorMessage(t('auth.verify.tooMany'));
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
            await authService.resendVerificationEmail(email);
            setResendCooldown(60);
            setVerificationCode('');
        } catch (error: unknown) {
            setErrorMessage(getApiErrorMessage(error, t('auth.error.resend')));
        } finally {
            setIsResending(false);
        }
    };

    const footer =
        step === 'code-entry' ? (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending || !email}
                    className="auth-btn auth-btn-secondary"
                >
                    {isResending ? (
                        <Loader2 className="shrink-0 animate-spin" size={17} strokeWidth={2} />
                    ) : (
                        <Send className="shrink-0" size={17} strokeWidth={2} />
                    )}
                    <span>{isResending ? t('auth.sending') : resendCooldown > 0 ? `${resendCooldown}s` : t('auth.resend')}</span>
                </button>
                <button
                    type="button"
                    onClick={() => void verifyWithCode()}
                    disabled={!isValidEmailVerificationCode(verificationCode) || isVerifying || !email}
                    className="auth-btn auth-btn-primary"
                >
                    {isVerifying ? (
                        <>
                            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-black/30 border-t-black animate-spin" aria-hidden />
                            <span>{t('auth.verify.busy')}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('auth.verify.submit')}</span>
                            <ArrowRight className="shrink-0" size={17} strokeWidth={2.4} />
                        </>
                    )}
                </button>
            </div>
        ) : step === 'success' ? (
            <button type="button" onClick={() => router.push(nextRoute)} className="auth-btn auth-btn-primary flex items-center justify-center gap-2">
                <span>{t('auth.verify.continue')}</span>
                <ArrowRight className="shrink-0" size={17} strokeWidth={2.4} />
            </button>
        ) : step === 'error' || step === 'expired' ? (
            <div className="auth-signup-actions">
                <button
                    type="button"
                    onClick={() => token && verifyWithToken(token)}
                    disabled={!token || step === 'expired'}
                    className="auth-btn auth-btn-secondary"
                >
                    <span>{t('auth.verify.retryLink')}</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setStep('code-entry');
                        setErrorMessage('');
                        setVerificationCode('');
                    }}
                    className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
                >
                    <span>{t('auth.verify.enterCode')}</span>
                    <ArrowRight className="shrink-0" size={17} strokeWidth={2.4} />
                </button>
            </div>
        ) : null;

    const isError = step === 'error' || step === 'expired';
    const isSuccess = step === 'success';
    const isLoading = step === 'verifying';

    const hero = (
        <AuthFlowHero
            icon={
                isSuccess
                    ? 'mark_email_read'
                    : isError
                      ? 'warning'
                      : isLoading
                        ? 'mail'
                        : 'verified_user'
            }
            eyebrow={
                isSuccess
                    ? t('auth.verify.doneKicker')
                    : isError
                      ? t('auth.verify.errorKicker')
                      : isLoading
                        ? t('auth.verify.checkingKicker')
                        : t('auth.verify.kicker')
            }
            title={
                isSuccess
                    ? t('auth.verify.doneTitle')
                    : isError
                      ? t('auth.verify.errorTitle')
                      : isLoading
                        ? t('auth.verify.checkingTitle')
                        : t('auth.verify.title')
            }
            meta={username ? `@${username}` : email || t('auth.verify.meta')}
            error={isError}
            pulse={isLoading}
        />
    );

    return (
        <AuthFlowPage
            ariaLabel={t('auth.verify.step')}
            stageKey={`verify-${step}`}
            stepLabel={t('auth.verify.step')}
            backHref="/login"
            keyboardAware={step === 'code-entry'}
            hero={hero}
            footer={footer}
        >
            {step === 'code-entry' && (
                <div className="flex flex-col gap-3">
                    {!emailParam && (
                        <PremiumInput
                            label={t('auth.email')}
                            type="email"
                            icon="mail"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                        />
                    )}
                    <OTPInput
                        length={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                        disabled={isVerifying || !email}
                        error={!!errorMessage}
                        autoFocus={!!email}
                    />
                    {errorMessage ? (
                        <div className="auth-flow-notice auth-flow-notice--error flex items-center gap-2" role="alert">
                            <AlertCircle size={16} strokeWidth={2} className="shrink-0 text-red-500" />
                            <span>{errorMessage}</span>
                        </div>
                    ) : (
                        <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                            {t('auth.verify.allDigits')}
                        </p>
                    )}
                </div>
            )}

            {step === 'verifying' && (
                <div className="auth-flow-notice auth-flow-notice--info flex items-center gap-2" role="status">
                    <Loader2 size={16} strokeWidth={2} className="shrink-0 text-blue-500 animate-spin" />
                    <span>{t('auth.verify.checkingBody')}</span>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col gap-3">
                    <div className="auth-flow-notice auth-flow-notice--success flex items-center gap-2">
                        <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 text-[#00B82E]" />
                        <span>{t('auth.verify.doneBody')}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCredit</p>
                            {/* The whole balance, labelled honestly (it used to be called the "reward"). */}
                            <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">{t('auth.verify.balance')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                            <span className="text-3xl font-black leading-none">
                                {verifyCoinBalance ?? '—'}
                            </span>
                            <Coins size={22} strokeWidth={2} className="text-status-warning" />
                        </div>
                    </div>
                    {verifyCoinBalance === null ? (
                        <p className="text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                            {t('auth.verify.balanceSoon')}
                        </p>
                    ) : null}
                </div>
            )}

            {(step === 'error' || step === 'expired') && errorMessage ? (
                <div className="auth-flow-notice auth-flow-notice--error flex items-center gap-2" role="alert">
                    <AlertCircle size={16} strokeWidth={2} className="shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </AuthFlowPage>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<AuthFlowLoading />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
