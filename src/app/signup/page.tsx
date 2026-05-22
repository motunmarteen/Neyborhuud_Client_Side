'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { OTPInput } from '@/components/ui/OTPInput';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { getCurrentLocation } from '@/lib/geolocation';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';
import { fetchAPI } from '@/lib/api';
import { persistAuthSessionPayload, getNeedsCommunitySelection } from '@/lib/communityContext';
import { getAppEntryRoute } from '@/lib/onboarding';
import apiClient from '@/lib/api-client';
import { useEmailValidation, useUsernameValidation } from '@/hooks/useEmailValidation';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';
import { toast } from 'sonner';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

const SIGNUP_MAP_DEFAULT = { lat: 6.6059, lng: 3.2771 };

const SIGNUP_STAGE_LABELS = {
    location: 'Street',
    identity: '@name',
    security: 'Secure',
} as const;

function SignupPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [referralCodeInput, setReferralCodeInput] = useState('');
    const [step, setStep] = useState<'form' | 'verify-email' | 'success'>('form');
    const [signupStage, setSignupStage] = useState<'location' | 'identity' | 'security'>('location');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        /** Single UI control: must stay in sync with API fields agreeToTerms + agreeToPrivacy */
        acceptTermsAndPrivacy: false,
        /** One optional opt-in → maps to marketing, analytics & third_party on the API */
        optionalProcessing: false,
    });
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(undefined);
    const [resolvedAddress, setResolvedAddress] = useState<LocationAddress | null>(null);
    const [locError, setLocError] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [locationSheetCollapsed, setLocationSheetCollapsed] = useState(false);
    const [identitySheetCollapsed, setIdentitySheetCollapsed] = useState(false);
    const [showInviteField, setShowInviteField] = useState(false);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const chromeRef = useRef<HTMLDivElement>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    
    // Verification code state
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

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
        if (step !== 'form') return;
        document.documentElement.setAttribute('data-auth', 'signup-map');
        return () => {
            if (document.documentElement.getAttribute('data-auth') === 'signup-map') {
                document.documentElement.removeAttribute('data-auth');
            }
        };
    }, [step]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    /** Matches server Joi / `src/utils/passwordPolicy` on NeyborHuud ServerSide (min 12, complexity, patterns, etc.). */
    const passwordPolicy = evaluatePasswordPolicy(formData.password, {
        email: formData.email,
        username: formData.username,
    });
    const isPassValid = passwordPolicy.ok;
    const canContinueIdentity =
        usernameValidation.status === 'valid' && emailValidation.status === 'valid';
    const canSubmit =
        canContinueIdentity &&
        isPassValid &&
        formData.acceptTermsAndPrivacy &&
        !loading;
    const signupStages = [
        { id: 'location', label: 'Location', icon: 'bi-geo-alt-fill' },
        { id: 'identity', label: 'Identity', icon: 'bi-person-badge' },
        { id: 'security', label: 'Secure', icon: 'bi-shield-lock' },
    ] as const;
    const activeStageIndex = signupStages.findIndex(item => item.id === signupStage);
    const huudName = resolvedAddress?.neighborhood || resolvedAddress?.lga || (location ? 'Huud point captured' : 'Finding your Huud');
    const huudRegion = [resolvedAddress?.lga, resolvedAddress?.state].filter(Boolean).join(', ') ||
        (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Choose your area on the map');
    const huudStatus = location ? 'Your street is set' : 'Find your street';
    const huudSignal = location
        ? resolvedAddress?.source === 'backend'
            ? 'Verified by neyborhuud'
            : 'Location saved'
        : 'Tap below to use GPS or the map';
    const identityHandle = formData.username.trim() ? `@${formData.username.trim()}` : '@your_name';

    const syncSignupLayout = useCallback(() => {
        const chromeH = chromeRef.current?.getBoundingClientRect().height;
        if (chromeH && chromeH > 0) {
            document.documentElement.style.setProperty('--signup-chrome-h', `${Math.ceil(chromeH)}px`);
        }
    }, []);

    const handleUsernameChange = (value: string) => {
        setFormData({
            ...formData,
            username: value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        });
    };

    const identityContinueHint = (() => {
        if (canContinueIdentity) return null;
        if (usernameValidation.status === 'checking' || emailValidation.status === 'checking') {
            return { text: 'Checking availability…', checking: true };
        }
        if (usernameValidation.status === 'taken') {
            return { text: usernameValidation.errorMessage ?? 'That @name is already taken', checking: false };
        }
        if (emailValidation.status === 'taken') {
            return { text: emailValidation.errorMessage ?? 'Email already registered', checking: false };
        }
        if (!formData.username.trim()) {
            return { text: 'Choose your @name to continue', checking: false };
        }
        if (!usernameValidation.isFormatValid) {
            return { text: 'Use letters, numbers, and underscores (3–30 chars)', checking: false };
        }
        if (usernameValidation.status !== 'valid') {
            return { text: 'Choose an available @name to continue', checking: false };
        }
        if (!formData.email.trim()) {
            return { text: 'Enter your email to continue', checking: false };
        }
        if (!emailValidation.isFormatValid) {
            return { text: 'Enter a valid email address', checking: false };
        }
        if (emailValidation.status !== 'valid') {
            return { text: 'Use an email that isn\'t already registered', checking: false };
        }
        return { text: 'Complete @name and email to continue', checking: false };
    })();

    // Handle resend verification code
    const handleResendVerification = async () => {
        if (resendCooldown > 0 || isResending) return;
        
        setIsResending(true);
        setVerificationError(null);
        setVerificationNotice(null);
        try {
            await fetchAPI('/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
            });
            setResendCooldown(60); // 60 second cooldown
            setVerificationCode(''); // Clear any entered code
            setVerificationNotice('A fresh verification code is on its way.');
        } catch (error: any) {
            const message = error.message || 'Failed to resend verification code. Please try again.';
            setVerificationError(message);
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    // Handle verification code submission
    const handleVerifyCode = async (code?: string) => {
        const codeToVerify = code || verificationCode;
        
        if (codeToVerify.length !== 6 || isVerifying) {
            return;
        }
        
        setIsVerifying(true);
        setVerificationError(null);
        setVerificationNotice(null);
        
        try {
            // Get current token — used to preserve existing auth if no new token returned
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
            
            const response = await fetchAPI('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: formData.email.trim().toLowerCase(),
                    code: codeToVerify 
                })
            });
            
            // Store/update authentication tokens if provided
            if (response.data) {
                const d = response.data;
                
                // Check for tokens in various possible locations
                const sessionToken = typeof d.session === 'object' && d.session?.access_token ? d.session.access_token : undefined;
                const accessToken = d.token ?? d.access_token ?? d.accessToken ?? sessionToken ?? null;
                
                if (accessToken) {
                    localStorage.setItem('neyborhuud_access_token', accessToken);
                }
                
                if (d.session?.refresh_token) {
                    localStorage.setItem('neyborhuud_refresh_token', d.session.refresh_token);
                }
                
                const vd = d as {
                    user?: unknown;
                    community?: unknown;
                    assignedCommunityId?: string | null;
                    needsCommunitySelection?: boolean;
                    needsGpsLocationVerification?: boolean;
                    pickerContext?: { state: string; lga: string; locationKey?: string; hint?: string };
                };
                persistAuthSessionPayload({
                    user: vd.user,
                    community: vd.community,
                    assignedCommunityId: vd.assignedCommunityId,
                    needsCommunitySelection: vd.needsCommunitySelection,
                    needsGpsLocationVerification: vd.needsGpsLocationVerification,
                    pickerContext: vd.pickerContext ?? null,
                });
                const tok = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
                if (tok) apiClient.setToken(tok);
                if (vd.needsCommunitySelection) {
                    router.push('/pick-community');
                    return;
                }
                if (vd.needsGpsLocationVerification) {
                    router.push('/verify-location');
                    return;
                }
            }
            
            setStep('success');
        } catch (error: any) {
            
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
            setGpsAccuracy(loc.accuracy);

            // Use reverse geocoding with fallback support
            const address = await reverseGeocode(loc.lat, loc.lng);

            if (address) {
                setResolvedAddress(address);
            } else {
                setResolvedAddress({
                    lga: 'Location Detected',
                    state: 'GPS Locked',
                    formatted: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                });
                setLocError('Could not resolve address - coordinates captured');
            }

            setIsResolving(false);

        } else {
            setIsResolving(false);
            setLocError("Location access denied. Please enable location permissions.");
        }
    };

    // Handle manual location adjustment from map
    const handleLocationSelect = useCallback((newLocation: { lat: number; lng: number }, newAddress: LocationAddress | null) => {
        setLocation(newLocation);
        if (newAddress) {
            setResolvedAddress(newAddress);
        }
        setLocError(null);
    }, []);

    // Fetch Location on Mount
    useEffect(() => {
        fetchLocation();
    }, []);

    // Referral: ?ref= & ?invite= & ?referral= & ?code= — backend resolves NeyborHuud username or legacy invite codes
    useEffect(() => {
        const raw =
            searchParams.get('ref') ??
            searchParams.get('invite') ??
            searchParams.get('referral') ??
            searchParams.get('code');
        if (!raw?.trim()) return;
        try {
            setReferralCodeInput(decodeURIComponent(raw.trim()));
        } catch {
            setReferralCodeInput(raw.trim());
        }
        setShowInviteField(true);
    }, [searchParams]);

    useEffect(() => {
        if (signupStage !== 'identity') return;
        const timer = window.setTimeout(() => {
            usernameInputRef.current?.focus({ preventScroll: true });
        }, 320);
        return () => window.clearTimeout(timer);
    }, [signupStage]);

    useEffect(() => {
        syncSignupLayout();
        const chromeEl = chromeRef.current;
        if (!chromeEl) return;

        const observer = new ResizeObserver(syncSignupLayout);
        observer.observe(chromeEl);
        window.addEventListener('resize', syncSignupLayout);
        window.visualViewport?.addEventListener('resize', syncSignupLayout);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', syncSignupLayout);
            window.visualViewport?.removeEventListener('resize', syncSignupLayout);
        };
    }, [signupStage, referralCodeInput, syncSignupLayout]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);

        try {
            // 1. Get fresh GPS location for submission (Wait logic)
            let finalLoc = await getCurrentLocation();

            // 2. Fallback to mount-time location if current check fails
            if (!finalLoc && location) {
                finalLoc = { lat: location.lat, lng: location.lng, accuracy: 15 };
            }

            // 3. Build Sanitize Payload
            const opt = formData.optionalProcessing;
            const signupPayload: Record<string, unknown> = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                agreeToTerms: formData.acceptTermsAndPrivacy,
                agreeToPrivacy: formData.acceptTermsAndPrivacy,
                consentMarketing: opt,
                consentAnalytics: opt,
                consentThirdParty: opt,
                // Note: assignedCommunityId and communityId are NOT sent - backend handles community assignment automatically
            };
            const refTrim = referralCodeInput.trim();
            if (refTrim) {
                signupPayload.referralCode = refTrim;
            }

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
            if (sanitizedPayload.assignedCommunityId || sanitizedPayload.communityId) {
                // Invalid state — sanitization should have removed these fields
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
                    apiClient.setToken(accessToken);
                }

                const ext = d as {
                    assignedCommunityId?: string | null;
                    needsCommunitySelection?: boolean;
                    needsGpsLocationVerification?: boolean;
                    pickerContext?: { state: string; lga: string; locationKey?: string; hint?: string };
                    emailDelivery?: { sent?: boolean; message?: string; canResend?: boolean };
                };
                persistAuthSessionPayload({
                    user,
                    community,
                    assignedCommunityId: ext.assignedCommunityId,
                    needsCommunitySelection: ext.needsCommunitySelection,
                    needsGpsLocationVerification: ext.needsGpsLocationVerification,
                    pickerContext: ext.pickerContext ?? null,
                });

                if (ext.emailDelivery?.sent === false) {
                    setVerificationError(ext.emailDelivery.message || 'Account created, but the verification email could not be sent. Please request a new code.');
                    setVerificationNotice(null);
                    setResendCooldown(0);
                } else {
                    setVerificationNotice(ext.emailDelivery?.message || 'Verification code sent.');
                    setVerificationError(null);
                    setResendCooldown(60);
                }
            }

            // Show email verification screen
            setStep('verify-email');
        } catch (error: any) {
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
            
            toast.error(`Registration Error: ${friendlyMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Email Verification Screen - OTP Code Entry (Simplified)
    if (step === 'verify-email') {
        return (
            <div className="fixed-app neu-base overflow-hidden">
                <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-2 sm:px-6">
                    <AuthBrandHeader compact subtitle="Check your email for the code." />
                    <div className="flex min-h-0 flex-1 flex-col py-2">
                        <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                            <div className="relative flex h-full min-h-[120px] items-center justify-center overflow-hidden px-6">
                                <div className="absolute left-4 top-7 h-2 w-36 rotate-12 rounded-full bg-brand-blue/16" aria-hidden />
                                <div className="absolute right-6 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-primary/14" aria-hidden />
                                <div className="absolute bottom-7 left-12 h-2 w-40 -rotate-6 rounded-full bg-brand-amber/18" aria-hidden />
                                <div className="relative w-full max-w-[19rem] overflow-hidden rounded-[1.6rem] border border-white/85 bg-white/[0.92] shadow-[0_26px_64px_rgba(26,26,46,0.16)] backdrop-blur-xl">
                                    <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                                    <div className="p-4">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_16px_34px_rgba(0,111,53,0.3)]">
                                                <i className="bi bi-shield-check text-xl" aria-hidden />
                                            </div>
                                            <div className="rounded-full border border-charcoal/5 bg-brand-surface px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                                                One-time code
                                            </div>
                                        </div>
                                        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.24em] text-primary">{verificationError ? 'Try again' : 'Almost there'}</p>
                                        <h2 className="truncate text-2xl font-black tracking-tighter text-brand-black">Check your email</h2>
                                        <p className="truncate text-[11px] font-semibold text-[var(--neu-text-muted)]">{formData.email}</p>
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[var(--neu-text-secondary)]">
                                            <i className="bi bi-geo-alt-fill text-primary" aria-hidden />
                                            <span className="truncate">{huudName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                            <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                            <div className="flex flex-col gap-4 p-4">
                                <OTPInput
                                    length={6}
                                    value={verificationCode}
                                    onChange={setVerificationCode}
                                    onComplete={handleVerifyCode}
                                    disabled={isVerifying}
                                    error={!!verificationError}
                                    autoFocus={true}
                                />

                                {verificationError && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-brand-red/15 bg-brand-red/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-brand-red">
                                        <i className="bi bi-exclamation-circle-fill mt-0.5 shrink-0" aria-hidden />
                                        <span>{verificationError}</span>
                                    </div>
                                )}
                                {verificationNotice && !verificationError && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-primary">
                                        <i className="bi bi-check-circle-fill mt-0.5 shrink-0" aria-hidden />
                                        <span>{verificationNotice}</span>
                                    </div>
                                )}

                                <div className="auth-signup-actions">
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resendCooldown > 0 || isResending}
                                        className="auth-btn auth-btn-secondary"
                                    >
                                        <i className={`bi shrink-0 ${isResending ? 'bi-arrow-repeat animate-spin' : 'bi-send'}`} aria-hidden />
                                        <span>{isResending ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleVerifyCode()}
                                        disabled={verificationCode.length !== 6 || isVerifying}
                                        className="auth-btn auth-btn-primary"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                                                <span>Verifying</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Verify</span>
                                                <i className="bi bi-arrow-right shrink-0" aria-hidden />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('form');
                                        setVerificationCode('');
                                        setVerificationError(null);
                                        setVerificationNotice(null);
                                    }}
                                    className="text-center text-xs font-semibold text-[var(--neu-text-muted)] transition-colors hover:text-primary"
                                >
                                    Edit signup details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success Screen (after verification or skip)
    if (step === 'success') {
        return (
            <div className="fixed-app neu-base overflow-hidden">
                <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-5 pb-4 pt-2 sm:px-6">
                    <AuthBrandHeader compact subtitle="You&apos;re in. Welcome to the Huud." />
                    <div className="flex min-h-0 flex-1 flex-col py-2">
                        <div className="-mx-5 min-h-0 flex-1 overflow-hidden bg-white/[0.76] shadow-inner sm:-mx-6">
                            <div className="relative flex h-full items-center justify-center overflow-hidden px-6">
                                <div className="absolute left-4 top-8 h-2 w-36 rotate-12 rounded-full bg-primary/16" aria-hidden />
                                <div className="absolute right-8 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-brand-amber/18" aria-hidden />
                                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/12 bg-primary/[0.035]">
                                    <div className="absolute h-24 w-24 rounded-full border border-brand-blue/20 bg-brand-blue/[0.04]" aria-hidden />
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary text-white shadow-[0_24px_54px_rgba(0,111,53,0.32)]">
                                        <i className="bi bi-person-check-fill text-4xl" aria-hidden />
                                    </div>
                                </div>
                                <div className="absolute bottom-5 left-1/2 w-[min(19rem,calc(100%-3rem))] -translate-x-1/2 rounded-2xl border border-white/85 bg-white/[0.9] px-4 py-3 shadow-[0_18px_40px_rgba(26,26,46,0.12)] backdrop-blur-xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">You&apos;re in</p>
                                    <h2 className="truncate text-2xl font-black tracking-tighter text-brand-black">Welcome, Neybor</h2>
                                    <p className="truncate text-[11px] font-semibold text-[var(--neu-text-muted)]">{identityHandle} · {huudName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
                            <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                            <div className="flex flex-col gap-4 p-4">
                                <div className="flex items-center justify-between rounded-2xl border border-charcoal/5 bg-brand-surface px-4 py-3">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCoins</p>
                                        <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Signup reward unlocked</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="text-3xl font-black leading-none">20</span>
                                        <i className="bi bi-coin text-xl text-brand-amber" aria-hidden />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (getNeedsCommunitySelection()) {
                                            router.push('/pick-community');
                                            return;
                                        }
                                        router.push(getAppEntryRoute());
                                    }}
                                    className="auth-btn auth-btn-primary"
                                >
                                    Enter your Huud
                                    <i className="bi bi-arrow-right" aria-hidden />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="auth-signup-page fixed-app overflow-hidden">
            <div
                className={[
                    'auth-signup-map-layer',
                    signupStage !== 'location' ? 'auth-signup-map-layer--readonly' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <LocationPicker
                    initialLocation={location}
                    accuracy={gpsAccuracy}
                    onLocationSelect={handleLocationSelect}
                    isDetecting={isResolving && !location}
                    error={locError}
                    onRetry={fetchLocation}
                    mapHeight="signup-fullscreen"
                    defaultCenter={SIGNUP_MAP_DEFAULT}
                    readOnly={signupStage !== 'location'}
                    label="Huud point"
                    presentation="premium"
                />
                <div
                    className={[
                        'auth-signup-map-scrim',
                        signupStage === 'location'
                            ? locationSheetCollapsed
                                ? ' auth-signup-map-scrim--sheet-collapsed'
                                : ''
                            : ' auth-signup-map-scrim--preview',
                        signupStage === 'identity' && identitySheetCollapsed
                            ? ' auth-signup-map-scrim--sheet-collapsed'
                            : '',
                    ].join('')}
                    aria-hidden
                />
            </div>

            <div ref={chromeRef} className="auth-signup-chrome">
                <div className="auth-signup-top">
                    <NeyborHuudLogo layout="wordmark" size="md" textSize={22} tone="light" />
                    <div className="auth-signup-progress" role="tablist" aria-label="Signup progress">
                        {signupStages.map((item, index) => {
                            const isActive = signupStage === item.id;
                            const isDone = index < activeStageIndex;
                            const canOpen =
                                signupStage === 'location'
                                    ? item.id === 'location'
                                    : index <= activeStageIndex ||
                                      item.id === 'identity' ||
                                      (item.id === 'security' && canContinueIdentity);

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    onClick={() => {
                                        if (item.id === 'security' && !canContinueIdentity) return;
                                        if (canOpen) setSignupStage(item.id);
                                    }}
                                    disabled={!canOpen}
                                    className={`auth-signup-progress__dot${isActive ? ' auth-signup-progress__dot--active' : ''}${isDone ? ' auth-signup-progress__dot--done' : ''}${!canOpen ? ' auth-signup-progress__dot--disabled' : ''}`}
                                    aria-current={isActive ? 'step' : undefined}
                                    aria-label={`Step ${index + 1}: ${SIGNUP_STAGE_LABELS[item.id]}`}
                                />
                            );
                        })}
                    </div>
                    <p className="auth-signup-progress__label">
                        Step {activeStageIndex + 1} of 3 · {SIGNUP_STAGE_LABELS[signupStage]}
                    </p>
                </div>

                {referralCodeInput.trim() ? (
                    <div className="mt-2 shrink-0 rounded-xl border border-white/20 bg-black/35 px-3 py-2 backdrop-blur-md">
                        <p className="text-[10px] font-medium leading-relaxed text-white/80">
                            Invite: <span className="font-bold text-[var(--landing-green,#00d431)]">{referralCodeInput.trim()}</span>
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="auth-signup-map-spacer" aria-hidden />

            {signupStage === 'location' && (
                <SignupBottomSheet
                    ariaLabel="Your street"
                    stageKey="location"
                    onCollapsedChange={setLocationSheetCollapsed}
                    peek={
                        <div className="auth-signup-location-peek">
                            <span className="auth-signup-location-peek__icon" aria-hidden>
                                <i className="bi bi-geo-alt-fill" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="auth-signup-location-peek__label">{huudStatus}</p>
                                <p className="auth-signup-location-peek__name truncate">{huudName}</p>
                            </div>
                            <span className="auth-signup-location-peek__chevron" aria-hidden>
                                <i className={`bi ${locationSheetCollapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                            </span>
                        </div>
                    }
                >
                        <div className="mb-3 flex items-center gap-3">
                            <div className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-[0_18px_34px_rgba(0,111,53,0.34)]">
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-primary shadow-md">N</span>
                                <i className="bi bi-geo-alt-fill text-xl" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">{huudStatus}</p>
                                    <span className="h-1 w-1 rounded-full bg-brand-blue/60" aria-hidden />
                                    <p className="truncate text-[9px] font-bold uppercase tracking-wider text-brand-blue">{huudSignal}</p>
                                </div>
                                <h2 className="truncate text-[1.35rem] font-black tracking-tighter text-brand-black">{huudName}</h2>
                                <p className="truncate text-[11px] font-medium text-[var(--neu-text-muted)]">{huudRegion}</p>
                            </div>
                        </div>
                        {locError ? (
                            <div className="mb-3 flex items-start gap-2 rounded-xl border border-brand-red/15 bg-brand-red/10 px-3 py-2 text-[11px] font-semibold leading-relaxed text-brand-red">
                                <i className="bi bi-exclamation-circle-fill mt-0.5 shrink-0" aria-hidden />
                                <span>{locError}</span>
                            </div>
                        ) : null}
                        <p className="mb-3 text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                            Tap or drag the map to adjust
                        </p>
                        <div className="auth-signup-actions">
                            <button
                                type="button"
                                onClick={fetchLocation}
                                disabled={isResolving}
                                className="auth-btn auth-btn-secondary disabled:opacity-40"
                            >
                                <i className={`bi shrink-0 ${isResolving ? 'bi-arrow-repeat animate-spin' : 'bi-broadcast'}`} aria-hidden />
                                <span>{isResolving ? 'Finding…' : 'Use my location'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignupStage('identity')}
                                className="auth-btn auth-btn-primary"
                            >
                                <span>Continue</span>
                                <i className="bi bi-arrow-right shrink-0" aria-hidden />
                            </button>
                        </div>
                        <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                            Already on the Huud?{' '}
                            <Link href="/login">Enter your Huud</Link>
                        </p>
                </SignupBottomSheet>
            )}

            {signupStage === 'identity' && (
                <SignupBottomSheet
                    ariaLabel="Pick your @name"
                    stageKey="identity"
                    keyboardAware
                    onCollapsedChange={setIdentitySheetCollapsed}
                    peek={
                        <div className="auth-signup-identity-peek">
                            <span className="auth-signup-identity-peek__avatar" aria-hidden>
                                @
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="auth-signup-identity-peek__label">Pick your @name</p>
                                <p className="auth-signup-identity-peek__name truncate">{identityHandle}</p>
                            </div>
                            <span className="auth-signup-identity-peek__chevron" aria-hidden>
                                <i className={`bi ${identitySheetCollapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                            </span>
                        </div>
                    }
                    footer={
                        <div>
                            <div className="auth-signup-actions">
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('location')}
                                    className="auth-btn auth-btn-secondary"
                                >
                                    <i className="bi bi-arrow-left shrink-0" aria-hidden />
                                    <span>Back</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('security')}
                                    disabled={!canContinueIdentity}
                                    className="auth-btn auth-btn-primary"
                                >
                                    <span>Continue</span>
                                    <i className="bi bi-arrow-right shrink-0" aria-hidden />
                                </button>
                            </div>
                            {identityContinueHint ? (
                                <p
                                    className={`auth-signup-continue-hint${identityContinueHint.checking ? ' auth-signup-continue-hint--checking' : ''}`}
                                    role="status"
                                    aria-live="polite"
                                >
                                    {identityContinueHint.text}
                                </p>
                            ) : null}
                        </div>
                    }
                >
                    <div className="auth-signup-identity-card">
                        <span className="auth-signup-identity-card__avatar" aria-hidden>
                            @
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="auth-signup-identity-card__eyebrow">Your Huud identity</p>
                            <p className="auth-signup-identity-card__handle truncate">{identityHandle}</p>
                            <p className="auth-signup-identity-card__meta truncate">
                                Joining · {huudName}
                                {huudRegion ? ` · ${huudRegion}` : ''}
                            </p>
                        </div>
                        {usernameValidation.status === 'valid' ? (
                            <span className="auth-signup-identity-card__badge">Available</span>
                        ) : null}
                    </div>

                    <p className="auth-signup-sheet-subcopy mb-3 text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                        This is how neighbors find you on the Huud
                    </p>

                    <div className="auth-signup-sheet-fields flex flex-col gap-3">
                        <PremiumInput
                            label="@name"
                            prefix="@"
                            placeholder="nancy_surulere"
                            className="py-0.5"
                            value={formData.username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            inputRef={usernameInputRef}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="text"
                            autoComplete="username"
                            validationStatus={usernameValidation.status}
                            error={usernameValidation.errorMessage || undefined}
                            successText="Username available"
                            takenText="This @name is already taken"
                            invalidText="Letters, numbers, and underscores only (3–30 chars)"
                            checkingText="Checking @name…"
                            helperText="Letters, numbers, underscores · 3–30 chars"
                        />
                        <PremiumInput
                            label="Email"
                            type="email"
                            icon="bi-envelope"
                            placeholder="nancy@example.com"
                            className="py-0.5"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            autoComplete="email"
                            inputMode="email"
                            validationStatus={emailValidation.status}
                            error={emailValidation.errorMessage || undefined}
                            successText={emailValidation.status === 'valid' ? 'Email available' : undefined}
                            takenText="This email is already registered"
                            invalidText="Please enter a valid email address"
                            checkingText="Checking email…"
                        />
                        {showInviteField ? (
                            <PremiumInput
                                label="Invite"
                                icon="bi-gift"
                                placeholder="Username or invite code"
                                className="py-0.5"
                                value={referralCodeInput}
                                onChange={(e) => setReferralCodeInput(e.target.value)}
                            />
                        ) : (
                            <button
                                type="button"
                                className="auth-signup-invite-toggle"
                                onClick={() => setShowInviteField(true)}
                            >
                                <i className="bi bi-gift" aria-hidden />
                                Have an invite code?
                            </button>
                        )}
                    </div>
                </SignupBottomSheet>
            )}

            {signupStage === 'security' && (
                <SignupBottomSheet ariaLabel="Secure your Huud" stageKey="security">
                        <div className="auth-signup-sheet__head">
                            <h2 className="auth-signup-sheet__title">Secure your Huud</h2>
                        </div>
                        <div className="auth-signup-sheet-fields flex flex-col gap-3">
                            <PremiumInput
                                label="Secure Password"
                                type="password"
                                icon="bi-lock"
                                placeholder="12+ chars, mixed case, number"
                                className="py-1"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <PasswordStrengthMeter
                                password={formData.password}
                                email={formData.email}
                                username={formData.username}
                                showChecklist={false}
                            />
                            {!isPassValid && formData.password.length > 0 && (
                                <p className="px-1 text-[10px] text-[var(--neu-text-muted)]">
                                    {passwordPolicy.ok ? '' : passwordPolicy.message}
                                </p>
                            )}

                            <div className="flex flex-col gap-2 rounded-2xl border border-charcoal/10 bg-white/[0.92] px-3 py-3 shadow-[0_12px_32px_rgba(26,26,46,0.08)]">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="acceptTermsAndPrivacy"
                                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                                        checked={formData.acceptTermsAndPrivacy}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                acceptTermsAndPrivacy: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="text-[11px] font-medium leading-relaxed text-[var(--neu-text-secondary)]">
                                        I agree to the <span className="font-black text-brand-blue">Community Rules</span> and <span className="font-black text-brand-blue">Terms of Service</span>, and I have read the <span className="font-black text-brand-blue">Privacy Policy</span>. I consent to the processing of my personal data needed to run my account, including under Nigerian data protection law (<span className="font-black text-brand-black">NDPA / NDPR</span>).
                                    </span>
                                </label>
                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/5 bg-brand-surface px-3 py-2.5">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
                                        checked={formData.optionalProcessing}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                optionalProcessing: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="text-[11px] font-medium leading-relaxed text-[var(--neu-text-secondary)]">
                                        Product updates, offers, analytics, and limited partner use as described in the Privacy Policy.
                                    </span>
                                </label>
                            </div>

                            <div className="auth-signup-actions">
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('identity')}
                                    className="auth-btn auth-btn-secondary"
                                >
                                    <i className="bi bi-arrow-left shrink-0" aria-hidden />
                                    <span>Back</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="auth-btn auth-btn-primary"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                                            <span>Joining…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Join neyborhuud</span>
                                            <i className="bi bi-arrow-right shrink-0" aria-hidden />
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="auth-signin-link auth-signin-link--sheet border-t border-charcoal/8 pt-3">
                                Already on the Huud?{' '}
                                <Link href="/login">Enter your Huud</Link>
                            </p>
                        </div>
                </SignupBottomSheet>
            )}
        </form>
    );
}

export default function SignupPage() {
    return (
        <Suspense
            fallback={
                <div className="h-[100dvh] neu-base flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
                </div>
            }
        >
            <SignupPageContent />
        </Suspense>
    );
}
