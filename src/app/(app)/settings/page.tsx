'use client';

import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/api';
import { authService } from '@/services/auth.service';
import type { ConsentType, UserConsentRecord, AppLanguage } from '@/types/api';
import { useTranslation } from '@/lib/i18n';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { isAdminUser } from '@/lib/adminAccess';
import { EmailVerificationCard } from '@/components/auth/EmailVerificationCard';
import { formatProfileBirthday, getZodiacFromBirthday } from '@/lib/profileSnapHelpers';
import { getStoredTheme, setStoredTheme, applySystemTheme, getSystemPrefersDark } from '@/lib/systemTheme';

type SettingsTab = 'notifications' | 'privacy' | 'account' | 'language' | 'posts';

function isEmailVerifiedStrict(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  return (
    u.emailVerified === true ||
    u.email_verified === true ||
    u.verificationStatus === 'verified'
  );
}

function Section({
  title,
  children,
  description,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mod-card rounded-2xl p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-[var(--neu-text-muted)]">
          {description}
        </p>
      ) : null}
      <div className={description ? 'mt-4' : 'mt-3'}>{children}</div>
    </div>
  );
}

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
    follows: boolean;
    events: boolean;
    jobs: boolean;
    safety: boolean;
    gamification: boolean;
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
    const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [accountActionLoading, setAccountActionLoading] = useState<'export' | 'delete' | null>(null);

    const [consentRows, setConsentRows] = useState<UserConsentRecord[]>([]);
    const [postSettings, setPostSettings] = useState({
        defaultLanguage: 'en',
        defaultVisibility: 'public',
        defaultPriorityStandard: 'normal',
        defaultPriorityUrgent: 'critical',
        autoHashtagLocation: true,
        bankName: '',
        accountName: '',
        accountNumber: '',
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('neyborhuud_post_settings');
            if (stored) {
                try {
                    setPostSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
                } catch { /* ignore */ }
            }
        }
    }, []);

    const updatePostSettings = (updates: Partial<typeof postSettings>) => {
        const next = { ...postSettings, ...updates };
        setPostSettings(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('neyborhuud_post_settings', JSON.stringify(next));
        }
        toast.success('Post settings updated.');
    };
    const [consentsLoading, setConsentsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const stored = getStoredTheme();
        return stored !== null ? stored === 'dark' : getSystemPrefersDark();
    });
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
        follows: true,
        events: true,
        jobs: true,
        safety: true,
        gamification: true,
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

    // Accessibility
    const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [liteMode, setLiteMode] = useState(false);
    const SIZE_CLASS: Record<string, string> = { small: 'text-size-sm', medium: '', large: 'text-size-lg' };
    const applyTextSize = (size: 'small' | 'medium' | 'large') => {
        setTextSize(size);
        if (typeof document !== 'undefined') {
            document.body.classList.remove('text-size-sm', 'text-size-lg');
            const cls = SIZE_CLASS[size];
            if (cls) document.body.classList.add(cls);
        }
        fetchAPI('/profile/settings', { method: 'PATCH', body: JSON.stringify({ accessibility: { textSize: size } }) }).catch(() => {});
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('neyborhuud_user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('neyborhuud_user', JSON.stringify({ ...parsed, settings: { ...parsed.settings, accessibility: { ...(parsed.settings?.accessibility ?? {}), textSize: size } } }));
                } catch { /* ignore corrupt data */ }
            }
        }
    };
    const applyLiteMode = (enabled: boolean) => {
        setLiteMode(enabled);
        fetchAPI('/profile/settings', { method: 'PATCH', body: JSON.stringify({ accessibility: { liteMode: enabled } }) }).catch(() => {});
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('neyborhuud_user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('neyborhuud_user', JSON.stringify({ ...parsed, settings: { ...parsed.settings, accessibility: { ...(parsed.settings?.accessibility ?? {}), liteMode: enabled } } }));
                } catch { /* ignore corrupt data */ }
            }
        }
    };

    // Debounced notification save ref
    const notifSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedSaveNotifications = useCallback((updated: NotificationSettings) => {
        if (notifSaveTimer.current) clearTimeout(notifSaveTimer.current);
        notifSaveTimer.current = setTimeout(async () => {
            try {
                await fetchAPI('/profile/settings', { method: 'PATCH', body: JSON.stringify({ notifications: updated }) });
                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem('neyborhuud_user');
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            localStorage.setItem('neyborhuud_user', JSON.stringify({ ...parsed, settings: { ...parsed.settings, notifications: updated } }));
                        } catch { /* ignore corrupt data */ }
                    }
                }
            } catch { /* silent */ }
        }, 500);
    }, []);

    // Clear debounced timer on unmount to prevent stale state updates
    useEffect(() => () => {
        if (notifSaveTimer.current) clearTimeout(notifSaveTimer.current);
    }, []);

    // Load settings from server (source of truth) + fallback to localStorage.
    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        // Fallback (fast paint) from localStorage
        try {
          const userData = localStorage.getItem('neyborhuud_user');
          if (userData && !cancelled) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setEmailVerified(isEmailVerifiedStrict(parsed));
            if (parsed.settings?.notifications) {
              setNotifications((prev) => ({ ...prev, ...parsed.settings.notifications }));
            }
            if (parsed.settings?.privacy) {
              setPrivacy((prev) => ({ ...prev, ...parsed.settings.privacy }));
            }
            if (parsed.settings?.accessibility?.textSize) {
              setTextSize(parsed.settings.accessibility.textSize);
            }
            if (parsed.settings?.accessibility?.liteMode !== undefined) {
              setLiteMode(!!parsed.settings.accessibility.liteMode);
            }
          }
        } catch {
          // ignore corrupt
        }

        // Source of truth from backend
        if (authService.isAuthenticated()) {
          try {
            const res = await authService.getMyProfileFull();
            const u = res.success ? res.data?.user : null;
            if (u && !cancelled) {
              setUser(u);
              setEmailVerified(isEmailVerifiedStrict(u));
              localStorage.setItem('neyborhuud_user', JSON.stringify(u));

              if ((u as any).settings?.notifications) {
                setNotifications((prev) => ({ ...prev, ...(u as any).settings.notifications }));
              }
              if ((u as any).settings?.privacy) {
                setPrivacy((prev) => ({ ...prev, ...(u as any).settings.privacy }));
              }
              if ((u as any).settings?.accessibility?.textSize) {
                setTextSize((u as any).settings.accessibility.textSize);
              }
              if ((u as any).settings?.accessibility?.liteMode !== undefined) {
                setLiteMode(!!(u as any).settings.accessibility.liteMode);
              }
            }
          } catch {
            // non-fatal
          }

          // Per-user safety settings
          fetchAPI('/safety/settings')
            .then((res: any) => {
              if (cancelled) return;
              if (res?.data?.safetySettings?.emergencyServicesEnabled !== undefined) {
                setEmergencyServicesEnabled(!!res.data.safetySettings.emergencyServicesEnabled);
              }
            })
            .catch(() => {});
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, []);

    const handleEmailVerified = useCallback(async () => {
      setEmailVerified(true);
      try {
        const res = await authService.getMyProfileFull();
        const u = res.success ? res.data?.user : null;
        if (u) {
          setUser(u);
          setEmailVerified(isEmailVerifiedStrict(u));
          localStorage.setItem('neyborhuud_user', JSON.stringify(u));
        }
      } catch {
        // ignore
      }
      toast.success('Email verified!');
    }, []);

    const loadConsents = useCallback(async () => {
        if (!authService.isAuthenticated()) return;
        setConsentsLoading(true);
        try {
            const res = await authService.getConsents();
            if (res.success && res.data?.consents) {
                setConsentRows(res.data.consents);
            }
        } catch (e: unknown) {
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
        void refreshAccountProfile();
    }, [refreshAccountProfile]);

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

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.replace('/login');
        } catch {
            // Even if the API call fails, clear local state and redirect
            router.replace('/login');
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
            await fetchAPI('/profile/settings', {
                method: 'PATCH',
                body: JSON.stringify({ notifications })
            });
            
            // Update local storage
            if (user && typeof window !== 'undefined') {
                const updated = { ...user, settings: { ...user.settings, notifications } };
                localStorage.setItem('neyborhuud_user', JSON.stringify(updated));
            }
            
            toast.success('Notification settings saved.');
        } catch (error: any) {
            toast.error('Failed to save settings. Please try again.');
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
            if (user && typeof window !== 'undefined') {
                const updated = { ...user, settings: { ...user.settings, privacy } };
                localStorage.setItem('neyborhuud_user', JSON.stringify(updated));
            }
            
            toast.success('Privacy settings saved.');
        } catch (error: any) {
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
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
      <div
        className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
        style={{ borderColor: 'var(--neu-shadow-dark)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
            {label}
          </p>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--neu-text-muted)]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(!enabled)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            disabled ? 'opacity-50' : ''
          } ${enabled ? 'bg-primary' : 'bg-black/15'}`}
          aria-label={`${label}: ${enabled ? 'On' : 'Off'}`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
            aria-hidden
          />
        </button>
      </div>
    );

    const birthday = formatProfileBirthday(user?.dateOfBirth);
    const zodiac = getZodiacFromBirthday(user?.dateOfBirth);
    const isProfileCompleted =
      Boolean((user as any)?.profileCompletedAt) ||
      Boolean(user?.firstName && user?.lastName && user?.dateOfBirth);

    return (
      <AppBrowseLayout
        maxWidth="680"
        header={
          <div className="space-y-3">
            <div className="mod-card rounded-2xl p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                Settings
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--neu-text-muted)]">
                Control notifications, privacy, language, and account security.
              </p>
            </div>
            <BrowseTabStrip
              tabs={[
                { id: 'notifications', label: 'Notifications', icon: 'notifications' },
                { id: 'privacy', label: 'Privacy', icon: 'shield' },
                { id: 'posts', label: 'Posts', icon: 'post_add' },
                { id: 'account', label: 'Account', icon: 'manage_accounts' },
                { id: 'language', label: t('settings.language'), icon: 'translate' },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as SettingsTab)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          {!emailVerified && user?.email ? (
            <EmailVerificationCard
              email={user.email}
              onVerified={() => void handleEmailVerified()}
            />
          ) : null}

          {!emailVerified && !user?.email ? (
            <Section
              title="Email verification"
              description="Add an email to your profile, then verify it to unlock all features."
            >
              <Link
                href="/complete-profile"
                className="mod-chip mod-chip-active inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-primary no-underline"
              >
                Add email in profile
              </Link>
            </Section>
          ) : null}

          {activeTab === 'notifications' ? (
            <div className="space-y-4">
              <Section title="Delivery channels">
                <ToggleSwitch
                  enabled={notifications.email}
                  onChange={(val) => setNotifications({ ...notifications, email: val })}
                  label="Email notifications"
                  description="Receive updates via email"
                />
                <ToggleSwitch
                  enabled={notifications.push}
                  onChange={(val) => setNotifications({ ...notifications, push: val })}
                  label="Push notifications"
                  description="Browser and mobile push alerts"
                />
                <ToggleSwitch
                  enabled={notifications.sms}
                  onChange={(val) => setNotifications({ ...notifications, sms: val })}
                  label="SMS notifications"
                  description="Text messages for urgent alerts"
                />
              </Section>

              <Section title="Activity alerts">
                <ToggleSwitch
                  enabled={notifications.chat}
                  onChange={(val) => {
                    const u = { ...notifications, chat: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Chat messages"
                  description="New messages from neighbours"
                />
                <ToggleSwitch
                  enabled={notifications.mentions}
                  onChange={(val) => {
                    const u = { ...notifications, mentions: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Mentions"
                  description="When someone tags you"
                />
                <ToggleSwitch
                  enabled={notifications.likes}
                  onChange={(val) => {
                    const u = { ...notifications, likes: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Likes"
                  description="When someone likes your post"
                />
                <ToggleSwitch
                  enabled={notifications.comments}
                  onChange={(val) => {
                    const u = { ...notifications, comments: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Comments"
                  description="Replies to your posts"
                />
              </Section>

              <Section title="Topics">
                <ToggleSwitch
                  enabled={notifications.follows}
                  onChange={(val) => {
                    const u = { ...notifications, follows: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="New followers"
                />
                <ToggleSwitch
                  enabled={notifications.events}
                  onChange={(val) => {
                    const u = { ...notifications, events: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Events in your area"
                />
                <ToggleSwitch
                  enabled={notifications.jobs}
                  onChange={(val) => {
                    const u = { ...notifications, jobs: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Job postings"
                />
                <ToggleSwitch
                  enabled={notifications.safety}
                  onChange={(val) => {
                    const u = { ...notifications, safety: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Safety alerts"
                />
                <ToggleSwitch
                  enabled={notifications.gamification}
                  onChange={(val) => {
                    const u = { ...notifications, gamification: val };
                    setNotifications(u);
                    debouncedSaveNotifications(u);
                  }}
                  label="Gamification rewards"
                />
              </Section>

              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save notification settings'}
              </button>

              <Section
                title="Emergency services"
                description="Allow NeyborHuud to contact emergency services on your behalf when SOS escalates and you do not respond."
              >
                <ToggleSwitch
                  enabled={emergencyServicesEnabled}
                  onChange={(val) => void handleSaveEmergencyConsent(val)}
                  label={savingSafety ? 'Saving…' : 'Contact emergency services for me'}
                  description="Auto-dispatches authorities during an unresponsive SOS escalation"
                />
              </Section>
            </div>
          ) : null}

                {/* Privacy Tab */}
                {false && (
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
                                                <span className="material-symbols-outlined text-primary" aria-hidden="true">check_circle</span>
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
                                description="Display your Huud on profile"
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
                                    <span className="material-symbols-outlined text-[20px] text-brand-red">block</span>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Manage Blocked Users</span>
                                        <span className="text-[10px] text-charcoal/50">View and unblock NeyburHs you&apos;ve blocked</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/30"  aria-hidden="true">chevron_right</span>
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
                                                        ? `Active — last recorded ${dp?.grantedAt ? new Date(dp?.grantedAt ?? Date.now()).toLocaleString() : ''}`
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
                                            <span className="material-symbols-outlined text-[1rem]" aria-hidden="true">
                                                {accessLogOpen ? 'expand_less' : 'expand_more'}
                                            </span>
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
                {false && (
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
                                    <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">person_add</span>
                                    <span className="text-sm font-bold text-charcoal">Complete your profile</span>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/40" aria-hidden="true">chevron_right</span>
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
                            {usernameChangePolicy?.canChangeUsername === false && usernameChangePolicy?.nextUsernameChangeAt ? (
                                <p className="text-xs text-status-warning dark:text-primary mb-3">
                                    Next change allowed:{' '}
                                    {new Date(usernameChangePolicy?.nextUsernameChangeAt ?? Date.now()).toLocaleString()}
                                </p>
                            ) : null}
                            <input
                                type="text"
                                className="w-full rounded-xl neu-input px-4 py-3 text-sm mb-3"
                                style={{ color: 'var(--neu-text)' }}
                                placeholder="new_handle"
                                autoComplete="username"
                                value={newUsernameDraft}
                                onChange={(e) => setNewUsernameDraft(e.target.value.replace(/\s/g, ''))}
                                disabled={usernameSaving || usernameChangePolicy?.canChangeUsername === false}
                            />
                            <button
                                type="button"
                                disabled={
                                    usernameSaving ||
                                    !newUsernameDraft.trim() ||
                                    usernameChangePolicy?.canChangeUsername === false
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
                                                    — from {new Date(row.effectiveFrom).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {row.effectiveTo
                                                        ? ` to ${new Date(row.effectiveTo).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
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
                                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-brand-blue transition-colors" aria-hidden="true">location_on</span>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Change Community</span>
                                        <span className="text-[10px] text-charcoal/40">Switch to a different ward or area</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                            </Link>
                            
                            <Link
                                href="/verify-location"
                                className="flex items-center justify-between py-4 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-brand-blue transition-colors" aria-hidden="true">my_location</span>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">Update GPS Location</span>
                                        <span className="text-[10px] text-charcoal/40">Re-detect your current location</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
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
                                                <span className="material-symbols-outlined text-primary text-sm" aria-hidden="true">verified</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-primary text-sm" aria-hidden="true">error</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Member Since</span>
                                        <span className="text-sm font-bold text-charcoal">
                                            {new Date(user.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location & Accessibility */}
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Location &amp; Accessibility
                            </h2>
                            <Link
                                href="/settings/places"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] text-charcoal/40 group-hover:text-primary transition-colors">explore</span>
                                    <div>
                                        <span className="text-sm font-bold text-charcoal block">My places</span>
                                        <span className="text-[10px] text-charcoal/40">Home, work, chill spots &amp; more</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                            </Link>
                            <Link
                                href="/settings/location"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] text-charcoal/40 group-hover:text-brand-blue transition-colors">location_on</span>
                                    <span className="text-sm font-bold text-charcoal">Location &amp; Radius</span>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                            </Link>

                            {/* Font size */}
                            <div className="pt-4">
                                <p className="text-xs font-black uppercase tracking-widest text-charcoal/40 mb-3">Font Size</p>
                                <div className="flex gap-2">
                                    {(['small', 'medium', 'large'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => applyTextSize(size)}
                                            className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all capitalize ${
                                                textSize === size
                                                    ? 'bg-primary text-white'
                                                    : 'neumorphic-inset text-charcoal/50 hover:text-charcoal'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lite Mode */}
                            <div className="pt-4 border-t border-charcoal/5 mt-4">
                                <ToggleSwitch
                                    enabled={liteMode}
                                    onChange={applyLiteMode}
                                    label="Lite Mode"
                                    description="Reduce animations and heavy visuals to save data"
                                />
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="neumorphic rounded-2xl p-6 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-4">
                                Security
                            </h2>

                            {isAdminUser(user) && (
                                <Link
                                    href="/admin"
                                    className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-status-success group-hover:text-brand-blue transition-colors" aria-hidden="true">verified_user</span>
                                        <span className="text-sm font-bold text-charcoal">Admin Panel</span>
                                    </div>
                                    <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                                </Link>
                            )}
                            
                            <Link 
                                href="/settings/password"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-brand-blue transition-colors" aria-hidden="true">key</span>
                                    <span className="text-sm font-bold text-charcoal">Change Password</span>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                            </Link>
                            
                            <Link 
                                href="/forgot-password"
                                className="flex items-center justify-between py-4 border-b border-charcoal/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-brand-blue transition-colors" aria-hidden="true">mail</span>
                                    <span className="text-sm font-bold text-charcoal">Forgot password</span>
                                </div>
                                <span className="material-symbols-outlined text-charcoal/20" aria-hidden="true">chevron_right</span>
                            </Link>
                            
                            <button className="flex items-center justify-between py-4 w-full group">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-brand-blue transition-colors" aria-hidden="true">lock</span>
                                    <span className="text-sm font-bold text-charcoal">Two-Factor Auth</span>
                                </div>
                                <span className="text-xs text-charcoal/30 uppercase">Coming Soon</span>
                            </button>
                        </div>

                        {/* Sign Out */}
                        <div className="neumorphic rounded-2xl p-6 mb-6 border border-charcoal/10">
                            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/40 mb-3">
                                Session
                            </h2>
                            <button
                                type="button"
                                onClick={() => void handleLogout()}
                                className="flex w-full items-center gap-3 rounded-xl py-3 px-4 text-left text-brand-red/70 hover:text-brand-red hover:bg-brand-red/5 transition-colors min-h-[44px] touch-manipulation"
                            >
                                <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
                                <span className="text-sm font-bold">Sign out</span>
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
                                <code className="text-[10px]">GET /auth/export-data</code> and{' '}
                                <code className="text-[10px]">DELETE /auth/delete-account</code> on the API).
                            </p>
                            <button
                                type="button"
                                disabled={accountActionLoading !== null}
                                onClick={() => void handleExportMyData()}
                                className="flex items-center gap-3 py-3 w-full text-left text-charcoal/70 hover:text-brand-blue transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">download</span>
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
                                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
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
                {false && (
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
                                            <span className="material-symbols-outlined text-primary" aria-hidden="true">check_circle</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
          {activeTab === 'account' ? (
            <div className="space-y-4">
              <Section title="Profile">
                <div className="mod-inset rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                    {isProfileCompleted ? 'Profile Completed' : 'Profile Incomplete'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {birthday ? (
                    <div className="mod-inset rounded-xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                        Birthday
                      </p>
                      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                        {birthday}
                      </p>
                    </div>
                  ) : null}
                  {zodiac ? (
                    <div className="mod-inset rounded-xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                        Sign
                      </p>
                      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                        {zodiac.emoji} {zodiac.sign}
                      </p>
                    </div>
                  ) : null}
                </div>

                <Link
                  href="/complete-profile"
                  className="mod-chip mod-chip-active mt-3 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-primary no-underline"
                >
                  {isProfileCompleted ? 'Edit profile' : 'Complete profile'}
                </Link>
              </Section>

              <Section title="Security">
                {isAdminUser(user) ? (
                  <Link
                    href="/admin"
                    className="mod-inset flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold no-underline"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">shield</span>
                      Admin panel
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[var(--neu-text-muted)]">
                      chevron_right
                    </span>
                  </Link>
                ) : null}

                <Link
                  href="/settings/password"
                  className="mod-inset mt-2 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold no-underline"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">key</span>
                    Change password
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[var(--neu-text-muted)]">
                    chevron_right
                  </span>
                </Link>
              </Section>

              <Section title="Appearance">
                <div className="mod-inset flex items-center justify-between rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] text-primary ${isDarkMode ? 'icon-filled' : 'icon-outlined'}`}
                      aria-hidden
                    >
                      {isDarkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                    <div>
                      <p className="text-sm font-bold neu-text">
                        {isDarkMode ? 'Dark mode' : 'Light mode'}
                      </p>
                      <p className="text-xs neu-text-muted">
                        {isDarkMode ? 'Easy on the eyes at night' : 'Clean and bright'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDarkMode ? 'true' : 'false'}
                    aria-label="Toggle dark mode"
                    onClick={() => {
                      const next = !isDarkMode;
                      setIsDarkMode(next);
                      setStoredTheme(next ? 'dark' : 'light');
                      applySystemTheme(next);
                    }}
                    className={`theme-toggle-btn relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isDarkMode ? 'bg-primary' : 'bg-[var(--neu-shadow-dark)]'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </Section>

              <Section title="Session">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mod-chip w-full rounded-xl py-3 text-sm font-bold text-brand-red"
                >
                  Sign out
                </button>
              </Section>
            </div>
          ) : null}

          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <Section title="Visibility">
                <div className="flex gap-1 rounded-2xl p-1 mod-inset">
                  {[
                    { value: 'public', label: 'Public' },
                    { value: 'friends', label: 'Friends' },
                    { value: 'private', label: 'Private' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrivacy({ ...privacy, profileVisibility: opt.value as any })}
                      className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
                        privacy.profileVisibility === opt.value
                          ? 'mod-chip mod-chip-active text-primary'
                          : 'mod-chip text-[var(--neu-text-muted)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Information sharing">
                <ToggleSwitch
                  enabled={privacy.showLocation}
                  onChange={(val) => setPrivacy({ ...privacy, showLocation: val })}
                  label="Show location"
                  description="Display your Huud on profile"
                />
                <ToggleSwitch
                  enabled={privacy.showPhone}
                  onChange={(val) => setPrivacy({ ...privacy, showPhone: val })}
                  label="Show phone number"
                />
                <ToggleSwitch
                  enabled={privacy.showEmail}
                  onChange={(val) => setPrivacy({ ...privacy, showEmail: val })}
                  label="Show email address"
                />
              </Section>

              <button
                onClick={handleSavePrivacy}
                disabled={saving}
                className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save privacy settings'}
              </button>
            </div>
          ) : null}

          {activeTab === 'language' ? (
            <div className="space-y-4">
              <Section title={t('settings.language')} description={t('settings.languageDesc')}>
                <div className="space-y-2">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguage(lang);
                        toast.success(t('settings.languageSaved'));
                      }}
                      className="mod-inset flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{lang === 'en' ? '🇬🇧' : '🇳🇬'}</span>
                        <span style={{ color: 'var(--neu-text)' }}>{languageNames[lang]}</span>
                      </span>
                      {currentLanguage === lang ? (
                        <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-[var(--neu-text-muted)]">chevron_right</span>
                      )}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          ) : null}

          {activeTab === 'posts' ? (
            <div className="space-y-4">
              <Section title="Post Defaults" description="Configure your global default values for new posts created on the feed.">
                <div className="border-b py-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                    Default Language
                  </label>
                  <select
                    value={postSettings.defaultLanguage}
                    onChange={(e) => updatePostSettings({ defaultLanguage: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input bg-transparent"
                    style={{ color: 'var(--neu-text)' }}
                  >
                    <option value="en">English</option>
                    <option value="ha">Hausa</option>
                    <option value="yo">Yorùbá</option>
                    <option value="ig">Igbo</option>
                    <option value="pcm">Pidgin</option>
                  </select>
                </div>

                <div className="border-b py-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                    Default Visibility
                  </label>
                  <select
                    value={postSettings.defaultVisibility}
                    onChange={(e) => updatePostSettings({ defaultVisibility: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input bg-transparent"
                    style={{ color: 'var(--neu-text)' }}
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="neighborhood">NeyburH (Local)</option>
                    <option value="ward">Ward</option>
                  </select>
                </div>

                <div className="border-b py-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                    Default Priority (General Posts)
                  </label>
                  <select
                    value={postSettings.defaultPriorityStandard}
                    onChange={(e) => updatePostSettings({ defaultPriorityStandard: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input bg-transparent"
                    style={{ color: 'var(--neu-text)' }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="py-3">
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                    Default Priority (Help, Safety & Urgent Alerts)
                  </label>
                  <select
                    value={postSettings.defaultPriorityUrgent}
                    onChange={(e) => updatePostSettings({ defaultPriorityUrgent: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input bg-transparent"
                    style={{ color: 'var(--neu-text)' }}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </Section>

              <Section title="Auto-Hashtagging" description="Enrich your posts with neighborhood details automatically.">
                <ToggleSwitch
                  enabled={postSettings.autoHashtagLocation}
                  onChange={(val) => updatePostSettings({ autoHashtagLocation: val })}
                  label="Auto-Hashtag Active LGA"
                  description="Appends a hashtag of your current Local Government Area (e.g. #Ikeja) to all new posts."
                />
              </Section>

              <Section title="Saved Banking Profile" description="Pre-populate account details when creating Help Request templates.">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--neu-text-muted)]">Bank Name</label>
                    <input
                      type="text"
                      value={postSettings.bankName}
                      onChange={(e) => updatePostSettings({ bankName: e.target.value })}
                      placeholder="e.g. GTBank, Zenith"
                      className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--neu-text-muted)]">Account Name</label>
                    <input
                      type="text"
                      value={postSettings.accountName}
                      onChange={(e) => updatePostSettings({ accountName: e.target.value })}
                      placeholder="e.g. Yetunde Marteen"
                      className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--neu-text-muted)]">Account Number</label>
                    <input
                      type="text"
                      value={postSettings.accountNumber}
                      onChange={(e) => updatePostSettings({ accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10-digit NUBAN number"
                      maxLength={10}
                      className="w-full p-2.5 rounded-xl text-sm focus:outline-none neu-input font-mono"
                    />
                  </div>
                </div>
              </Section>
            </div>
          ) : null}
        </div>
      </AppBrowseLayout>
    );
}
