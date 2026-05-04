'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import type { ConsentType, UserConsentRecord, AppLanguage } from '@/types/api';
import { useTranslation } from '@/lib/i18n';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

function latestForType(
    rows: UserConsentRecord[],
    type: ConsentType,
): UserConsentRecord | undefined {
    const subset = rows.filter((r) => r.consentType === type);
    if (!subset.length) return undefined;
    return subset.reduce((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb >= ta ? b : a;
    });
}

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
    const { t, language: currentLanguage, setLanguage, languageNames, availableLanguages } = useTranslation();
    const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'account' | 'language'>('notifications');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [accountActionLoading, setAccountActionLoading] = useState<'export' | 'delete' | null>(null);

    const [consentRows, setConsentRows] = useState<UserConsentRecord[]>([]);
    const [consentsLoading, setConsentsLoading] = useState(false);
    const [consentBusy, setConsentBusy] = useState<ConsentType | null>(null);
    const [accessLogOpen, setAccessLogOpen] = useState(false);
    const [accessLogLoading, setAccessLogLoading] = useState(false);
    const [accessLogEntries, setAccessLogEntries] = useState<
        {
            id: string;
            accessType: string;
            reason?: string;
            createdAt: string;
            accessor: {
                id: string;
                firstName?: string;
                lastName?: string;
                role?: string;
            } | null;
        }[]
    >([]);

    const [usernameChangePolicy, setUsernameChangePolicy] = useState<{
        cooldownDays: number;
        canChangeUsername: boolean;
        nextUsernameChangeAt: string | null;
        lastUsernameRenameAt: string | null;
    } | null>(null);
    const [usernameTimeline, setUsernameTimeline] = useState<
        Array<{ username: string; effectiveFrom: string; effectiveTo: string | null }>
    >([]);
    const [newUsernameDraft, setNewUsernameDraft] = useState('');
    const [usernameSaving, setUsernameSaving] = useState(false);

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

    // Per-user safety settings
    const [emergencyServicesEnabled, setEmergencyServicesEnabled] = useState(false);
    const [savingSafety, setSavingSafety] = useState(false);

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

        // Load per-user safety settings from backend
        if (authService.isAuthenticated()) {
            fetchAPI('/safety/settings')
                .then((res: any) => {
                    if (res?.data?.safetySettings?.emergencyServicesEnabled !== undefined) {
                        setEmergencyServicesEnabled(!!res.data.safetySettings.emergencyServicesEnabled);
                    }
                })
                .catch(() => {}); // non-fatal
        }
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const loadConsents = useCallback(async () => {
        if (!authService.isAuthenticated()) return;
        setConsentsLoading(true);
        try {
            const res = await authService.getConsents();
            if (res.success && res.data?.consents) {
                setConsentRows(res.data.consents);
            }
        } catch (e: unknown) {
            console.error(e);
            toast.error('Could not load consent settings.');
        } finally {
            setConsentsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab !== 'privacy') return;
        void loadConsents();
    }, [activeTab, loadConsents]);

    const refreshAccountProfile = useCallback(async () => {
        if (!authService.isAuthenticated()) return;
        try {
            const res = await authService.getMyProfileFull();
            if (!res.success || !res.data?.user) return;
            const u = res.data.user;
            setUser(u);
            localStorage.setItem('neyborhuud_user', JSON.stringify(u));
            if (res.data.usernameChangePolicy) {
                setUsernameChangePolicy(res.data.usernameChangePolicy);
            }
            const tl = (u as unknown as { usernameTimeline?: unknown }).usernameTimeline;
            setUsernameTimeline(Array.isArray(tl) ? tl : []);
        } catch {
            toast.error('Could not load profile from server.');
        }
    }, []);

    useEffect(() => {
        if (activeTab !== 'account') return;
        void refreshAccountProfile();
    }, [activeTab, refreshAccountProfile]);

    const handleConsentToggle = async (type: ConsentType, granted: boolean) => {
        if (type === 'data_processing' && !granted) {
            toast.message(
                'Essential processing cannot be turned off while your account is active.',
            );
            return;
        }
        setConsentBusy(type);
        try {
            const res = await authService.updateConsent(type, granted);
            if (!res.success) {
                toast.error(res.message || 'Update failed');
                return;
            }
            await loadConsents();
            toast.success('Consent updated.');
        } catch (e: unknown) {
            const ax = e as { response?: { data?: { message?: string } }; message?: string };
            toast.error(
                ax.response?.data?.message || ax.message || 'Could not update consent',
            );
        } finally {
            setConsentBusy(null);
        }
    };

    const loadAccessLog = async () => {
        if (!authService.isAuthenticated()) return;
        setAccessLogLoading(true);
        try {
            const res = await authService.getDataAccessHistory(1, 25);
            if (res.success && res.data?.accessHistory) {
                setAccessLogEntries(res.data.accessHistory);
            }
        } catch (e: unknown) {
            console.error(e);
            toast.error('Could not load access history.');
        } finally {
            setAccessLogLoading(false);
        }
    };

    const handleExportMyData = async () => {
        setAccountActionLoading('export');
        try {
            const res = await authService.exportUserData();
            if (!res.success || !res.data) {
                toast.error(
                    (res as { message?: string }).message || 'Export failed',
                );
                return;
            }
            const wrap = res.data as { export?: unknown };
            const payload = wrap.export ?? res.data;
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `neyborhuud-data-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download started.');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Export failed';
            toast.error(msg);
        } finally {
            setAccountActionLoading(null);
        }
    };

    const handleDeleteAccount = async () => {
        if (
            !window.confirm(
                'Delete your NeyborHuud account? Your posts will be hidden and personal data scrubbed. This cannot be undone.',
            )
        ) {
            return;
        }
        const reason =
            window.prompt('Optional: why are you leaving? (Cancel to skip)') ||
            undefined;
        setAccountActionLoading('delete');
        try {
            await authService.deleteAccount(reason);
            toast.success('Account deleted.');
            router.push('/login');
        } catch (e: unknown) {
            const ax = e as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            toast.error(
                ax.response?.data?.message ||
                    ax.message ||
                    'Could not delete account',
            );
        } finally {
            setAccountActionLoading(null);
        }
    };

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

    const handleSaveEmergencyConsent = async (newValue: boolean) => {
        setSavingSafety(true);
        try {
            await fetchAPI('/safety/settings', {
                method: 'PATCH',
                body: JSON.stringify({ emergencyServicesEnabled: newValue }),
            });
            setEmergencyServicesEnabled(newValue);
            toast.success(newValue ? 'Emergency services contact enabled.' : 'Emergency services contact disabled.');
        } catch (err: any) {
            console.error('Failed to save safety settings:', err);
            toast.error('Could not save safety settings. Please try again.');
        } finally {
            setSavingSafety(false);
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
        description,
        disabled,
    }: {
        enabled: boolean;
        onChange: (val: boolean) => void;
        label: string;
        description?: string;
        disabled?: boolean;
    }) => (
        <div className="flex items-center justify-between py-4 border-b border-charcoal/5 last:border-0">
            <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-charcoal">{label}</p>
                {description && (
                    <p className="text-xs text-charcoal/40 mt-0.5">{description}</p>
                )}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onChange(!enabled)}
                className={`
                    relative w-12 h-7 rounded-full transition-all duration-300
                    ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                    ${enabled ? 'bg-primary' : 'bg-charcoal/20'}
                `}
            >
                <div
                    className={`
                    absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300
                    ${enabled ? 'left-6' : 'left-1'}
                `}
                ></div>
            </button>
        </div>
    );

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />
                <div className="flex-1 overflow-y-auto bg-soft-bg pb-24">
            {/* Header */}
            <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl sticky top-0 z-50 border-b border-charcoal/5">
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
                        { id: 'language', label: t('settings.language'), icon: 'bi-translate' },
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
                                description="New messages from NeyburHs"
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

                        {/* Emergency Services Consent */}
                        <div className="neumorphic rounded-2xl p-6 mt-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-1">
                                Emergency Services
                            </h2>
                            <p className="text-xs text-charcoal/50 mb-4">
                                Allow NeyborHuud to contact emergency services (Police, DSS, NEMA) on your behalf
                                when an SOS is auto-escalated and you do not respond.
                                This requires your explicit consent and can be withdrawn at any time.
                            </p>
                            <ToggleSwitch
                                enabled={emergencyServicesEnabled}
                                onChange={(val) => void handleSaveEmergencyConsent(val)}
                                label={savingSafety ? 'Saving…' : 'Contact Emergency Services for Me'}
                                description="Auto-dispatches authorities during an unresponsive SOS escalation"
                            />
                        </div>
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
                                                ? 'neumorphic-inset bg-primary/10 border border-primary/20' 
                                                : 'neumorphic hover:scale-[1.01]'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-charcoal">{option.label}</p>
                                                <p className="text-xs text-charcoal/40">{option.desc}</p>
                                            </div>
                                            {privacy.profileVisibility === option.value && (
                                                <i className="bi bi-check-circle-fill text-primary"></i>
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
                                description="Display your neyborhuud on profile"
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

                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Blocked NeyburHs
                            </h2>
                            <a
                                href="/settings/blocked"
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px] text-red-500">block</span>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Manage Blocked Users</span>
                                        <span className="text-[10px] text-charcoal/50">View and unblock NeyburHs you&apos;ve blocked</span>
                                    </div>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/30" />
                            </a>
                        </div>

                        <div className="neumorphic rounded-2xl p-6 mb-6 border border-primary/15">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-1">
                                Data &amp; consent (NDPR)
                            </h2>
                            <p className="text-[10px] text-charcoal/45 mb-4 leading-relaxed">
                                Manage optional processing. Essential processing is required to run your account;
                                you can export or delete your data from Account → Danger zone.
                            </p>
                            {consentsLoading ? (
                                <p className="text-xs text-charcoal/50">Loading consent state…</p>
                            ) : !authService.isAuthenticated() ? (
                                <p className="text-xs text-charcoal/45">
                                    Log in to view and change consent preferences.
                                </p>
                            ) : (
                                <>
                                    {(() => {
                                        const dp = latestForType(consentRows, 'data_processing');
                                        const dpActive = dp?.granted === true;
                                        return (
                                            <div className="py-3 border-b border-charcoal/5 mb-2">
                                                <p className="text-sm font-bold text-charcoal">
                                                    Essential data processing
                                                </p>
                                                <p className="text-[10px] text-charcoal/45 mt-1">
                                                    {dpActive
                                                        ? `Active — last recorded ${dp.grantedAt ? new Date(dp.grantedAt).toLocaleString() : ''}`
                                                        : 'Not on file (e.g. older account). Confirm to align with our Privacy Policy.'}
                                                </p>
                                                {!dpActive && (
                                                    <button
                                                        type="button"
                                                        disabled={consentBusy !== null}
                                                        onClick={() =>
                                                            void handleConsentToggle('data_processing', true)
                                                        }
                                                        className="mt-3 text-xs font-bold text-brand-blue hover:underline disabled:opacity-40"
                                                    >
                                                        {consentBusy === 'data_processing'
                                                            ? 'Saving…'
                                                            : 'Record essential consent'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <ToggleSwitch
                                        enabled={
                                            latestForType(consentRows, 'marketing')?.granted === true
                                        }
                                        disabled={consentBusy !== null}
                                        onChange={(val) => {
                                            void handleConsentToggle('marketing', val);
                                        }}
                                        label="Marketing"
                                        description="News, features, and promotional messages"
                                    />
                                    <ToggleSwitch
                                        enabled={
                                            latestForType(consentRows, 'analytics')?.granted === true
                                        }
                                        disabled={consentBusy !== null}
                                        onChange={(val) => {
                                            void handleConsentToggle('analytics', val);
                                        }}
                                        label="Analytics"
                                        description="Help us improve the product with usage insights"
                                    />
                                    <ToggleSwitch
                                        enabled={
                                            latestForType(consentRows, 'third_party')?.granted === true
                                        }
                                        disabled={consentBusy !== null}
                                        onChange={(val) => {
                                            void handleConsentToggle('third_party', val);
                                        }}
                                        label="Trusted partners"
                                        description="Limited sharing where described in the Privacy Policy"
                                    />
                                    <div className="mt-4 pt-3 border-t border-charcoal/5">
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-brand-blue flex items-center gap-2"
                                            onClick={() => {
                                                const next = !accessLogOpen;
                                                setAccessLogOpen(next);
                                                if (next) void loadAccessLog();
                                            }}
                                        >
                                            <i
                                                className={`bi ${accessLogOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                                            />
                                            Data access history
                                        </button>
                                        {accessLogOpen && (
                                            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                                {accessLogLoading ? (
                                                    <p className="text-[10px] text-charcoal/45">Loading…</p>
                                                ) : accessLogEntries.length === 0 ? (
                                                    <p className="text-[10px] text-charcoal/45">
                                                        No access events recorded yet.
                                                    </p>
                                                ) : (
                                                    accessLogEntries.map((row) => (
                                                        <div
                                                            key={row.id}
                                                            className="text-[10px] rounded-lg bg-charcoal/[0.03] px-3 py-2"
                                                        >
                                                            <span className="font-bold text-charcoal">
                                                                {row.accessType}
                                                            </span>
                                                            {row.reason && (
                                                                <span className="text-charcoal/50">
                                                                    {' '}
                                                                    — {row.reason}
                                                                </span>
                                                            )}
                                                            <div className="text-charcoal/40 mt-0.5">
                                                                {new Date(row.createdAt).toLocaleString()}
                                                                {row.accessor &&
                                                                    ` · ${row.accessor.firstName || ''} ${row.accessor.lastName || ''}`}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
                        <div className="neumorphic rounded-2xl p-6 mb-6 border border-primary/20">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-3">
                                Profile
                            </h2>
                            <Link
                                href="/complete-profile"
                                className="flex items-center justify-between py-3 px-4 rounded-xl bg-primary/10 border border-primary/20 min-h-[44px] touch-manipulation active:bg-primary/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-person-plus text-primary text-lg" aria-hidden />
                                    <span className="text-sm font-bold text-charcoal">Complete your profile</span>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/40" aria-hidden />
                            </Link>
                        </div>

                        <div className="neumorphic rounded-2xl p-6 mb-6 border border-charcoal/10">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-3">
                                Username
                            </h2>
                            <p className="text-[10px] text-charcoal/45 mb-3 leading-relaxed">
                                You can change your handle once every{' '}
                                {usernameChangePolicy?.cooldownDays ?? 90} days after your{' '}
                                <strong>first</strong> rename. Your current username (and past ones) can work
                                as referral codes — see Invite NeyburHs below.
                            </p>
                            {usernameChangePolicy && !usernameChangePolicy.canChangeUsername && usernameChangePolicy.nextUsernameChangeAt ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                                    Next change allowed:{' '}
                                    {new Date(usernameChangePolicy.nextUsernameChangeAt).toLocaleString()}
                                </p>
                            ) : null}
                            <input
                                type="text"
                                className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-charcoal mb-3"
                                placeholder="new_handle"
                                autoComplete="username"
                                value={newUsernameDraft}
                                onChange={(e) => setNewUsernameDraft(e.target.value.replace(/\s/g, ''))}
                                disabled={usernameSaving || (usernameChangePolicy ? !usernameChangePolicy.canChangeUsername : false)}
                            />
                            <button
                                type="button"
                                disabled={
                                    usernameSaving ||
                                    !newUsernameDraft.trim() ||
                                    (usernameChangePolicy ? !usernameChangePolicy.canChangeUsername : false)
                                }
                                className="neumorphic-btn w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-charcoal mb-4 disabled:opacity-40"
                                onClick={async () => {
                                    setUsernameSaving(true);
                                    try {
                                        const res = await authService.changeUsername(newUsernameDraft.trim());
                                        if (!res.success) {
                                            toast.error(res.message || 'Could not update username');
                                            return;
                                        }
                                        toast.success('Username updated');
                                        setNewUsernameDraft('');
                                        await refreshAccountProfile();
                                    } catch (e: unknown) {
                                        const ax = e as {
                                            response?: { status?: number; data?: { message?: string } };
                                        };
                                        const msg =
                                            ax.response?.data?.message ||
                                            (e instanceof Error ? e.message : 'Request failed');
                                        toast.error(msg);
                                    } finally {
                                        setUsernameSaving(false);
                                    }
                                }}
                            >
                                {usernameSaving ? 'Saving…' : 'Update username'}
                            </button>
                            {usernameTimeline.length > 0 ? (
                                <div className="border-t border-charcoal/10 pt-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-charcoal/35 mb-2">
                                        Handle timeline
                                    </h3>
                                    <ul className="space-y-2 text-[11px] text-charcoal/70">
                                        {usernameTimeline.map((row, i) => (
                                            <li key={`${row.username}-${row.effectiveFrom}-${i}`}>
                                                <span className="font-mono font-bold text-charcoal">@{row.username}</span>
                                                <span className="text-charcoal/40">
                                                    {' '}
                                                    — from {new Date(row.effectiveFrom).toLocaleDateString()}
                                                    {row.effectiveTo
                                                        ? ` to ${new Date(row.effectiveTo).toLocaleDateString()}`
                                                        : ' (current)'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>

                        {user?.username ? (
                            <div className="neumorphic rounded-2xl p-6 mb-6 border border-primary/15">
                                <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-3">
                                    Invite NeyburHs
                                </h2>
                                <p className="text-[10px] text-charcoal/45 mb-3 leading-relaxed">
                                    Your <strong>username</strong> is the referral code on this app. Friends who sign up
                                    from your link attach you as inviter (HuudCoins may apply per server rules).
                                </p>
                                <div className="rounded-xl bg-charcoal/[0.04] px-3 py-2 mb-3 break-all text-[11px] font-mono text-charcoal/80">
                                    {typeof window !== 'undefined'
                                        ? `${window.location.origin}/signup?ref=${encodeURIComponent(String(user.username))}`
                                        : `/signup?ref=${encodeURIComponent(String(user.username))}`}
                                </div>
                                <button
                                    type="button"
                                    className="neumorphic-btn w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-charcoal"
                                    onClick={() => {
                                        const url = `${window.location.origin}/signup?ref=${encodeURIComponent(String(user.username))}`;
                                        void navigator.clipboard.writeText(url);
                                        toast.success('Invite link copied');
                                    }}
                                >
                                    Copy invite link
                                </button>
                            </div>
                        ) : null}

                        {/* Location & Community */}
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Location & Community
                            </h2>
                            
                            {user?.location && (
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Current Area</span>
                                        <span className="text-sm font-bold text-charcoal">
                                            {user.location.lga || user.location.neighborhood || 'Not set'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">State</span>
                                        <span className="text-sm font-bold text-charcoal">
                                            {user.location.state || 'Not set'}
                                        </span>
                                    </div>
                                    {user.assignedCommunity?.name && (
                                        <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
                                            <span className="text-xs text-charcoal/50 uppercase tracking-wider">Community</span>
                                            <span className="text-sm font-bold text-primary">
                                                {user.assignedCommunity.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <Link
                                href="/pick-community?change=true"
                                className="flex items-center justify-between py-4 border-t border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-geo-alt text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Change Community</span>
                                        <span className="text-[10px] text-charcoal/40">Switch to a different ward or area</span>
                                    </div>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/20"></i>
                            </Link>
                            
                            <Link
                                href="/verify-location"
                                className="flex items-center justify-between py-4 group"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-crosshair text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Update GPS Location</span>
                                        <span className="text-[10px] text-charcoal/40">Re-detect your current location</span>
                                    </div>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/20"></i>
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
                                                <i className="bi bi-patch-check-fill text-primary text-sm"></i>
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
                                href="/settings/password"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-key text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <span className="text-sm font-bold text-charcoal">Change Password</span>
                                </div>
                                <i className="bi bi-chevron-right text-charcoal/20"></i>
                            </Link>
                            
                            <Link 
                                href="/forgot-password"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="bi bi-envelope text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                                    <span className="text-sm font-bold text-charcoal">Forgot password</span>
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
                            <p className="text-[10px] text-charcoal/40 mb-4 leading-relaxed">
                                Download your data (NDPR portability) or permanently delete this account
                                (matches{' '}
                                <code className="text-[9px]">GET /auth/export-data</code> and{' '}
                                <code className="text-[9px]">DELETE /auth/delete-account</code> on the API).
                            </p>
                            <button
                                type="button"
                                disabled={accountActionLoading !== null}
                                onClick={() => void handleExportMyData()}
                                className="flex items-center gap-3 py-3 w-full text-left text-charcoal/70 hover:text-brand-blue transition-colors disabled:opacity-50"
                            >
                                <i className="bi bi-download"></i>
                                <span className="text-sm font-bold">
                                    {accountActionLoading === 'export'
                                        ? 'Preparing export…'
                                        : 'Download my data'}
                                </span>
                            </button>
                            <button
                                type="button"
                                disabled={accountActionLoading !== null}
                                onClick={() => void handleDeleteAccount()}
                                className="flex items-center gap-3 py-3 w-full text-left text-brand-red/60 hover:text-brand-red transition-colors disabled:opacity-50"
                            >
                                <i className="bi bi-trash3"></i>
                                <span className="text-sm font-bold">
                                    {accountActionLoading === 'delete'
                                        ? 'Deleting…'
                                        : 'Delete account'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Language Tab */}
                {activeTab === 'language' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-2">
                                {t('settings.language')}
                            </h2>
                            <p className="text-xs text-charcoal/50 mb-6">
                                {t('settings.languageDesc')}
                            </p>
                            <div className="flex flex-col gap-3">
                                {availableLanguages.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setLanguage(lang);
                                            toast.success(t('settings.languageSaved'));
                                        }}
                                        className={`
                                            flex items-center justify-between py-4 px-5 rounded-xl transition-all min-h-[44px] touch-manipulation
                                            ${currentLanguage === lang
                                                ? 'neumorphic-inset border border-primary/30'
                                                : 'neumorphic hover:scale-[1.01] active:scale-[0.99]'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {lang === 'en' ? '🇬🇧' : lang === 'ha' ? '🇳🇬' : lang === 'yo' ? '🇳🇬' : lang === 'ig' ? '🇳🇬' : '🇳🇬'}
                                            </span>
                                            <span className={`text-sm font-bold ${currentLanguage === lang ? 'text-primary' : 'text-charcoal/70'}`}>
                                                {languageNames[lang]}
                                            </span>
                                        </div>
                                        {currentLanguage === lang && (
                                            <i className="bi bi-check-circle-fill text-primary"></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
                </div>
                <RightSidebar />
            </div>
            <BottomNav />
        </div>
    );
}
