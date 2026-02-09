'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { OTPInput } from '@/components/ui/OTPInput';
import { PremiumInput } from '@/components/ui/PremiumInput';

type Step = 'code-entry' | 'verifying' | 'success' | 'error' | 'expired';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    const [step, setStep] = useState<Step>(token ? 'verifying' : 'code-entry');
    const [errorMessage, setErrorMessage] = useState('');
    const [username, setUsername] = useState('');
    
    // Code entry state
    const [email, setEmail] = useState(emailParam || '');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    // Auto-verify with token on mount
    useEffect(() => {
        if (token) {
            verifyWithToken(token);
        }
    }, [token]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Verify with token (from link - backward compatible)
    const verifyWithToken = async (verificationToken: string) => {
        setStep('verifying');
        
        try {
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: verificationToken })
            });

            if (response.data?.user?.username) {
                setUsername(response.data.user.username);
            }

            setStep('success');
        } catch (error: any) {
            console.error('Email verification failed:', error);
            
            if (error.message.includes('expired')) {
                setStep('expired');
                setErrorMessage('This verification link has expired. Please request a new code.');
            } else if (error.message.includes('already verified')) {
                setStep('success');
            } else {
                setStep('error');
                setErrorMessage(error.message || 'Failed to verify email. Please try again.');
            }
        }
    };

    // Verify with code (new OTP-style)
    const verifyWithCode = async (code?: string) => {
        const codeToVerify = code || verificationCode;
        console.log('🔍 verifyWithCode called:', { codeToVerify, length: codeToVerify.length, email, isVerifying });
        
        if (codeToVerify.length !== 6 || !email || isVerifying) {
            console.log('⚠️ Verification skipped:', { length: codeToVerify.length, hasEmail: !!email, isVerifying });
            return;
        }
        
        console.log('✅ Starting verification...');
        setIsVerifying(true);
        setErrorMessage('');
        
        try {
            // Get current token to send with verification request
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
            console.log('🔑 Current token before verification:', currentToken ? 'Present' : 'Missing');
            
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(),
                    code: codeToVerify 
                })
            });

            console.log('📦 Verification response:', response);

            // Store/update authentication tokens if provided
            if (response.data) {
                const d = response.data;
                
                // Check for tokens in various possible locations
                const sessionToken = typeof d.session === 'object' && d.session?.access_token ? d.session.access_token : undefined;
                const accessToken = d.token ?? d.access_token ?? d.accessToken ?? sessionToken ?? null;
                
                if (accessToken) {
                    localStorage.setItem('neyborhuud_access_token', accessToken);
                    console.log('✅ Access token stored after verification');
                } else if (currentToken) {
                    // If no new token but we have an old one, keep it
                    console.log('ℹ️ No new token returned, keeping existing token');
                } else {
                    console.warn('⚠️ No token available after verification - user may need to login');
                }
                
                if (d.session?.refresh_token) {
                    localStorage.setItem('neyborhuud_refresh_token', d.session.refresh_token);
                }
                
                // Update stored user data with verified status
                if (d.user) {
                    localStorage.setItem('neyborhuud_user', JSON.stringify(d.user));
                    console.log('✅ User data updated:', { 
                        emailVerified: d.user.emailVerified, 
                        isVerified: d.user.isVerified,
                        verificationStatus: d.user.verificationStatus
                    });
                }
                
                if (d.user?.username) {
                    setUsername(d.user.username);
                }
            }
            
            // Verify token is still valid by checking stored token
            const finalToken = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
            console.log('🔑 Final token after verification:', finalToken ? 'Present' : 'Missing');

            setStep('success');
        } catch (error: any) {
            console.error('Code verification failed:', error);
            
            if (error.message.includes('expired')) {
                setErrorMessage('Code expired. Please request a new one.');
            } else if (error.message.includes('invalid') || error.message.includes('incorrect')) {
                setErrorMessage('Invalid code. Please check and try again.');
            } else if (error.message.includes('attempts')) {
                setErrorMessage('Too many attempts. Please request a new code.');
            } else if (error.message.includes('already verified')) {
                setStep('success');
                return;
            } else {
                setErrorMessage(error.message || 'Verification failed. Please try again.');
            }
            
            setVerificationCode('');
        } finally {
            setIsVerifying(false);
        }
    };

    // Resend verification code
    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending || !email) return;
        
        setIsResending(true);
        setErrorMessage('');
        
        try {
            await fetchAPI('/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            setResendCooldown(60);
            setVerificationCode('');
        } catch (error: any) {
            console.error('Failed to resend:', error);
            setErrorMessage('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    // Code Entry Screen (when no token provided)
    if (step === 'code-entry') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-8 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full neu-socket flex items-center justify-center mb-6 relative z-10">
                        <i className="bi bi-shield-lock text-4xl text-brand-blue"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-2 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Verify Your Email
                    </h1>
                    
                    {emailParam ? (
                        <>
                            <p className="text-sm mb-2 relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                                We sent a 6-digit code to
                            </p>
                            <p className="font-bold text-sm mb-6 relative z-10 break-all" style={{ color: 'var(--neu-text)' }}>
                                {email}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm mb-6 relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                                Enter your email and the 6-digit code we sent you.
                            </p>
                            {/* Email Input */}
                            <div className="w-full mb-4 relative z-10">
                                <PremiumInput
                                    type="email"
                                    icon="bi-envelope"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* OTP Input */}
                    <div className="w-full mb-4 relative z-10">
                        <OTPInput
                            length={6}
                            value={verificationCode}
                            onChange={setVerificationCode}
                            onComplete={verifyWithCode}
                            disabled={isVerifying || !email}
                            error={!!errorMessage}
                            autoFocus={!!email}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="w-full mb-4 p-3 rounded-xl neu-socket relative z-10" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <p className="text-xs text-brand-red font-bold flex items-center justify-center gap-2">
                                <i className="bi bi-exclamation-circle"></i>
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    {/* Verifying Indicator */}
                    {isVerifying && (
                        <div className="w-full mb-4 p-3 rounded-xl neu-socket relative z-10" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <p className="text-xs text-brand-blue font-bold flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></span>
                                Verifying...
                            </p>
                        </div>
                    )}

                    {/* Resend Code */}
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResendCode}
                            disabled={resendCooldown > 0 || isResending || !email}
                            className={`
                                text-sm font-bold transition-all
                                ${resendCooldown > 0 || isResending || !email
                                    ? '[color:var(--neu-text-muted)] cursor-not-allowed' 
                                    : 'text-brand-blue hover:text-brand-blue/70'}
                            `}
                        >
                            {isResending ? 'Sending...' : 
                             resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                             'Resend Code'}
                        </button>
                    </div>

                    {/* Back to Login */}
                    <Link 
                        href="/login"
                        className="[color:var(--neu-text-muted)] hover:[color:var(--neu-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10 mt-6"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Verifying Screen (Loading - for token verification)
    if (step === 'verifying') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl animate-pulse"></div>

                    {/* Animated Loading */}
                    <div className="w-28 h-28 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <div className="relative">
                            <i className="bi bi-envelope-open text-4xl text-brand-blue"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Verifying Email...
                    </h1>
                    
                    <p className="text-sm relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                        Please wait while we verify your email address.
                    </p>

                    {/* Animated Progress Dots */}
                    <div className="flex gap-2 mt-6 relative z-10">
                        <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Success Screen
    if (step === 'success') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    {/* Celebration Glows */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl"></div>

                    {/* Success Icon with Animation */}
                    <div className="w-28 h-28 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10 animate-in zoom-in duration-300">
                        <div className="relative">
                            <i className="bi bi-envelope-check-fill text-5xl text-primary"></i>
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold mb-2 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Email Verified!
                    </h1>

                    {username && (
                        <p className="text-sm mb-2 relative z-10" style={{ color: 'var(--neu-text-secondary)' }}>
                            Welcome, <span className="font-bold" style={{ color: 'var(--neu-text)' }}>{username}</span>!
                        </p>
                    )}
                    
                    <p className="text-sm mb-6 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        Your email has been successfully verified. Your account is now fully activated.
                    </p>

                    {/* Reward Badge */}
                    <div className="w-full neu-socket rounded-2xl p-4 mb-8 relative z-10" style={{ border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div className="flex items-center justify-center gap-3">
                            <i className="bi bi-coin text-2xl text-yellow-500"></i>
                            <div className="text-left">
                                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--neu-text-secondary)' }}>Bonus Earned</p>
                                <p className="text-xl font-black text-primary">+10 HuudCoins</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/feed')}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-primary transition-colors">
                            Get Started
                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/complete-profile')}
                        className="[color:var(--neu-text-muted)] hover:[color:var(--neu-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10"
                    >
                        Complete Profile to Claim 100 More Coins
                    </button>
                </div>
            </div>
        );
    }

    // Expired Token Screen
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
                    
                    <p className="text-sm mb-6 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                        {errorMessage || 'This verification link has expired or is invalid.'}
                    </p>

                    <button
                        onClick={() => {
                            setStep('code-entry');
                            setErrorMessage('');
                            setVerificationCode('');
                        }}
                        className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                            Enter Code Instead
                        </span>
                    </button>

                    <Link 
                        href="/login"
                        className="[color:var(--neu-text-muted)] hover:[color:var(--neu-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Error Screen
    return (
        <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
            <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/5 rounded-full blur-3xl"></div>

                <div className="w-24 h-24 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                    <i className="bi bi-exclamation-triangle text-5xl text-brand-red"></i>
                </div>

                <h1 className="text-2xl font-semibold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                    Verification Failed
                </h1>
                
                <p className="text-sm mb-8 relative z-10 leading-relaxed px-4" style={{ color: 'var(--neu-text-secondary)' }}>
                    {errorMessage}
                </p>

                <button
                    onClick={() => token && verifyWithToken(token)}
                    className="neu-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                >
                    <span className="[color:var(--neu-text)] font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                        Try Again
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

// Main export with Suspense wrapper for useSearchParams
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="h-[100dvh] neu-base flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
