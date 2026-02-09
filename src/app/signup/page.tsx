'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { OTPInput } from '@/components/ui/OTPInput';
import Link from 'next/link';
import { getCurrentLocation } from '@/lib/geolocation';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';
import { fetchAPI } from '@/lib/api';
import { useEmailValidation, useUsernameValidation } from '@/hooks/useEmailValidation';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'verify-email' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        agree: false,
    });
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [resolvedAddress, setResolvedAddress] = useState<LocationAddress | null>(null);
    const [locError, setLocError] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    
    // Resend verification email state
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    
    // Verification code state
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    // Email & Username validation hooks
    const emailValidation = useEmailValidation({ debounceMs: 600, checkAvailability: true });
    const usernameValidation = useUsernameValidation({ debounceMs: 600, checkAvailability: true });

    // Validate email when it changes
    useEffect(() => {
        emailValidation.validate(formData.email);
    }, [formData.email]);

    // Validate username when it changes
    useEffect(() => {
        usernameValidation.validate(formData.username);
    }, [formData.username]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Password Validation States
    const passRules = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*]/.test(formData.password),
    };
    const isPassValid = Object.values(passRules).every(Boolean);

    // Handle resend verification code
    const handleResendVerification = async () => {
        if (resendCooldown > 0 || isResending) return;
        
        setIsResending(true);
        setVerificationError(null);
        try {
            await fetchAPI('/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: formData.email })
            });
            setResendCooldown(60); // 60 second cooldown
            setVerificationCode(''); // Clear any entered code
        } catch (error: any) {
            console.error('Failed to resend verification:', error);
            alert('Failed to resend verification code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    // Handle verification code submission
    const handleVerifyCode = async (code?: string) => {
        const codeToVerify = code || verificationCode;
        console.log('🔍 handleVerifyCode called:', { codeToVerify, length: codeToVerify.length, isVerifying });
        
        if (codeToVerify.length !== 6 || isVerifying) {
            console.log('⚠️ Verification skipped:', { length: codeToVerify.length, isVerifying });
            return;
        }
        
        console.log('✅ Starting verification...');
        setIsVerifying(true);
        setVerificationError(null);
        
        try {
            // Get current token to send with verification request
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
            console.log('🔑 Current token before verification:', currentToken ? 'Present' : 'Missing');
            
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: formData.email,
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
            }
            
            // Verify token is still valid by checking stored token
            const finalToken = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
            console.log('🔑 Final token after verification:', finalToken ? 'Present' : 'Missing');
            
            console.log('✅ Email verified successfully');
            setStep('success');
        } catch (error: any) {
            console.error('Verification failed:', error);
            
            // Provide helpful error messages
            if (error.message.includes('expired')) {
                setVerificationError('Code expired. Please request a new one.');
            } else if (error.message.includes('invalid') || error.message.includes('incorrect')) {
                setVerificationError('Invalid code. Please check and try again.');
            } else if (error.message.includes('attempts')) {
                setVerificationError('Too many attempts. Please request a new code.');
            } else {
                setVerificationError(error.message || 'Verification failed. Please try again.');
            }
            
            setVerificationCode(''); // Clear code on error
        } finally {
            setIsVerifying(false);
        }
    };

    const fetchLocation = async () => {
        setLocError(null);
        setIsResolving(true);
        const loc = await getCurrentLocation();

        if (loc) {
            setLocation({ lat: loc.lat, lng: loc.lng });
            console.log('🌍 === LOCATION DIAGNOSTIC START ===');
            console.log('🌍 Raw GPS Coordinates:', {
                lat: loc.lat,
                lng: loc.lng,
                accuracy: loc.accuracy
            });
            console.log('🌍 Google Maps Link:', `https://www.google.com/maps?q=${loc.lat},${loc.lng}`);

            // Use reverse geocoding with fallback support
            const address = await reverseGeocode(loc.lat, loc.lng);

            if (address) {
                console.log('✅ Location resolved:', address.formatted || `${address.lga}, ${address.state}`);
                console.log('📍 Source:', address.source);
                setResolvedAddress(address);

                // Show info message if using fallback
                // Removed at user request: if (address.source === 'osm') { setLocError('Using OpenStreetMap (backend unavailable)'); }
            } else {
                console.warn('🌍 Geocoding failed, showing coordinates only');
                setResolvedAddress({
                    lga: 'Location Detected',
                    state: 'GPS Locked',
                    formatted: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                });
                setLocError('Could not resolve address - coordinates captured');
            }

            console.log('🌍 === LOCATION DIAGNOSTIC END ===');
            setIsResolving(false);

        } else {
            setIsResolving(false);
            setLocError("Location access denied. Please enable location permissions.");
        }
    };

    // Fetch Location on Mount
    useEffect(() => {
        fetchLocation();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPassValid) return;
        setLoading(true);

        try {
            // 1. Get fresh GPS location for submission (Wait logic)
            let finalLoc = await getCurrentLocation();

            // 2. Fallback to mount-time location if current check fails
            if (!finalLoc && location) {
                finalLoc = { lat: location.lat, lng: location.lng, accuracy: 15 };
            }

            // 3. Build Sanitize Payload
            const signupPayload: any = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                agreeToTerms: formData.agree
                // Note: assignedCommunityId and communityId are NOT sent - backend handles community assignment automatically
            };

            // Only add location if we have it
            if (finalLoc || location) {
                const lat = finalLoc?.lat || location?.lat || 0;
                const lng = finalLoc?.lng || location?.lng || 0;

                signupPayload.location = {
                    latitude: Number(lat),
                    longitude: Number(lng),
                    state: resolvedAddress?.state || 'Detection Pending',
                    lga: resolvedAddress?.lga || 'Detection Pending',
                    neighborhood: resolvedAddress?.neighborhood || resolvedAddress?.lga || 'Region Detected',
                    formattedAddress: resolvedAddress?.formatted || '',
                    resolutionSource: resolvedAddress?.source || 'unknown'
                    // ❌ DO NOT include assignedCommunityId or communityId here
                };

                signupPayload.deviceLocation = {
                    lat: Number(lat),
                    lng: Number(lng),
                    accuracy: Number(finalLoc?.accuracy || 15)
                };
            }

            // ✅ CRITICAL: Aggressively sanitize payload to remove assignedCommunityId/communityId
            // Use deep sanitization to catch any nested fields
            const sanitizePayload = (obj: any): any => {
                if (obj === null || obj === undefined) return obj;
                if (Array.isArray(obj)) {
                    return obj.map(sanitizePayload);
                }
                if (typeof obj === 'object') {
                    const sanitized: any = {};
                    for (const key in obj) {
                        // Skip communityId fields completely (including communityName)
                        if (key === 'assignedCommunityId' || key === 'communityId' || key === 'communityName') {
                            continue;
                        }
                        sanitized[key] = sanitizePayload(obj[key]);
                    }
                    return sanitized;
                }
                return obj;
            };

            const sanitizedPayload = sanitizePayload(signupPayload);

            // Double-check: Explicitly delete from root and nested objects
            delete sanitizedPayload.assignedCommunityId;
            delete sanitizedPayload.communityId;
            delete sanitizedPayload.communityName;
            if (sanitizedPayload.location) {
                delete sanitizedPayload.location.assignedCommunityId;
                delete sanitizedPayload.location.communityId;
                delete sanitizedPayload.location.communityName;
            }
            if (sanitizedPayload.deviceLocation) {
                delete sanitizedPayload.deviceLocation.assignedCommunityId;
                delete sanitizedPayload.deviceLocation.communityId;
                delete sanitizedPayload.deviceLocation.communityName;
            }

            // Debug: Log payload to verify no communityId fields
            console.log('🔍 Registration Payload (sanitized):', JSON.stringify(sanitizedPayload, null, 2));
            if (sanitizedPayload.assignedCommunityId || sanitizedPayload.communityId) {
                console.error('❌ ERROR: assignedCommunityId or communityId still present after sanitization!');
            }

            const response = await fetchAPI('/auth/create-account', {
                method: 'POST',
                body: JSON.stringify(sanitizedPayload)
            });

            // Store authentication tokens and user data
            // Backend may return { data: { user, token, community } } or { data: { user, session: { access_token }, community } }
            if (response.success && response.data) {
                const d = response.data;
                const user = d.user;
                const community = d.community;

                const sessionToken = typeof d.session === 'object' && d.session?.access_token ? d.session.access_token : undefined;
                const accessToken = d.token ?? d.access_token ?? d.accessToken ?? sessionToken ?? null;

                if (accessToken) {
                    localStorage.setItem('neyborhuud_access_token', accessToken);
                    console.log('✅ Authentication tokens stored successfully');
                } else {
                    console.warn('⚠️ Create-account succeeded but no token received. Check backend response shape.');
                }

                if (user) {
                    localStorage.setItem('neyborhuud_user', JSON.stringify(user));
                }

                if (community) {
                    console.log('✅ Community assigned:', community.communityName || community);
                }
            }

            // Show email verification screen
            setStep('verify-email');
            setResendCooldown(60); // Start with cooldown
        } catch (error: any) {
            console.error("DIAGNOSTIC LOG:", error);
            console.error("Full error object:", error);
            
            // Provide more helpful error messages
            let friendlyMsg = error.message;
            if (error.message.includes('Failed to create user')) {
                friendlyMsg = "Registration failed. Please check:\n- All required fields are filled\n- Email is valid and not already registered\n- Username is available\n- Password meets requirements";
            } else if (error.message.includes('query of #<IncomingMessage>')) {
                friendlyMsg = "The backend server is currently having trouble processing requests. Our engineers are on it!";
            } else if (error.message.includes('500')) {
                friendlyMsg = "Server error occurred. Please try again or contact support if the issue persists.";
            } else if (error.message.includes('Load failed') || error.message.includes('Failed to fetch')) {
                friendlyMsg = "Could not reach the server. Please check your connection and try again.";
            }
            
            alert(`⚠️ Registration Error: ${friendlyMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Email Verification Screen - OTP Code Entry
    if (step === 'verify-email') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-8 sm:p-10 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

                    {/* Email Icon */}
                    <div className="w-20 h-20 rounded-full neu-socket flex items-center justify-center mb-6 relative z-10">
                        <i className="bi bi-shield-lock text-4xl text-brand-blue"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-2 relative z-10 tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        Verify Your Email
                    </h1>
                    
                    <p className="text-sm mb-1 relative z-10 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                        We sent a 6-digit code to
                    </p>
                    <p className="font-bold text-sm mb-6 relative z-10 break-all px-2" style={{ color: 'var(--neu-text)' }}>
                        {formData.email}
                    </p>

                    {/* OTP Code Input */}
                    <div className="w-full mb-4 relative z-10">
                        <OTPInput
                            length={6}
                            value={verificationCode}
                            onChange={setVerificationCode}
                            onComplete={handleVerifyCode}
                            disabled={isVerifying}
                            error={!!verificationError}
                            autoFocus={true}
                        />
                    </div>

                    {/* Error Message */}
                    {verificationError && (
                        <div className="w-full mb-4 p-3 rounded-xl neu-socket relative z-10" style={{ border: '1px solid rgba(255,107,107,0.2)' }}>
                            <p className="text-xs text-brand-red font-bold flex items-center justify-center gap-2">
                                <i className="bi bi-exclamation-circle"></i>
                                {verificationError}
                            </p>
                        </div>
                    )}

                    {/* Verifying Indicator */}
                    {isVerifying && (
                        <div className="w-full mb-4 p-3 rounded-xl neu-socket relative z-10" style={{ border: '1px solid rgba(107,159,237,0.2)' }}>
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
                            onClick={handleResendVerification}
                            disabled={resendCooldown > 0 || isResending}
                            className={`
                                text-sm font-bold transition-all
                                ${resendCooldown > 0 || isResending 
                                    ? 'text-charcoal/30 cursor-not-allowed' 
                                    : 'text-brand-blue hover:text-brand-blue/70'}
                            `}
                        >
                            {isResending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></span>
                                    Sending...
                                </span>
                            ) : resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                            ) : (
                                'Resend Code'
                            )}
                        </button>
                    </div>

                    {/* Skip for now (optional - remove if verification is mandatory) */}
                    <button
                        onClick={() => setStep('success')}
                        className="text-[9px] font-bold uppercase tracking-[0.15em] transition-colors relative z-10 mt-6"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        Skip for Now
                    </button>

                    {/* Change Email */}
                    <button
                        onClick={() => {
                            setStep('form');
                            setVerificationCode('');
                            setVerificationError(null);
                        }}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10 mt-2"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        Change Email Address
                    </button>
                </div>
            </div>
        );
    }

    // Success Screen (after verification or skip)
    if (step === 'success') {
        return (
            <div className="h-[100dvh] neu-base flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neu-card-raised rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                    <div className="w-24 h-24 rounded-full neu-socket flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-person-check-fill text-5xl text-primary"></i>
                    </div>

                    <h1 className="text-2xl font-semibold mb-2 relative z-10 uppercase tracking-tighter" style={{ color: 'var(--neu-text)' }}>Welcome, Neyborh!</h1>
                    <p className="text-xs mb-8 font-light uppercase tracking-widest relative z-10" style={{ color: 'var(--neu-text-secondary)' }}>Account Secured</p>

                    <div className="flex flex-col items-center gap-1 mb-10 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-6xl font-black text-primary leading-none italic">20</span>
                            <i className="bi bi-coin text-3xl text-yellow-400"></i>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: 'var(--neu-text-muted)' }}>HuudCoins Earnt</span>
                    </div>

                    <button
                        onClick={() => router.push('/feed')}
                        className="neu-btn w-full py-6 rounded-2xl group transition-all mb-4 relative z-10 active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]"
                    >
                        <span className="font-black uppercase tracking-widest text-xs group-hover:text-primary transition-colors" style={{ color: 'var(--neu-text)' }}>
                            Get Started
                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/complete-profile')}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        Complete Profile to Claim 100 More Coins
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] neu-base overflow-hidden">
        <div className="h-full flex flex-col px-6 py-6 max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mt-4 mb-4">
                <h1 className="text-4xl font-semibold tracking-tighter leading-none" style={{ color: 'var(--neu-text)' }}>Join the <span className="text-primary italic">Huud</span></h1>
                <p className="font-light mt-2 text-base" style={{ color: 'var(--neu-text-secondary)' }}>Your journey to local prosperity starts here.</p>
            </div>

            {/* Location status */}
            <div className={`
                flex items-center justify-between p-2.5 rounded-xl mb-4 transition-all
                ${location ? 'neu-socket ring-1 ring-primary/20' : 'neu-socket'}
            `}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${location ? 'bg-primary animate-pulse' : 'bg-charcoal/30'}`}></div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] truncate" style={{ color: 'var(--neu-text-muted)' }}>
                            {isResolving ? 'Resolving Address...' :
                                resolvedAddress?.formatted ? resolvedAddress.formatted :
                                    resolvedAddress ? `${resolvedAddress.lga}, ${resolvedAddress.state}` :
                                        location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` :
                                            'Detecting Location...'}
                        </span>
                        {locError && (
                            <span className="text-[8px] text-orange-500 font-medium mt-0.5">
                                {locError}
                            </span>
                        )}
                    </div>
                </div>
                {!location && !isResolving && (
                    <button
                        type="button"
                        onClick={fetchLocation}
                        className="text-[8px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-lg hover:bg-brand-blue/20 transition-colors"
                    >
                        Retry
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <PremiumInput
                    label="Username"
                    icon="bi-person"
                    placeholder="e.g. nancy_surulere"
                    className="py-1"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    validationStatus={usernameValidation.status}
                    error={usernameValidation.errorMessage || undefined}
                    successText={usernameValidation.status === 'valid' ? 'Username available' : undefined}
                />
                <PremiumInput
                    label="Email"
                    type="email"
                    icon="bi-envelope"
                    placeholder="nancy@example.com"
                    className="py-1"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    validationStatus={emailValidation.status}
                    error={emailValidation.errorMessage || undefined}
                    successText={emailValidation.status === 'valid' ? 'Email available' : undefined}
                />
                <div className="flex flex-col gap-2">
                    <PremiumInput
                        label="Secure Password"
                        type="password"
                        icon="bi-lock"
                        placeholder="••••••••"
                        className="py-1"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
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

                <div className="flex items-center gap-3 px-2 mt-1">
                    <input
                        type="checkbox"
                        id="agree"
                        className="w-4 h-4 accent-primary"
                        checked={formData.agree}
                        onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                    />
                    <label htmlFor="agree" className="text-[10px] text-charcoal/40 font-light leading-tight">
                        I agree to the <span className="text-brand-blue underline font-bold">Rules</span> and <span className="text-brand-blue underline font-bold">Policy</span>.
                    </label>
                </div>

                <button
                    disabled={
                        loading || 
                        !isPassValid || 
                        !formData.username || 
                        !formData.email || 
                        !formData.agree ||
                        emailValidation.status === 'invalid' ||
                        emailValidation.status === 'taken' ||
                        emailValidation.status === 'checking' ||
                        usernameValidation.status === 'invalid' ||
                        usernameValidation.status === 'taken' ||
                        usernameValidation.status === 'checking'
                    }
                    className={`
                        py-4.5 rounded-2xl mt-2 transition-all duration-200 cursor-pointer
                        ${(loading || !isPassValid || !formData.username || !formData.email || !formData.agree || 
                          emailValidation.status === 'checking' || usernameValidation.status === 'checking') 
                            ? 'neu-btn opacity-40 cursor-not-allowed' 
                            : 'neu-btn active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]'}
                    `}
                >
                    <span className="font-black uppercase tracking-widest text-sm" style={{ color: 'var(--neu-text)' }}>
                        {loading ? 'Processing...' : 'Create Account'}
                    </span>
                </button>
            </form>

            <div className="mt-auto pb-4 text-center">
                <p className="text-[10px] font-light uppercase tracking-tighter" style={{ color: 'var(--neu-text-muted)' }}>
                    Already a Neyborh? <Link href="/login" className="text-brand-blue font-bold">Log in</Link>
                </p>
            </div>
        </div>
        </div>
    );
}

const Rule = ({ label, met }: { label: string, met: boolean }) => (
    <div className="flex items-center gap-2">
        <i className={`bi ${met ? 'bi-check-circle-fill text-primary' : 'bi-circle text-charcoal/10'} text-[10px]`}></i>
        <span className={`text-[9px] uppercase tracking-wider ${met ? 'text-charcoal' : 'text-charcoal/20'}`}>{label}</span>
    </div>
);
