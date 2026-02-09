'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Link from 'next/link';
import { getCurrentLocation } from '@/lib/geolocation';
import { fetchAPI } from '@/lib/api';
import apiClient from '@/lib/api-client';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get GPS location as per guide
            const deviceLocation = await getCurrentLocation();

            const response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    identifier: formData.email,
                    password: formData.password,
                    deviceLocation: {
                        lat: deviceLocation?.lat,
                        lng: deviceLocation?.lng
                    }
                })
            });

            // Store authentication tokens and user data
            // Backend may return either data.session.access_token or data.token
            const data = response.data as any;
            const accessToken =
                data?.session?.access_token ??
                data?.session?.accessToken ??
                data?.token;
            const user = data?.user;
            const refreshToken = data?.session?.refresh_token ?? data?.session?.refreshToken;

            if (response.success && accessToken) {
                localStorage.setItem('neyborhuud_access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('neyborhuud_refresh_token', refreshToken);
                }
                if (user) {
                    localStorage.setItem('neyborhuud_user', JSON.stringify(user));
                }
                // Sync token with api-client so feed requests are authenticated immediately
                apiClient.setToken(accessToken);
                console.log('✅ Login successful, tokens stored');
            }

            router.push('/feed');
        } catch (error: any) {
            console.error(error);
            
            // Provide friendly error messages
            let friendlyMsg = error.message;
            if (error.message.includes('Load failed') || error.message.includes('Failed to fetch')) {
                friendlyMsg = 'Could not reach the server. Please check your connection and try again.';
            } else if (error.message.includes('Invalid credentials') || error.message.includes('incorrect')) {
                friendlyMsg = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('not found') || error.message.includes('No user')) {
                friendlyMsg = 'No account found with this email. Would you like to sign up?';
            }
            
            alert(`Login Error: ${friendlyMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] neu-base overflow-hidden">
        <div className="h-full flex flex-col p-6 max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mt-12 mb-10">
                <h1 className="text-4xl font-semibold tracking-tighter leading-none" style={{ color: 'var(--neu-text)' }}>Welcome Back</h1>
                <p className="font-light mt-3 text-lg" style={{ color: 'var(--neu-text-secondary)' }}>Continue your NeyborHuud journey.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <PremiumInput
                    label="Email Address"
                    type="email"
                    icon="bi-envelope"
                    placeholder="nancy@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                    <PremiumInput
                        label="Password"
                        type="password"
                        icon="bi-lock"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <div className="flex justify-end px-2">
                        <Link 
                            href="/forgot-password" 
                            className="text-[10px] font-black uppercase tracking-widest text-brand-blue hover:text-brand-blue/70 transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <button
                    disabled={loading || !formData.email || !formData.password}
                    className={`
                        py-5 rounded-2xl mt-6 transition-all duration-200 cursor-pointer
                        ${(loading || !formData.email || !formData.password) 
                            ? 'neu-btn opacity-40 cursor-not-allowed' 
                            : 'neu-btn hover:shadow-none active:shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]'}
                    `}
                >
                    <span className="font-black uppercase tracking-widest" style={{ color: 'var(--neu-text)' }}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </span>
                </button>
            </form>

            <div className="mt-auto pb-10 text-center">
                <p className="text-sm font-light uppercase tracking-tighter" style={{ color: 'var(--neu-text-muted)' }}>
                    New to the NeyborHuud? <Link href="/signup" className="text-brand-blue font-bold">Join for Free</Link>
                </p>
            </div>
        </div>
        </div>
    );
}
