'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface NotificationSettings {
    email: boolean;
    push: boolean;
    sms: boolean;
    chat: boolean;
    mentions: boolean;
    likes: boolean;
    comments: boolean;
}

interface PrivacySettings {
    profileVisibility: 'public' | 'friends' | 'private';
    showLocation: boolean;
    showPhone: boolean;
    showEmail: boolean;
}

interface UserSettings {
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'account'>('notifications');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const [notifications, setNotifications] = useState<NotificationSettings>({
        email: true,
        push: true,
        sms: false,
        chat: true,
        mentions: true,
        likes: true,
        comments: true,
    });

    const [privacy, setPrivacy] = useState<PrivacySettings>({
        profileVisibility: 'public',
        showLocation: true,
        showPhone: false,
        showEmail: false,
    });

    // Load user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('neyborhuud_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setEmailVerified(parsed.verificationStatus === 'verified' || parsed.emailVerified);
            
            // Load settings if available
            if (parsed.settings?.notifications) {
                setNotifications(prev => ({ ...prev, ...parsed.settings.notifications }));
            }
            if (parsed.settings?.privacy) {
                setPrivacy(prev => ({ ...prev, ...parsed.settings.privacy }));
            }
        }
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            await fetchAPI('/auth/settings/notifications', {
                method: 'PUT',
                body: JSON.stringify(notifications)
            });
            
            // Update local storage
            if (user) {
                const updated = { ...user, settings: { ...user.settings, notifications } };
                localStorage.setItem('neyborhuud_user', JSON.stringify(updated));
            }
            
            alert('Notification settings saved!');
        } catch (error: any) {
            console.error('Failed to save notifications:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrivacy = async () => {
        setSaving(true);
        try {
            await fetchAPI('/auth/settings/privacy', {
                method: 'PUT',
                body: JSON.stringify(privacy)
            });
            
            // Update local storage
            if (user) {
                const updated = { ...user, settings: { ...user.settings, privacy } };
                localStorage.setItem('neyborhuud_user', JSON.stringify(updated));
            }
            
            alert('Privacy settings saved!');
        } catch (error: any) {
            console.error('Failed to save privacy:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleResendVerification = async () => {
        if (resendCooldown > 0 || resendingVerification) return;
        
        setResendingVerification(true);
        try {
            await fetchAPI('/auth/resend-verification', {
                method: 'POST'
            });
            setResendCooldown(60);
            alert('Verification email sent! Check your inbox.');
        } catch (error: any) {
            console.error('Failed to resend verification:', error);
            alert('Failed to send verification email.');
        } finally {
            setResendingVerification(false);
        }
    };

    const ToggleSwitch = ({ 
        enabled, 
        onChange, 
        label, 
        description 
    }: { 
        enabled: boolean; 
        onChange: (val: boolean) => void;
        label: string;
        description?: string;
    }) => (
        <div className="flex items-center justify-between py-4 border-b border-charcoal/5 last:border-0">
            <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-charcoal">{label}</p>
                {description && (
                    <p className="text-xs text-charcoal/40 mt-0.5">{description}</p>
                )}
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`
                    relative w-12 h-7 rounded-full transition-all duration-300
                    ${enabled ? 'bg-neon-green' : 'bg-charcoal/20'}
                `}
            >
                <div className={`
                    absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300
                    ${enabled ? 'left-6' : 'left-1'}
                `}></div>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-soft-bg pb-24">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-charcoal/5">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl neumorphic flex items-center justify-center"
                    >
                        <i className="bi bi-arrow-left text-charcoal"></i>
                    </button>
                    <h1 className="text-xl font-bold text-charcoal">Settings</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 py-6">
                {/* Email Verification Banner */}
                {!emailVerified && (
                    <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                            <i className="bi bi-exclamation-triangle text-yellow-500 text-lg mt-0.5"></i>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-charcoal mb-1">
                                    Verify Your Email
                                </p>
                                <p className="text-xs text-charcoal/60 mb-3">
                                    Please verify your email to access all features.
                                </p>
                                <button
                                    onClick={handleResendVerification}
                                    disabled={resendCooldown > 0 || resendingVerification}
                                    className={`
                                        text-xs font-bold transition-all
                                        ${resendCooldown > 0 || resendingVerification 
                                            ? 'text-charcoal/30 cursor-not-allowed' 
                                            : 'text-brand-blue hover:underline'}
                                    `}
                                >
                                    {resendingVerification ? 'Sending...' : 
                                     resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                                     'Resend Verification Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 p-1 neumorphic-inset rounded-2xl">
                    {[
                        { id: 'notifications', label: 'Notifications', icon: 'bi-bell' },
                        { id: 'privacy', label: 'Privacy', icon: 'bi-shield' },
                        { id: 'account', label: 'Account', icon: 'bi-person' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                                ${activeTab === tab.id 
                                    ? 'neumorphic text-charcoal' 
                                    : 'text-charcoal/40 hover:text-charcoal/60'}
                            `}
                        >
                            <i className={`bi ${tab.icon} mr-1`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Delivery Channels
                            </h2>
                            
                            <ToggleSwitch
                                enabled={notifications.email}
                                onChange={(val) => setNotifications({ ...notifications, email: val })}
                                label="Email Notifications"
                                description="Receive updates via email"
                            />
                            <ToggleSwitch
                                enabled={notifications.push}
                                onChange={(val) => setNotifications({ ...notifications, push: val })}
                                label="Push Notifications"
                                description="Browser and mobile push alerts"
                            />
                            <ToggleSwitch
                                enabled={notifications.sms}
                                onChange={(val) => setNotifications({ ...notifications, sms: val })}
                                label="SMS Notifications"
                                description="Text messages for urgent alerts"
                            />
                        </div>

                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Activity Alerts
                            </h2>
                            
                            <ToggleSwitch
                                enabled={notifications.chat}
                                onChange={(val) => setNotifications({ ...notifications, chat: val })}
                                label="Chat Messages"
                                description="New messages from neighbors"
                            />
                            <ToggleSwitch
                                enabled={notifications.mentions}
                                onChange={(val) => setNotifications({ ...notifications, mentions: val })}
                                label="Mentions"
                                description="When someone tags you"
                            />
                            <ToggleSwitch
                                enabled={notifications.likes}
                                onChange={(val) => setNotifications({ ...notifications, likes: val })}
                                label="Likes"
                                description="When someone likes your post"
                            />
                            <ToggleSwitch
                                enabled={notifications.comments}
                                onChange={(val) => setNotifications({ ...notifications, comments: val })}
                                label="Comments"
                                description="Replies to your posts"
                            />
                        </div>

                        <button
                            onClick={handleSaveNotifications}
                            disabled={saving}
                            className="neumorphic-btn w-full py-4 rounded-2xl"
                        >
                            <span className="text-charcoal font-black uppercase tracking-widest text-xs">
                                {saving ? 'Saving...' : 'Save Notification Settings'}
                            </span>
                        </button>
                    </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Profile Visibility
                            </h2>
                            
                            <div className="flex flex-col gap-2">
                                {[
                                    { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                                    { value: 'friends', label: 'Friends Only', desc: 'Only your connections' },
                                    { value: 'private', label: 'Private', desc: 'Only you can see' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setPrivacy({ ...privacy, profileVisibility: option.value as any })}
                                        className={`
                                            p-4 rounded-xl text-left transition-all
                                            ${privacy.profileVisibility === option.value 
                                                ? 'neumorphic-inset bg-neon-green/10 border border-neon-green/20' 
                                                : 'neumorphic hover:scale-[1.01]'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-charcoal">{option.label}</p>
                                                <p className="text-xs text-charcoal/40">{option.desc}</p>
                                            </div>
                                            {privacy.profileVisibility === option.value && (
                                                <i className="bi bi-check-circle-fill text-neon-green"></i>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Information Sharing
                            </h2>
                            
                            <ToggleSwitch
                                enabled={privacy.showLocation}
                                onChange={(val) => setPrivacy({ ...privacy, showLocation: val })}
                                label="Show Location"
                                description="Display your neighborhood on profile"
                            />
                            <ToggleSwitch
                                enabled={privacy.showPhone}
                                onChange={(val) => setPrivacy({ ...privacy, showPhone: val })}
                                label="Show Phone Number"
                                description="Let others see your phone"
                            />
                            <ToggleSwitch
                                enabled={privacy.showEmail}
                                onChange={(val) => setPrivacy({ ...privacy, showEmail: val })}
                                label="Show Email Address"
                                description="Display email on your profile"
                            />
                        </div>

                        <button
                            onClick={handleSavePrivacy}
                            disabled={saving}
                            className="neumorphic-btn w-full py-4 rounded-2xl"
                        >
                            <span className="text-charcoal font-black uppercase tracking-widest text-xs">
                                {saving ? 'Saving...' : 'Save Privacy Settings'}
                            </span>
                        </button>
                    </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className="animate-in fade-in duration-300">
                        {/* Complete profile - accessible from bottom nav (Profile tab) */}
                        <div className="neumorphic rounded-2xl p-6 mb-6 border border-neon-green/20">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-3">
                                Profile
                            </h2>
                            <Link
                                href="/complete-profile"
                                className="flex items-center justify-between py-3 px-4 rounded-xl bg-neon-green/10 border border-neon-green/20 min-h-[44px] touch-manipulation active:bg-neon-green/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-person-plus text-neon-green text-lg" aria-hidden />
                                    <span className="text-sm font-bold text-charcoal">Complete your profile</span>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/40" aria-hidden />
                            </Link>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div className="neumorphic rounded-2xl p-6 mb-6">
                                <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                    Account Info
                                </h2>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Username</span>
                                        <span className="text-sm font-bold text-charcoal">{user.username}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Email</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-charcoal">{user.email}</span>
                                            {emailVerified ? (
                                                <i className="bi bi-patch-check-fill text-neon-green text-sm"></i>
                                            ) : (
                                                <i className="bi bi-exclamation-circle text-yellow-500 text-sm"></i>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Member Since</span>
                                        <span className="text-sm font-bold text-charcoal">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Actions */}
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Security
                            </h2>
                            
                            <Link 
                                href="/forgot-password"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-key text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <span className="text-sm font-bold text-charcoal">Change Password</span>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/20"></i>
                            </Link>
                            
                            <button className="flex items-center justify-between py-4 w-full group">
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-shield-lock text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <span className="text-sm font-bold text-charcoal">Two-Factor Auth</span>
                                </div>
                                <span className="text-xs text-charcoal/30 uppercase">Coming Soon</span>
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="neumorphic rounded-2xl p-6 border border-brand-red/10">
                            <h2 className="text-sm font-black uppercase tracking-widest text-brand-red/60 mb-4">
                                Danger Zone
                            </h2>
                            
                            <button className="flex items-center gap-3 py-3 text-brand-red/60 hover:text-brand-red transition-colors">
                                <i className="bi bi-trash3"></i>
                                <span className="text-sm font-bold">Delete Account</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
