'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

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

    // Password validation rules
    const passRules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password),
    };
    const isPassValid = Object.values(passRules).every(Boolean);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setStep('expired');
            setErrorMessage('Invalid or missing reset token. Please request a new password reset.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPassValid || !passwordsMatch || loading || !token) return;

        setLoading(true);
        setErrorMessage('');

        try {
            await fetchAPI('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    newPassword: password
                })
            });

            setStep('success');
        } catch (error: any) {
            console.error('Password reset failed:', error);
            
            if (error.message.includes('expired') || error.message.includes('invalid')) {
                setStep('expired');
                setErrorMessage('This reset link has expired. Please request a new one.');
            } else {
                setStep('error');
                setErrorMessage(error.message || 'Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Success Screen
    if (step === 'success') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                    <div className="w-28 h-28 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-shield-check text-5xl text-primary"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Password Updated!
                    </h1>
                    
                    <p className="text-sm mb-8 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        Your password has been successfully reset. You can now log in with your new password.
                    </p>

                    <button
                        onClick={() => router.push('/login')}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-primary transition-colors">
                            Continue to Login
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    // Expired/Invalid Token Screen
    if (step === 'expired') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl"></div>

                    <div className="w-28 h-28 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-clock-history text-5xl text-yellow-500"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Link Expired
                    </h1>
                    
                    <p className="text-sm mb-8 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        {errorMessage || 'This password reset link has expired or is invalid.'}
                    </p>

                    <button
                        onClick={() => router.push('/forgot-password')}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                            Request New Link
                        </span>
                    </button>

                    <Link 
                        href="/login"
                        className="[color:var(--neu-text-muted)] hover:[color:var(--neu-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                    >
                        Back to Login
                    </Link>
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
                        Reset Failed
                    </h1>
                    
                    <p className="text-sm mb-8 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        {errorMessage}
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
                <h1 className="text-3xl font-semibold tracking-tighter leading-none" style={{ color: 'var(--neu-text)' }}>
                    Create New Password
                </h1>
                <p className="font-light mt-3 text-base leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                    Choose a strong password to secure your account.
                </p>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-8">
                <div className="w-24 h-24 rounded-full neu-card-raised flex items-center justify-center">
                    <i className="bi bi-lock-fill text-4xl text-brand-blue"></i>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <PremiumInput
                        label="New Password"
                        type="password"
                        icon="bi-lock"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    
                    {/* Password Strength Checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-4">
                        <Rule label="8+ Chars" met={passRules.length} />
                        <Rule label="Uppercase" met={passRules.upper} />
                        <Rule label="Lowercase" met={passRules.lower} />
                        <Rule label="Number" met={passRules.number} />
                        <Rule label="Symbol" met={passRules.special} />
                    </div>
                </div>

                <PremiumInput
                    label="Confirm Password"
                    type="password"
                    icon="bi-lock-fill"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                    success={passwordsMatch}
                    successText={passwordsMatch ? "Passwords match" : undefined}
                />

                <button
                    disabled={loading || !isPassValid || !passwordsMatch}
                    className={`
                        neu-btn py-5 rounded-2xl mt-4 transition-all duration-300
                        ${(loading || !isPassValid || !passwordsMatch) 
                            ? 'opacity-40 cursor-not-allowed' 
                            : 'hover:scale-[1.02] active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]'}
                    `}
                >
                    <span className="font-black uppercase tracking-widest text-sm" style={{ color: 'var(--neu-text)' }}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></span>
                                Resetting...
                            </span>
                        ) : (
                            'Reset Password'
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

// Password rule indicator component
const Rule = ({ label, met }: { label: string, met: boolean }) => (
    <div className="flex items-center gap-2">
        <i className={`bi ${met ? 'bi-check-circle-fill text-primary' : 'bi-circle [color:var(--neu-text-muted)]'} text-[10px]`}></i>
        <span className={`text-[9px] uppercase tracking-wider ${met ? '[color:var(--neu-text)]' : '[color:var(--neu-text-muted)]'}`}>{label}</span>
    </div>
);

// Main export with Suspense wrapper for useSearchParams
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="h-[100dvh] neu-base flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
