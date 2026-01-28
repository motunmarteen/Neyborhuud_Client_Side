'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

type Step = 'verifying' | 'success' | 'error' | 'expired';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [step, setStep] = useState<Step>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [username, setUsername] = useState('');

    // Auto-verify on mount
    useEffect(() => {
        if (!token) {
            setStep('expired');
            setErrorMessage('Invalid or missing verification token.');
            return;
        }

        verifyEmail(token);
    }, [token]);

    const verifyEmail = async (verificationToken: string) => {
        setStep('verifying');
        
        try {
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: verificationToken })
            });

            // Extract username from response if available
            if (response.data?.user?.username) {
                setUsername(response.data.user.username);
            }

            setStep('success');
        } catch (error: any) {
            console.error('Email verification failed:', error);
            
            if (error.message.includes('expired')) {
                setStep('expired');
                setErrorMessage('This verification link has expired. Please request a new one.');
            } else if (error.message.includes('already verified')) {
                setStep('success');
            } else {
                setStep('error');
                setErrorMessage(error.message || 'Failed to verify email. Please try again.');
            }
        }
    };

    // Verifying Screen (Loading)
    if (step === 'verifying') {
        return (
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <div className="neumorphic-extreme rounded-[3rem] w-full max-w-sm p-10 bg-white/40 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/10 rounded-full blur-3xl animate-pulse"></div>

                    {/* Animated Loading */}
                    <div className="w-28 h-28 rounded-full neumorphic-inset flex items-center justify-center mb-8 relative z-10">
                        <div className="relative">
                            <i className="bi bi-envelope-open text-4xl text-brand-blue"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-light text-charcoal mb-3 relative z-10 tracking-tight">
                        Verifying Email...
                    </h1>
                    
                    <p className="text-charcoal/50 text-sm relative z-10 leading-relaxed">
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
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neumorphic-extreme rounded-[3rem] w-full max-w-sm p-10 bg-white/40 flex flex-col items-center relative overflow-hidden">
                    {/* Celebration Glows */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-green/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl"></div>

                    {/* Success Icon with Animation */}
                    <div className="w-28 h-28 rounded-full neumorphic-inset flex items-center justify-center mb-8 relative z-10 animate-in zoom-in duration-300">
                        <div className="relative">
                            <i className="bi bi-envelope-check-fill text-5xl text-neon-green"></i>
                        </div>
                    </div>

                    <h1 className="text-2xl font-light text-charcoal mb-2 relative z-10 tracking-tight">
                        Email Verified!
                    </h1>

                    {username && (
                        <p className="text-charcoal/60 text-sm mb-2 relative z-10">
                            Welcome, <span className="font-bold text-charcoal">{username}</span>!
                        </p>
                    )}
                    
                    <p className="text-charcoal/50 text-sm mb-6 relative z-10 leading-relaxed px-4">
                        Your email has been successfully verified. Your account is now fully activated.
                    </p>

                    {/* Reward Badge */}
                    <div className="w-full bg-neon-green/10 rounded-2xl p-4 mb-8 relative z-10 border border-neon-green/20">
                        <div className="flex items-center justify-center gap-3">
                            <i className="bi bi-coin text-2xl text-yellow-500"></i>
                            <div className="text-left">
                                <p className="text-xs text-charcoal/50 uppercase tracking-widest">Bonus Earned</p>
                                <p className="text-xl font-black text-neon-green">+10 HuudCoins</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/complete-profile')}
                        className="neumorphic-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4"
                    >
                        <span className="text-charcoal font-black uppercase tracking-widest text-xs group-hover:text-neon-green transition-colors">
                            Complete Your Profile
                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/feed')}
                        className="text-charcoal/30 hover:text-charcoal/60 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10"
                    >
                        Skip for Now
                    </button>
                </div>
            </div>
        );
    }

    // Expired Token Screen
    if (step === 'expired') {
        return (
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neumorphic-extreme rounded-[3rem] w-full max-w-sm p-10 bg-white/40 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>

                    <div className="w-28 h-28 rounded-full neumorphic-inset flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-clock-history text-5xl text-yellow-500"></i>
                    </div>

                    <h1 className="text-2xl font-light text-charcoal mb-3 relative z-10 tracking-tight">
                        Link Expired
                    </h1>
                    
                    <p className="text-charcoal/50 text-sm mb-8 relative z-10 leading-relaxed px-4">
                        {errorMessage || 'This verification link has expired or is invalid.'}
                    </p>

                    <button
                        onClick={() => router.push('/login')}
                        className="neumorphic-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4"
                    >
                        <span className="text-charcoal font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                            Login to Resend
                        </span>
                    </button>

                    <p className="text-charcoal/40 text-xs relative z-10">
                        You can request a new verification email from your account settings.
                    </p>
                </div>
            </div>
        );
    }

    // Error Screen
    return (
        <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
            <div className="neumorphic-extreme rounded-[3rem] w-full max-w-sm p-10 bg-white/40 flex flex-col items-center relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl"></div>

                <div className="w-24 h-24 rounded-full neumorphic-inset flex items-center justify-center mb-8 relative z-10">
                    <i className="bi bi-exclamation-triangle text-5xl text-brand-red"></i>
                </div>

                <h1 className="text-2xl font-light text-charcoal mb-3 relative z-10 tracking-tight">
                    Verification Failed
                </h1>
                
                <p className="text-charcoal/50 text-sm mb-8 relative z-10 leading-relaxed px-4">
                    {errorMessage}
                </p>

                <button
                    onClick={() => token && verifyEmail(token)}
                    className="neumorphic-btn w-full py-5 rounded-2xl group transition-all relative z-10 mb-4"
                >
                    <span className="text-charcoal font-black uppercase tracking-widest text-xs group-hover:text-brand-blue transition-colors">
                        Try Again
                    </span>
                </button>

                <Link 
                    href="/login"
                    className="text-charcoal/30 hover:text-charcoal/60 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
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
            <div className="h-[100dvh] bg-soft-bg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
