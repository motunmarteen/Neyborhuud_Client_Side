'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { useEmailValidation } from '@/hooks/useEmailValidation';

type Step = 'form' | 'sent' | 'error';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('form');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Email validation
    const emailValidation = useEmailValidation({ 
        debounceMs: 400, 
        checkAvailability: false // Don't check availability for password reset
    });

    // Validate email when it changes
    useEffect(() => {
        emailValidation.validate(email);
    }, [email]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValidation.isFormatValid || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            await fetchAPI('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });

            setStep('sent');
            setResendCooldown(60);
        } catch (error: any) {
            console.error('Password reset request failed:', error);
            
            // Show success even if email doesn't exist (security best practice)
            // Only show error for actual server errors
            if (error.message.includes('500') || error.message.includes('Load failed')) {
                setErrorMessage('Unable to process request. Please try again later.');
                setStep('error');
            } else {
                // For security, show success regardless of whether email exists
                setStep('sent');
                setResendCooldown(60);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || loading) return;

        setLoading(true);
        try {
            await fetchAPI('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            setResendCooldown(60);
        } catch (error) {
            console.error('Resend failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Success: Email Sent Screen
    if (step === 'sent') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative Glows */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

                    {/* Icon */}
                    <div className="w-28 h-28 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <div className="relative">
                            <i className="bi bi-envelope-paper text-5xl text-brand-blue"></i>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <i className="bi bi-check text-white text-xs"></i>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Check Your Inbox
                    </h1>
                    
                    <p className="text-sm mb-2 relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                        If an account exists for
                    </p>
                    <p className="font-bold text-base mb-6 relative z-10 break-all px-4" style={{ color: 'var(--neu-text)' }}>
                        {email}
                    </p>
                    <p className="text-sm mb-6 relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                        you'll receive a password reset link.
                    </p>

                    {/* Instructions Box */}
                    <div className="w-full neu-socket rounded-2xl p-4 mb-6 relative z-10">
                        <div className="flex items-start gap-3 text-left">
                            <i className="bi bi-lightbulb text-yellow-500 text-lg mt-0.5"></i>
                            <div className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                                <p className="mb-2">The link will expire in <strong>15 minutes</strong>.</p>
                                <p>Check your <strong>spam folder</strong> if you don't see it.</p>
                            </div>
                        </div>
                    </div>

                    {/* Resend Button */}
                    <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        className={`
                            text-sm font-bold transition-all mb-6 relative z-10
                            ${resendCooldown > 0 || loading 
                                ? 'cursor-not-allowed' 
                                : 'text-brand-blue hover:text-brand-blue/70'}
                        `}
                        style={{ color: resendCooldown > 0 || loading ? 'var(--neu-text-muted)' : undefined }}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></span>
                                Sending...
                            </span>
                        ) : resendCooldown > 0 ? (
                            `Resend in ${resendCooldown}s`
                        ) : (
                            'Resend Reset Link'
                        )}
                    </button>

                    {/* Back to Login */}
                    <button
                        onClick={() => router.push('/login')}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                            Back to Login
                        </span>
                    </button>

                    {/* Try Different Email */}
                    <button
                        onClick={() => setStep('form')}
                        className="hover:opacity-70 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10 mt-4"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        Try Different Email
                    </button>
                </div>
            </div>
        );
    }

    // Error Screen
    if (step === 'error') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/5 rounded-full blur-3xl"></div>

                    <div className="w-24 h-24 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-exclamation-triangle text-5xl text-brand-red"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Something Went Wrong
                    </h1>
                    
                    <p className="text-sm mb-8 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        {errorMessage || 'We couldn\'t process your request. Please try again.'}
                    </p>

                    <button
                        onClick={() => setStep('form')}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                            Try Again
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    // Form Screen
    return (
        <div className="h-[100dvh] neu-base overflow-hidden">
        <div className="h-full flex flex-col p-6 max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mt-12 mb-8">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 hover:opacity-70 mb-6 transition-colors"
                    style={{ color: 'var(--neu-text-muted)' }}
                >
                    <i className="bi bi-arrow-left text-lg"></i>
                    <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                </button>
                
                <h1 className="text-3xl font-semibold tracking-tighter leading-none" style={{ color: 'var(--neu-text)' }}>
                    Forgot Password?
                </h1>
                <p className="font-light mt-3 text-base leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                    No worries! Enter your email and we'll send you a reset link.
                </p>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-8">
                <div className="w-24 h-24 rounded-full neu-card-raised flex items-center justify-center">
                    <i className="bi bi-key text-4xl text-brand-blue"></i>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <PremiumInput
                    label="Email Address"
                    type="email"
                    icon="bi-envelope"
                    placeholder="nancy@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    validationStatus={emailValidation.status}
                    error={emailValidation.status === 'invalid' ? 'Please enter a valid email' : undefined}
                />

                <button
                    disabled={loading || !emailValidation.isFormatValid}
                    className={`
                        neu-btn py-5 rounded-2xl mt-4 transition-all duration-300 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]
                        ${(loading || !emailValidation.isFormatValid) 
                            ? 'opacity-50 cursor-not-allowed scale-[0.98]' 
                            : 'hover:scale-[1.02]'}
                    `}
                >
                    <span className="font-black uppercase tracking-widest text-sm" style={{ color: 'var(--neu-text)' }}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></span>
                                Sending...
                            </span>
                        ) : (
                            'Send Reset Link'
                        )}
                    </span>
                </button>
            </form>

            {/* Footer */}
            <div className="mt-auto pb-10 text-center">
                <p className="text-sm font-light" style={{ color: 'var(--neu-text-muted)' }}>
                    Remember your password?{' '}
                    <Link href="/login" className="text-brand-blue font-bold hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
        </div>
    );
}
