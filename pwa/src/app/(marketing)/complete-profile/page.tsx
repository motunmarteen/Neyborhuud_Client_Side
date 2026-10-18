'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiErrors';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { toast } from 'sonner';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { resolveUserPhone } from '@/lib/userProfileFields';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  ChevronUp,
  SkipForward,
  ShieldCheck,
} from 'lucide-react';

const TOKEN_KEY = 'neyborhuud_access_token';

function clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('neyborhuud_refresh_token');
    localStorage.removeItem('neyborhuud_user');
}

export default function CompleteProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const submittingRef = useRef(false);
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const { data: gamificationStats } = useMyGamificationStats();
    const profileCoinBalance =
        typeof gamificationStats?.totalHuudCoins === 'number'
            ? gamificationStats.totalHuudCoins
            : null;
    // The 100 is paid once ever. People who gave their name at sign-up got it
    // then, so the screen must not promise it again.
    const profileRewardPaid = gamificationStats?.onceRewards?.complete_profile === true;
    const [rewardPaidBeforeSubmit, setRewardPaidBeforeSubmit] = useState<boolean | null>(null);
    const earnedProfileReward = rewardPaidBeforeSubmit === false && profileRewardPaid;
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        dob: '',
    });

    const isPhoneValid = /^(?:\+234|0)[789][01]\d{8}$/.test(formData.phone);
    const isFormValid =
        Boolean(formData.firstName.trim() && formData.lastName.trim() && isPhoneValid);
    const displayName =
        formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : t('auth.profile.yours');

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        const userData = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;

        setHasToken(!!token);

        if (!token) {
            router.replace('/huud?login=1');
            return;
        }

        if (userData) {
            try {
                const user = JSON.parse(userData);
                const isVerified =
                    user.emailVerified === true ||
                    user.isVerified === true ||
                    user.email_verified === true ||
                    user.verificationStatus === 'verified';

                if (!isVerified) {
                    toast.error(t('auth.profile.verifyFirst'));
                    router.replace('/verify-email');
                    return;
                }

                setFormData((prev) => ({
                    firstName: user.firstName || user.first_name || prev.firstName,
                    lastName: user.lastName || user.last_name || prev.lastName,
                    phone: resolveUserPhone(user) || prev.phone,
                    gender: user.gender || prev.gender,
                    dob: user.dateOfBirth?.slice(0, 10) || prev.dob,
                }));
            } catch (e) {
                void e;
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submittingRef.current || loading) return;

        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

        if (!token) {
            toast.error(t('auth.profile.expired'));
            router.push('/huud?login=1');
            return;
        }

        submittingRef.current = true;
        setLoading(true);
        // Unknown (stats not loaded) stays null, so we never claim a +100 we cannot confirm.
        setRewardPaidBeforeSubmit(gamificationStats ? profileRewardPaid : null);

        try {
            const response = await authService.completeProfile(formData);
            if (!response.success) {
                throw new Error(response.message || t('auth.profile.failed'));
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
                queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] }),
            ]);
            setStep('success');
        } catch (error: unknown) {
            const msg = getApiErrorMessage(error, t('auth.profile.failed'));
            const status = getApiErrorStatus(error);
            const msgLower = msg.toLowerCase();

            const storedUser = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user') : null;
            let userVerified = false;
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    userVerified =
                        user.emailVerified === true ||
                        user.isVerified === true ||
                        user.email_verified === true;
                } catch (e) {
                    void e;
                }
            }

            if (
                status === 403 ||
                msgLower.includes('verify your email') ||
                msgLower.includes('verification') ||
                msgLower.includes('email not verified')
            ) {
                toast.error(msg || t('auth.profile.verifyFirst'));
                router.push('/verify-email');
                return;
            }

            if (
                msgLower.includes('user not active') ||
                msgLower.includes("account isn't active") ||
                msgLower.includes('account is not active')
            ) {
                if (userVerified && status === 401) {
                    clearAuth();
                    toast.error(t('auth.profile.expired'));
                    router.push('/huud?login=1');
                    return;
                }

                if (status === 403) {
                    toast.error(t('auth.profile.verifyFirst'));
                    router.push('/verify-email');
                    return;
                }
                toast.error(t('auth.profile.verifyFirst'));
                router.push('/verify-email');
                return;
            }

            if (
                status === 401 ||
                msgLower.includes('authentication required') ||
                msgLower.includes('session is invalid') ||
                msgLower.includes('expired') ||
                msgLower.includes('invalid token')
            ) {
                clearAuth();
                toast.error(msg || t('auth.profile.expired'));
                router.push('/huud?login=1');
                return;
            }

            toast.error(msg);
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    if (hasToken === false || hasToken === null) {
        return <AuthFlowLoading />;
    }

    if (step === 'success') {
        return (
            <AuthFlowPage
                ariaLabel={t('auth.profile.doneTitle')}
                stageKey="complete-profile-success"
                stepLabel={t('auth.profile.doneTitle')}
                hero={
                    <AuthFlowHero
                        icon="redeem-fill"
                        eyebrow={t('auth.profile.doneKicker')}
                        title={t('auth.profile.doneTitle')}
                        meta={t('auth.profile.doneMeta')}
                    />
                }
                footer={
                    <div className="auth-signup-actions">
                        <button
                            type="button"
                            onClick={() => router.push('/huud')}
                            className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
                        >
                            <span>{t('auth.verify.continue')}</span>
                            <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <div className="auth-flow-notice auth-flow-notice--success flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary shrink-0" aria-hidden="true" />
                        <span>{t('auth.profile.doneNote')}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">HuudCredit</p>
                                <Eli5Tooltip 
                                    term="HuudCredit"
                                    explanation={t('auth.profile.creditWhat')}
                                />
                            </div>
                            <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">
                                {earnedProfileReward ? t('auth.profile.reward') : t('auth.profile.balance')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                            <span className="text-3xl font-black leading-none">
                                {earnedProfileReward ? '+100' : profileCoinBalance ?? '…'}
                            </span>
                            <Coins size={22} className="text-primary shrink-0" aria-hidden="true" />
                        </div>
                    </div>
                    {earnedProfileReward && profileCoinBalance !== null ? (
                        <p className="text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
                            {t('auth.profile.nowHave', { n: profileCoinBalance.toLocaleString('en-NG') })}
                        </p>
                    ) : null}
                </div>
            </AuthFlowPage>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <AuthFlowPage
                ariaLabel={t('auth.profile.title')}
                stageKey="complete-profile-form"
                stepLabel={t('auth.profile.title')}
                keyboardAware
                peek={
                    <div className="auth-signup-identity-peek">
                        <span className="auth-signup-identity-peek__avatar" aria-hidden>
                            {formData.firstName.trim() ? formData.firstName.trim().charAt(0).toUpperCase() : 'N'}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="auth-signup-identity-peek__label">{t('auth.profile.title')}</p>
                            <p className="auth-signup-identity-peek__name truncate">{displayName}</p>
                        </div>
                        <span className="auth-signup-identity-peek__chevron" aria-hidden>
                            <ChevronUp size={16} strokeWidth={2} />
                        </span>
                    </div>
                }
                footer={
                    <div>
                        <div className="auth-signup-actions">
                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                                        <span>{t('auth.reset.busy')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{profileRewardPaid ? t('auth.profile.save') : t('auth.profile.claim')}</span>
                                        <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/huud')}
                                className="auth-btn auth-btn-secondary flex items-center justify-center gap-2"
                            >
                                <SkipForward size={16} strokeWidth={2} className="shrink-0" />
                                <span>{t('auth.pick.skip')}</span>
                            </button>
                        </div>
                    </div>
                }
            >
                <AuthSheetStageHeader
                    icon="badge"
                    eyebrow={profileRewardPaid ? t('auth.profile.title') : t('auth.profile.kicker')}
                    title={displayName}
                    meta={profileRewardPaid ? t('auth.profile.why') : t('auth.profile.rewardMeta')}
                    signal={t('auth.profile.signal')}
                    badge=""
                />

                <div className="auth-signup-sheet-fields flex max-h-[44dvh] flex-col gap-4 overflow-y-auto overscroll-contain pb-1">
                    <div className="grid grid-cols-2 gap-3">
                        <PremiumInput
                            label={t('auth.profile.first')}
                            placeholder="Ada"
                            className="py-0.5"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                        <PremiumInput
                            label={t('auth.profile.last')}
                            placeholder="Okafor"
                            className="py-0.5"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    <PremiumInput
                        label={t('auth.profile.phone')}
                        type="tel"
                        icon="phone"
                        placeholder="08012345678"
                        className="py-0.5"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        error={
                            formData.phone && !isPhoneValid ? t('auth.profile.phoneBad') : undefined
                        }
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[var(--neu-text-muted)]">
                            {t('auth.profile.gender')}
                        </label>
                        <div className="flex gap-2">
                            {['male', 'female', 'other'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    className={`flex-1 rounded-xl border py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        formData.gender === g
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-charcoal/10 bg-[var(--neu-bg)] text-[var(--neu-text-muted)]'
                                    }`}
                                >
                                    {t(`auth.profile.g.${g}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PremiumInput
                        label={t('auth.profile.dob')}
                        type="date"
                        icon="event"
                        className="py-0.5"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />

                    <div className="auth-flow-notice auth-flow-notice--info flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary shrink-0" aria-hidden="true" />
                        <span>{t('auth.profile.privacy')}</span>
                    </div>
                </div>
            </AuthFlowPage>
        </form>
    );
}
