'use client';

import React, { Suspense, useEffect, useState } from 'react';
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
                throw new Error(response.message || 'Failed to verify email. Please try again.');
            }
            applyVerificationPayload(response.data?.user);
            setStep('success');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, 'Failed to verify email. Please try again.');
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

    useEffect(() => {
        if (token) void verifyWithToken(token);
    }, [token]);

    const verifyWithCode = async () => {
        const codeToVerify = verificationCode.trim();
        if (!email || isVerifying || !isValidEmailVerificationCode(codeToVerify)) {
            if (codeToVerify.length > 0 && !isValidEmailVerificationCode(codeToVerify)) {
                setErrorMessage('Enter all 6 digits, then tap Verify.');
            }
            return;
        }

        setIsVerifying(true);
        setErrorMessage('');

        try {
            const response = await authService.verifyEmailWithCode(email, codeToVerify);
            if (!response.success) {
                throw new Error(response.message || 'Verification failed. Please try again.');
            }
            const verifiedUser = response.data?.user;
            if (verifiedUser && !isUserEmailVerified(verifiedUser)) {
                throw new Error('That code was not accepted. Check your email and try again.');
            }
            applyVerificationPayload(verifiedUser);
            setStep('success');
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, 'Verification failed. Please try again.');
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
            await authService.resendVerificationEmail(email);
            setResendCooldown(60);
            setVerificationCode('');
        } catch (error: unknown) {
            setErrorMessage(getApiErrorMessage(error, 'Failed to resend code. Please try again.'));
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
                    <span>{isResending ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}</span>
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
                            <span>Verifying</span>
                        </>
                    ) : (
                        <>
                            <span>Verify</span>
                            <ArrowRight className="shrink-0" size={17} strokeWidth={2.4} />
                        </>
                    )}
                </button>
            </div>
        ) : step === 'success' ? (
            <button type="button" onClick={() => router.push(nextRoute)} className="auth-btn auth-btn-primary flex items-center justify-center gap-2">
                <span>Enter your Huud</span>
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
                    <span>Retry link</span>
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
                    <span>Enter code</span>
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
                    ? 'Account secured'
                    : isError
                      ? 'Needs attention'
                      : isLoading
                        ? 'Checking code'
                        : 'One-time code'
            }
            title={
                isSuccess
                    ? 'Email verified'
                    : isError
                      ? 'Verification issue'
                      : isLoading
                        ? 'Verifying email'
                        : 'Check your email'
            }
            meta={username ? `@${username}` : email || 'Enter the 6-digit code we sent'}
            error={isError}
            pulse={isLoading}
        />
    );

    return (
        <AuthFlowPage
            ariaLabel="Verify email"
            stageKey={`verify-${step}`}
            stepLabel="Verify email"
            backHref="/login"
            keyboardAware={step === 'code-entry'}
            hero={hero}
            footer={footer}
        >
            {step === 'code-entry' && (
                <div className="flex flex-col gap-3">
                    {!emailParam && (
                        <PremiumInput
                            label="Email"
                            type="email"
                            icon="mail"
                            placeholder="your@email.com"
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
                            Enter all 6 digits, then tap Verify
                        </p>
                    )}
                </div>
            )}

            {step === 'verifying' && (
                <div className="auth-flow-notice auth-flow-notice--info flex items-center gap-2" role="status">
                    <Loader2 size={16} strokeWidth={2} className="shrink-0 text-blue-500 animate-spin" />
                    <span>Verifying your email…</span>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col gap-3">
                    <div className="auth-flow-notice auth-flow-notice--success flex items-center gap-2">
                        <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 text-[#00D431]" />
                        <span>Your email is verified. Welcome to the Huud.</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCredit</p>
                            <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Email verification reward</p>
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
                            Your wallet balance will appear once rewards sync
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
