'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { fetchAPI } from '@/lib/api';

const TOKEN_KEY = 'neyborhuud_access_token';

function clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('neyborhuud_refresh_token');
    localStorage.removeItem('neyborhuud_user');
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        dob: '',
    });

    const isPhoneValid = /^(?:\+234|0)[789][01]\d{8}$/.test(formData.phone);
    const isFormValid = formData.firstName && formData.lastName;

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        const userData = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;
        
        setHasToken(!!token);
        
        if (!token) {
            router.replace('/login');
            return;
        }
        
        // Check if user is verified before allowing profile completion
        if (userData) {
            try {
                const user = JSON.parse(userData);
                const isVerified = user.emailVerified === true || user.isVerified === true || user.email_verified === true || user.verificationStatus === 'verified';
                
                console.log('🔍 Profile completion check:', {
                    hasToken: !!token,
                    isVerified,
                    emailVerified: user.emailVerified,
                    isVerified_field: user.isVerified,
                    verificationStatus: user.verificationStatus
                });
                
                if (!isVerified) {
                    console.log('⚠️ User not verified, redirecting to email verification');
                    alert('Please verify your email before completing your profile.');
                    router.replace('/verify-email');
                    return;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

        if (!token) {
            alert('Your session expired. Please sign up or log in again.');
            router.push('/login');
            return;
        }

        setLoading(true);

        try {
            await fetchAPI('/auth/complete-profile', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            setStep('success');
        } catch (error: any) {
            console.error('Complete-profile error:', error);
            const msg = error?.message || '';
            const status = error?.status;
            const msgLower = msg.toLowerCase();

            // Check if user is actually verified before redirecting
            const storedUser = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;
            let userVerified = false;
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    userVerified = user.emailVerified === true || user.isVerified === true || user.email_verified === true;
                    console.log('🔍 User verification status:', { 
                        emailVerified: user.emailVerified, 
                        isVerified: user.isVerified,
                        email_verified: user.email_verified,
                        userVerified 
                    });
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }

            // Log full error details for debugging
            console.log('🔍 Error Analysis:', {
                status,
                message: msg,
                hasStatus: !!status,
                responseData: error?.responseData,
                userVerified,
                hasToken: !!localStorage.getItem('neyborhuud_access_token')
            });

            // Priority 1: Handle 403 error for unverified email (NEW: Backend requirement)
            // Check status code first, then message content
            if (status === 403 || msgLower.includes('verify your email') || msgLower.includes('verification') || msgLower.includes('email not verified')) {
                console.log('✅ Detected email verification required (403 or verification message)');
                alert(msg || 'Please verify your email before completing your profile. Check your email for the verification code.');
                router.push('/verify-email');
                return;
            }

            // Priority 2: Handle "user not active" - but check if user is actually verified first
            // If user IS verified but getting this error, it's likely a token issue, not verification issue
            if (msgLower.includes('user not active') || msgLower.includes('account isn\'t active') || msgLower.includes('account is not active')) {
                // If user is verified but getting "user not active", it's likely a token/session issue
                if (userVerified && status === 401) {
                    console.log('⚠️ User is verified but getting 401 - likely token issue');
                    // Try to refresh or get a new token by redirecting to login
                    clearAuth();
                    alert('Your session expired. Please log in again to continue.');
                    router.push('/login');
                    return;
                }
                
                console.log('✅ Detected "user not active" - redirecting to email verification');
                // If status is 403, definitely email verification issue
                if (status === 403) {
                    alert('Please verify your email before completing your profile. Check your email for the verification code.');
                    router.push('/verify-email');
                    return;
                }
                // Otherwise, could be either email verification or account activation issue
                // Show message that covers both cases
                alert('Your account isn\'t active yet. Please verify your email first, then try completing your profile again.');
                router.push('/verify-email');
                return;
            }

            // Priority 3: Handle 401 authentication errors (token issues)
            if (status === 401 || msgLower.includes('authentication required') || msgLower.includes('session is invalid') || msgLower.includes('expired') || msgLower.includes('invalid token')) {
                console.log('✅ Detected authentication error (401 or token issue)');
                clearAuth();
                const authMsg = msg || 'Your session is invalid or expired. Please log in again.';
                alert(authMsg);
                router.push('/login');
                return;
            }

            // Generic error handling
            console.log('⚠️ Unhandled error - showing generic message');
            alert(`Profile Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    if (hasToken === false) {
        return (
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                <p className="text-charcoal/50 text-sm mt-4">Redirecting to login…</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neumorphic-extreme rounded-3xl w-full max-w-sm p-8 bg-white/40 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full neumorphic-inset flex items-center justify-center mb-6">
                        <i className="bi bi-gift text-4xl text-brand-blue"></i>
                    </div>
                    <h1 className="text-xl font-light text-charcoal mb-4">Identity Unlocked!</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-4xl font-black text-neon-green">100</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/40">HuudCoins Unlocked</span>
                    </div>
                    <p className="text-deep-text/60 text-xs mb-8 leading-relaxed">
                        Your trust score has increased. You are now a **Tier 1 Neyborh**.
                    </p>
                    <button
                        onClick={() => router.push('/feed')}
                        className="neumorphic-btn w-full py-5 rounded-2xl group transition-all"
                    >
                        <span className="text-charcoal font-black uppercase tracking-widest group-hover:text-neon-green">
                            Enter the Huud
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-soft-bg flex flex-col p-6 max-w-md mx-auto overflow-hidden">
            {/* Progress Header */}
            <div className="mt-4 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light text-charcoal tracking-tight leading-none">Complete Profile</h1>
                    <p className="text-deep-text/40 text-[11px] font-light mt-1">Unlock your 100 HuudCoin reward.</p>
                </div>
                <div className="neumorphic-circle w-12 h-12 flex items-center justify-center relative">
                    <span className="text-[9px] font-black text-brand-blue">80%</span>
                    <div className="absolute inset-0 border-2 border-brand-blue/20 rounded-full border-t-brand-blue animate-spin-slow"></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <PremiumInput
                        label="First Name"
                        placeholder="John"
                        className="py-0.5"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <PremiumInput
                        label="Last Name"
                        placeholder="Doe"
                        className="py-0.5"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                </div>

                <PremiumInput
                    label="Phone (Nigerian)"
                    type="tel"
                    icon="bi-telephone"
                    placeholder="08012345678"
                    className="py-0.5"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    error={formData.phone && !isPhoneValid ? 'Invalid format' : undefined}
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-4">Gender</label>
                    <div className="flex gap-3">
                        {['male', 'female', 'other'].map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g })}
                                className={`
                                    flex-grow py-3 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all
                                    ${formData.gender === g ? 'neumorphic-inset text-brand-blue shadow-inner' : 'neumorphic text-charcoal/30'}
                                `}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <PremiumInput
                    label="Date of Birth"
                    type="date"
                    icon="bi-calendar-event"
                    className="py-0.5"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />

                <div className="mt-2 p-4 neumorphic-inset rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center gap-3">
                    <i className="bi bi-info-circle text-brand-blue text-lg leading-none"></i>
                    <p className="text-[9px] leading-tight text-deep-text/60 font-light uppercase tracking-wide">
                        Verified profiles help build a safer NeyborHuud.
                        We never share your personal ID details.
                    </p>
                </div>

                <button
                    disabled={loading || !isFormValid}
                    className={`
                        neumorphic-btn py-4.5 rounded-2xl mt-2 transition-all duration-300
                        ${(loading || !isFormValid) ? 'opacity-50 cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.01]'}
                    `}
                >
                    <span className="text-charcoal font-black uppercase tracking-widest text-sm">
                        {loading ? 'Processing...' : 'Claim 100 HuudCoins'}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => router.push('/feed')}
                    className="text-charcoal/20 hover:text-charcoal/40 text-[9px] font-black uppercase tracking-[0.2em] transition-colors mt-auto"
                >
                    I'll do this later
                </button>
            </form>
        </div>
    );
}
