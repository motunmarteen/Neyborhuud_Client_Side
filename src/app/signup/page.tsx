'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { getCurrentLocation } from '@/lib/geolocation';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';
import { fetchAPI } from '@/lib/api';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'success'>('form');
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

    // Password Validation States
    const passRules = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*]/.test(formData.password),
    };
    const isPassValid = Object.values(passRules).every(Boolean);

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
                };

                signupPayload.deviceLocation = {
                    lat: Number(lat),
                    lng: Number(lng),
                    accuracy: Number(finalLoc?.accuracy || 15)
                };
            }

            const response = await fetchAPI('/auth/register', {
                method: 'POST',
                body: JSON.stringify(signupPayload)
            });

            // Store authentication tokens and user data
            if (response.success && response.data?.session) {
                const { session, user } = response.data;

                // Store tokens in localStorage
                localStorage.setItem('neyborhuud_access_token', session.access_token);
                if (session.refresh_token) {
                    localStorage.setItem('neyborhuud_refresh_token', session.refresh_token);
                }

                // Store user data
                if (user) {
                    localStorage.setItem('neyborhuud_user', JSON.stringify(user));
                }

                console.log('✅ Authentication tokens stored successfully');
            }

            setStep('success');
        } catch (error: any) {
            console.error("DIAGNOSTIC LOG:", error);
            const friendlyMsg = error.message.includes('query of #<IncomingMessage>')
                ? "The backend server is currently having trouble processing requests. Our engineers are on it!"
                : error.message;
            alert(`⚠️ Connection Issue: ${friendlyMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="h-[100dvh] bg-soft-bg flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
                <div className="neumorphic-extreme rounded-[3rem] w-full max-w-sm p-10 bg-white/40 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl"></div>

                    <div className="w-24 h-24 rounded-full neumorphic-inset flex items-center justify-center mb-8 relative z-10">
                        <i className="bi bi-person-check-fill text-5xl text-neon-green"></i>
                    </div>

                    <h1 className="text-2xl font-light text-charcoal mb-2 relative z-10 uppercase tracking-tighter">Welcome, Neyborh!</h1>
                    <p className="text-deep-text/50 text-xs mb-8 font-light uppercase tracking-widest relative z-10">Account Secured</p>

                    <div className="flex flex-col items-center gap-1 mb-10 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-6xl font-black text-neon-green leading-none italic">20</span>
                            <i className="bi bi-coin text-3xl text-yellow-400"></i>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/40 mt-2">HuudCoins Earnt</span>
                    </div>

                    <button
                        onClick={() => router.push('/complete-profile')}
                        className="neumorphic-btn w-full py-6 rounded-2xl group transition-all mb-4 relative z-10"
                    >
                        <span className="text-charcoal font-black uppercase tracking-widest text-xs group-hover:text-neon-green transition-colors">
                            Claim 100 More Coins
                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/feed')}
                        className="text-charcoal/30 hover:text-charcoal/60 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10"
                    >
                        I'll do this later
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-soft-bg flex flex-col px-6 py-6 max-w-md mx-auto overflow-hidden">
            {/* Header */}
            <div className="mt-4 mb-4">
                <h1 className="text-4xl font-light text-charcoal tracking-tighter leading-none">Join the <span className="text-neon-green italic">Huud</span></h1>
                <p className="text-deep-text/50 font-light mt-2 text-base">Your journey to local prosperity starts here.</p>
            </div>

            {/* Location status */}
            <div className={`
                flex items-center justify-between p-2.5 rounded-xl mb-4 transition-all
                ${location ? 'bg-neon-green/5 ring-1 ring-neon-green/20' : 'bg-charcoal/5'}
            `}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${location ? 'bg-neon-green animate-pulse' : 'bg-charcoal/30'}`}></div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-charcoal/40 truncate">
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
                />
                <PremiumInput
                    label="Email"
                    type="email"
                    icon="bi-envelope"
                    placeholder="nancy@example.com"
                    className="py-1"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                        className="w-4 h-4 accent-neon-green"
                        checked={formData.agree}
                        onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                    />
                    <label htmlFor="agree" className="text-[10px] text-charcoal/40 font-light leading-tight">
                        I agree to the <span className="text-brand-blue underline font-bold">Rules</span> and <span className="text-brand-blue underline font-bold">Policy</span>.
                    </label>
                </div>

                <button
                    disabled={loading || !isPassValid || !formData.username || !formData.email || !formData.agree}
                    className={`
                        neumorphic-btn py-4.5 rounded-2xl mt-2 transition-all duration-300
                        ${(loading || !isPassValid || !formData.username || !formData.email || !formData.agree) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
                    `}
                >
                    <span className="text-charcoal font-black uppercase tracking-widest text-sm">
                        {loading ? 'Processing...' : 'Create Account'}
                    </span>
                </button>
            </form>

            <div className="mt-auto pb-4 text-center">
                <p className="text-charcoal/40 text-[10px] font-light uppercase tracking-tighter">
                    Already a Neyborh? <Link href="/login" className="text-brand-blue font-bold">Log in</Link>
                </p>
            </div>
        </div>
    );
}

const Rule = ({ label, met }: { label: string, met: boolean }) => (
    <div className="flex items-center gap-2">
        <i className={`bi ${met ? 'bi-check-circle-fill text-neon-green' : 'bi-circle text-charcoal/10'} text-[10px]`}></i>
        <span className={`text-[9px] uppercase tracking-wider ${met ? 'text-charcoal' : 'text-charcoal/20'}`}>{label}</span>
    </div>
);
