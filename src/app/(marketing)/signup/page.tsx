'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { OTPInput } from '@/components/ui/OTPInput';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { getCurrentLocation } from '@/lib/geolocation';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';
import {
    isUserEmailVerified,
    isValidEmailVerificationCode,
    resolvePostVerifyRoute,
} from '@/lib/authSession';
import { getNeedsCommunitySelection } from '@/lib/communityContext';
import { getPostSetupRoute } from '@/lib/onboarding';
import { authService } from '@/services/auth.service';
import { useEmailValidation, useUsernameValidation } from '@/hooks/useEmailValidation';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';
import { toast } from 'sonner';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { LEGAL_LINKS } from '@/components/legal/LegalDocumentPage';
import { useMyGamificationStats } from '@/hooks/useGamification';

import { SIGNUP_MAP_DEFAULT } from '@/lib/signupMap';

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
    const verifyInFlightRef = useRef(false);

    // Email & Username validation hooks
    const emailValidation = useEmailValidation({ debounceMs: 600, checkAvailability: true });
    const usernameValidation = useUsernameValidation({ debounceMs: 600, checkAvailability: true });
    const { data: gamificationStats } = useMyGamificationStats();
    const signupCoinBalance =
        typeof gamificationStats?.totalHuudCoins === 'number'
            ? gamificationStats.totalHuudCoins
            : null;

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
        document.documentElement.setAttribute('data-auth', 'signup-map');
        return () => {
            if (document.documentElement.getAttribute('data-auth') === 'signup-map') {
                document.documentElement.removeAttribute('data-auth');
            }
        };
    }, []);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    useEffect(() => {
        if (step !== 'verify-email') return;
        setVerificationCode('');
        setVerificationError(null);
        setVerificationNotice(null);
        verifyInFlightRef.current = false;
    }, [step]);

    /** Matches server Joi / `src/utils/passwordPolicy` on NeyborHuud ServerSide (min 12, complexity, patterns, etc.). */
    const passwordPolicy = evaluatePasswordPolicy(formData.password, {
        email: formData.email,
        username: formData.username,
    });
    const isPassValid = passwordPolicy.ok;
    const canContinueIdentity =
        usernameValidation.status === 'valid' && emailValidation.status === 'valid';
    const canContinueLocation = location !== null && !isResolving;
    const canSubmit =
        canContinueIdentity &&
        isPassValid &&
        formData.acceptTermsAndPrivacy &&
        !loading;
    const signupStages = [
        { id: 'location', label: 'Location', icon: 'location_on' },
        { id: 'identity', label: 'Identity', icon: 'badge' },
        { id: 'security', label: 'Secure', icon: 'lock' },
    ] as const;
    const activeStageIndex = signupStages.findIndex(item => item.id === signupStage);
    const huudName = resolvedAddress?.neighborhood || resolvedAddress?.lga || (location ? 'Huud point captured' : 'Finding your Huud');
    const huudRegion = [resolvedAddress?.lga, resolvedAddress?.state].filter(Boolean).join(', ') ||
        (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Choose your area on the map');
    const huudStatus = location ? 'Your street is set' : 'Find your street';
    const huudSignal = location
        ? resolvedAddress?.source === 'backend'
            ? 'Verified by NeyborHuud'
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
            await authService.resendVerificationEmail(formData.email);
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
    const advanceAfterVerified = () => {
        const gateRoute = resolvePostVerifyRoute();
        if (gateRoute) {
            router.push(gateRoute);
            return;
        }
        setStep('success');
    };

    const handleVerifyCode = async () => {
        const codeToVerify = verificationCode.trim();

        if (!isValidEmailVerificationCode(codeToVerify) || isVerifying || verifyInFlightRef.current) {
            if (codeToVerify.length > 0 && !isValidEmailVerificationCode(codeToVerify)) {
                setVerificationError('Enter all 6 digits, then tap Verify.');
            }
            return;
        }

        verifyInFlightRef.current = true;
        setIsVerifying(true);
        setVerificationError(null);
        setVerificationNotice(null);

        try {
            const response = await authService.verifyEmailWithCode(
                formData.email,
                codeToVerify,
            );

            if (!response.success) {
                throw new Error(response.message || 'Verification failed. Please try again.');
            }

            const verifiedUser = response.data?.user;
            if (verifiedUser && !isUserEmailVerified(verifiedUser)) {
                throw new Error('That code was not accepted. Check your email and try again.');
            }

            advanceAfterVerified();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Verification failed. Please try again.';
            const normalized = message.toLowerCase();
            if (normalized.includes('already verified')) {
                advanceAfterVerified();
                return;
            }
            if (normalized.includes('expired')) {
                setVerificationError('Code expired. Please request a new one.');
            } else if (normalized.includes('invalid') || normalized.includes('incorrect')) {
                setVerificationError('Invalid code. Please check and try again.');
            } else if (normalized.includes('attempts')) {
                setVerificationError('Too many attempts. Please request a new code.');
            } else {
                setVerificationError(message || 'Verification failed. Please try again.');
            }

            setVerificationCode('');
        } finally {
            setIsVerifying(false);
            verifyInFlightRef.current = false;
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

            const response = await authService.register(
                sanitizedPayload as import('@/types/api').RegisterPayload,
            );

            if (response.success && response.data) {
                const ext = response.data;

                if (isUserEmailVerified(ext.user)) {
                    setVerificationNotice('Your email is already verified.');
                    setVerificationError(null);
                    advanceAfterVerified();
                    return;
                }

                if (ext.emailDelivery?.sent === false) {
                    setVerificationError(ext.emailDelivery.message || 'Account created, but the verification email could not be sent. Please request a new code.');
                    setVerificationNotice(null);
                    setResendCooldown(0);
                } else {
                    setVerificationNotice(ext.emailDelivery?.message || 'Verification code sent.');
                    setVerificationError(null);
                    setResendCooldown(60);
                }
            } else if (!response.success) {
                throw new Error(response.message || 'Registration failed');
            }

            setVerificationCode('');
            setStep('verify-email');
        } catch (error: unknown) {
            const err = error as { message?: string; status?: number; response?: { status?: number; data?: { message?: string } } };
            const backendMsg = err.response?.data?.message?.trim();
            let friendlyMsg = backendMsg || err.message || 'Registration failed';
            const status = err.status ?? err.response?.status;

            if (friendlyMsg.includes('Failed to create user')) {
                friendlyMsg = "Registration failed. Please check:\n- All required fields are filled\n- Email is valid and not already registered\n- Username is available\n- Password meets requirements";
            } else if (friendlyMsg.includes('query of #<IncomingMessage>')) {
                friendlyMsg = "The backend server is currently having trouble processing requests. Our engineers are on it!";
            } else if (err.status && err.status >= 500 && !backendMsg) {
                friendlyMsg = "Server error occurred. Please try again or contact support if the issue persists.";
            } else if (friendlyMsg.includes('Load failed') || friendlyMsg.includes('Failed to fetch')) {
                friendlyMsg = "Could not reach the server. Please check your connection and try again.";
            }

            toast.error(`Registration Error: ${friendlyMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Email Verification Screen - OTP Code Entry
    if (step === 'verify-email') {
        return (
            <AuthFlowPage
                ariaLabel="Verify email"
                stageKey="signup-verify-email"
                stepLabel="Verify email"
                onBackClick={() => {
                    setStep('form');
                    setVerificationCode('');
                    setVerificationError(null);
                    setVerificationNotice(null);
                }}
                backLabel="Edit signup details"
                keyboardAware
                hero={
                    <AuthFlowHero
                        icon="verified_user"
                        eyebrow={verificationError ? 'Try again' : 'Almost there'}
                        title="Check your email"
                        meta={`${formData.email} · ${huudName}`}
                        error={!!verificationError}
                    />
                }
                footer={
                    <div className="auth-signup-actions">
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendCooldown > 0 || isResending}
                            className="auth-btn auth-btn-secondary"
                        >
                            <span className={`material-symbols-outlined shrink-0 text-[1.125rem] ${isResending ? 'animate-spin' : ''}`} aria-hidden="true">{isResending ? 'progress_activity' : 'send'}</span>
                            <span>{isResending ? 'Sending' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleVerifyCode()}
                            disabled={!isValidEmailVerificationCode(verificationCode) || isVerifying}
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
                                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <OTPInput
                        length={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                        disabled={isVerifying}
                        error={!!verificationError}
                        autoFocus
                    />
                    <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                        Enter all 6 digits, then tap Verify
                    </p>
                    {verificationError ? (
                        <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                            <span className="material-symbols-outlined shrink-0" aria-hidden="true">error</span>
                            <span>{verificationError}</span>
                        </div>
                    ) : verificationNotice ? (
                        <div className="auth-flow-notice auth-flow-notice--success">
                            <span className="material-symbols-outlined shrink-0" aria-hidden="true">check_circle</span>
                            <span>{verificationNotice}</span>
                        </div>
                    ) : null}
                </div>
            </AuthFlowPage>
        );
    }

    // Success Screen (after verification)
    if (step === 'success') {
        return (
            <AuthFlowPage
                ariaLabel="Welcome to the Huud"
                stageKey="signup-success"
                stepLabel="You're in"
                landingBackdrop={false}
                mapLocation={location}
                hero={
                    <AuthFlowHero
                        icon="how_to_reg"
                        eyebrow="You're in"
                        title="Welcome, Neybor"
                        meta={`${identityHandle} · ${huudName}`}
                    />
                }
                footer={
                    <button
                        type="button"
                        onClick={() => {
                            if (getNeedsCommunitySelection()) {
                                router.push('/pick-community');
                                return;
                            }
                            router.push(getPostSetupRoute());
                        }}
                        className="auth-btn auth-btn-primary"
                    >
                        <span>{getNeedsCommunitySelection() ? 'Pick your Huud' : 'Enter my Huud'}</span>
                        <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                    </button>
                }
            >
                <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCoins</p>
                        <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Signup reward unlocked</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                        <span className="text-3xl font-black leading-none">
                            {signupCoinBalance ?? '—'}
                        </span>
                        <span className="material-symbols-outlined text-xl text-status-warning" aria-hidden="true">toll</span>
                    </div>
                </div>
                {signupCoinBalance === null ? (
                    <p className="text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                        Your wallet balance will appear once rewards sync
                    </p>
                ) : null}
            </AuthFlowPage>
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
                                <span className="material-symbols-outlined"  aria-hidden="true">location_on</span>
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="auth-signup-location-peek__label">{huudStatus}</p>
                                <p className="auth-signup-location-peek__name truncate">{huudName}</p>
                            </div>
                            <span className="auth-signup-location-peek__chevron" aria-hidden="true">
                                <span className="material-symbols-outlined text-[1rem]" aria-hidden="true">{locationSheetCollapsed ? 'expand_less' : 'expand_more'}</span>
                            </span>
                        </div>
                    }
                    footer={
                        <div>
                            <div className="auth-signup-actions">
                                <button
                                    type="button"
                                    onClick={fetchLocation}
                                    disabled={isResolving}
                                    className="auth-btn auth-btn-secondary disabled:opacity-40"
                                >
                                    <span className={`material-symbols-outlined shrink-0 text-[1.125rem] ${isResolving ? 'animate-spin' : ''}`} aria-hidden="true">{isResolving ? 'progress_activity' : 'cell_tower'}</span>
                                    <span>{isResolving ? 'Finding…' : 'Use my location'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('identity')}
                                    disabled={!canContinueLocation}
                                    className="auth-btn auth-btn-primary disabled:opacity-40"
                                >
                                    <span>Confirm my street</span>
                                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                                </button>
                            </div>
                            {!canContinueLocation ? (
                                <p className="mt-2 text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                                    Use GPS or tap the map to set your street before continuing
                                </p>
                            ) : null}
                            <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                                Already on the Huud?{' '}
                                <Link href="/login">Enter your Huud</Link>
                            </p>
                        </div>
                    }
                >
                        <div className="mb-3 flex items-center gap-3">
                            <div className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-[0_18px_34px_rgba(0,111,53,0.34)]">
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-primary shadow-md">N</span>
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">location_on</span>
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
                                <span className="material-symbols-outlined mt-0.5 shrink-0" aria-hidden="true">error</span>
                                <span>{locError}</span>
                            </div>
                        ) : null}
                        <p className="mb-0 text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                            Tap or drag the map to adjust
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
                            <span className="auth-signup-identity-peek__chevron" aria-hidden="true">
                                <span className="material-symbols-outlined text-[1rem]" aria-hidden="true">{identitySheetCollapsed ? 'expand_less' : 'expand_more'}</span>
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
                                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_back</span>
                                    <span>Back</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('security')}
                                    disabled={!canContinueIdentity}
                                    className="auth-btn auth-btn-primary"
                                >
                                    <span>Set up my profile</span>
                                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
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
                            icon="mail"
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
                                icon="redeem"
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
                                <span className="material-symbols-outlined" aria-hidden="true">redeem</span>
                                Have an invite code?
                            </button>
                        )}
                    </div>
                </SignupBottomSheet>
            )}

            {signupStage === 'security' && (
                <SignupBottomSheet
                    ariaLabel="Secure your Huud"
                    stageKey="security"
                    footer={
                        <div>
                            <div className="auth-signup-actions">
                                <button
                                    type="button"
                                    onClick={() => setSignupStage('identity')}
                                    className="auth-btn auth-btn-secondary"
                                >
                                    <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_back</span>
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
                                            <span>Join NeyborHuud</span>
                                            <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                                Already on the Huud?{' '}
                                <Link href="/login">Enter your Huud</Link>
                            </p>
                        </div>
                    }
                >
                        <div className="auth-signup-sheet__head">
                            <h2 className="auth-signup-sheet__title">Secure your Huud</h2>
                        </div>
                        <div className="auth-signup-sheet-fields flex flex-col gap-3">
                            <PremiumInput
                                label="Secure Password"
                                type="password"
                                icon="lock"
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

                            <div className="flex flex-col gap-2 rounded-2xl border border-charcoal/10 bg-[#f8faf8] px-3 py-3">
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
                                        I agree to the{' '}
                                        <Link href={LEGAL_LINKS.communityRules} className="font-black text-brand-blue underline-offset-2 hover:underline">
                                            Community Rules
                                        </Link>{' '}
                                        and{' '}
                                        <Link href={LEGAL_LINKS.termsOfService} className="font-black text-brand-blue underline-offset-2 hover:underline">
                                            Terms of Service
                                        </Link>
                                        , and I have read the{' '}
                                        <Link href={LEGAL_LINKS.privacyPolicy} className="font-black text-brand-blue underline-offset-2 hover:underline">
                                            Privacy Policy
                                        </Link>
                                        . I consent to the processing of my personal data needed to run my account, including under Nigerian data protection law (<span className="font-black text-brand-black">NDPA / NDPR</span>).
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
                                        Product updates, offers, analytics, and limited partner use as described in the{' '}
                                        <Link href={LEGAL_LINKS.privacyPolicy} className="font-black text-brand-blue underline-offset-2 hover:underline">
                                            Privacy Policy
                                        </Link>
                                        .
                                    </span>
                                </label>
                            </div>
                        </div>
                </SignupBottomSheet>
            )}
        </form>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<AuthFlowLoading />}>
            <SignupPageContent />
        </Suspense>
    );
}
