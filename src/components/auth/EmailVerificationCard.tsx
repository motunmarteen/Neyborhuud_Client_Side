'use client';

import { useEffect, useRef, useState } from 'react';
import { OTPInput } from '@/components/ui/OTPInput';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  isUserEmailVerified,
  isValidEmailVerificationCode,
} from '@/lib/authSession';

type EmailVerificationCardProps = {
  email: string;
  onVerified: () => void;
  className?: string;
};

/**
 * Inline 6-digit email verification — used on Settings and other in-app surfaces.
 */
export function EmailVerificationCard({
  email,
  onVerified,
  className = '',
}: EmailVerificationCardProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const verifyInFlightRef = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!email || verifying || verifyInFlightRef.current) return;
    if (!isValidEmailVerificationCode(trimmed)) {
      if (trimmed.length > 0) {
        setError('Enter all 6 digits, then tap Verify.');
      }
      return;
    }

    verifyInFlightRef.current = true;
    setVerifying(true);
    setError(null);
    setNotice(null);

    try {
      const response = await authService.verifyEmailWithCode(email, trimmed);
      if (!response.success) {
        throw new Error(response.message || 'Verification failed. Please try again.');
      }

      const verifiedUser = response.data?.user;
      if (verifiedUser && !isUserEmailVerified(verifiedUser)) {
        throw new Error('That code was not accepted. Check your email and try again.');
      }

      onVerified();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Verification failed. Please try again.');
      const normalized = message.toLowerCase();
      if (normalized.includes('already verified')) {
        onVerified();
        return;
      }
      if (normalized.includes('expired')) {
        setError('Code expired. Tap Resend for a new code.');
      } else if (normalized.includes('invalid') || normalized.includes('incorrect')) {
        setError('Invalid code. Check the 6 digits in your email.');
      } else if (normalized.includes('attempts')) {
        setError('Too many attempts. Request a new code and try again.');
      } else {
        setError(message);
      }
      setCode('');
    } finally {
      setVerifying(false);
      verifyInFlightRef.current = false;
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setNotice(null);

    try {
      await authService.resendVerificationEmail(email);
      setResendCooldown(60);
      setCode('');
      setNotice('A new verification code was sent to your inbox.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to resend verification email.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-primary/25 bg-primary/10 p-4 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0" aria-hidden="true">mark_email_read</span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-charcoal mb-1">Verify your email</p>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-charcoal">{email}</span>
            </p>
          </div>

          <OTPInput
            length={6}
            value={code}
            onChange={setCode}
            disabled={verifying || resending}
            error={!!error}
            autoFocus
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!isValidEmailVerificationCode(code) || verifying || resending}
              className="auth-btn auth-btn-primary !min-h-[44px] flex-1"
            >
              {verifying ? (
                <>
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin"
                    aria-hidden
                  />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Verify email</span>
                  <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resendCooldown > 0 || resending || verifying}
              className="auth-btn auth-btn-secondary !min-h-[44px] flex-1"
            >
              <span className={`material-symbols-outlined shrink-0 text-[1.125rem] ${resending ? 'animate-spin' : ''}`} aria-hidden="true">
                {resending ? 'progress_activity' : 'send'}
              </span>
              <span>
                {resending ? 'Sending…' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
              </span>
            </button>
          </div>

          {error ? (
            <div className="auth-flow-notice auth-flow-notice--error" role="alert">
              <span className="material-symbols-outlined shrink-0" aria-hidden="true">error</span>
              <span>{error}</span>
            </div>
          ) : notice ? (
            <div className="auth-flow-notice auth-flow-notice--success">
              <span className="material-symbols-outlined shrink-0" aria-hidden="true">check_circle</span>
              <span>{notice}</span>
            </div>
          ) : (
            <p className="text-center text-[10px] font-medium leading-relaxed text-charcoal/50">
              Codes expire after 10 minutes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
