'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import {
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
  getStoredCommunity,
} from '@/lib/communityContext';
import { hasCompletedProductTour } from '@/lib/onboarding';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { useMyGamificationStats } from '@/hooks/useGamification';

type StoredUser = {
  username?: string;
  email?: string;
};

const SIGNUP_REWARDS = [
  { label: 'Account created', coins: 20 },
  { label: 'Email verified', coins: 10 },
] as const;

const SETUP_CHECKLIST = [
  { id: 'account', label: 'Account created', icon: 'bi-person-check-fill' },
  { id: 'email', label: 'Email verified', icon: 'bi-envelope-check-fill' },
  { id: 'huud', label: 'Huud selected', icon: 'bi-house-heart-fill' },
  { id: 'location', label: 'Location confirmed', icon: 'bi-crosshair' },
] as const;

export default function SetupCompletePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const community = useMemo(() => getStoredCommunity(), []);
  const { data: stats } = useMyGamificationStats();
  const signupCoinsTotal = SIGNUP_REWARDS.reduce((sum, item) => sum + item.coins, 0);
  const walletBalance =
    typeof stats?.totalHuudCoins === 'number' ? stats.totalHuudCoins : signupCoinsTotal;

  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('neyborhuud_user');
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    apiClient.setToken(token);

    if (getNeedsCommunitySelection()) {
      router.replace('/pick-community');
      return;
    }
    if (getNeedsGpsLocationVerification()) {
      router.replace('/verify-location');
      return;
    }
    if (hasCompletedProductTour()) {
      router.replace('/feed');
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="auth-signup-page fixed-app flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
      </div>
    );
  }

  const handleName = user?.username ? `@${user.username}` : 'Neybor';
  const huudName = community?.name || community?.communityName || 'Your Huud';

  return (
    <AuthFlowPage
      ariaLabel="Registration complete"
      stageKey="setup-complete"
      stepLabel="Registration complete"
      progress={{ active: 3, total: 3, stepLabel: 'All set' }}
      hero={
        <AuthFlowHero
          icon="bi-stars"
          eyebrow="Registration successful"
          title={`You're in, ${handleName}`}
          meta={huudName}
        />
      }
      footer={
        <div className="auth-signup-actions">
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="auth-btn auth-btn-primary"
          >
            <span>Enter your Huud</span>
            <i className="bi bi-arrow-right shrink-0" aria-hidden />
          </button>
        </div>
      }
      footerLink={
        <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
          A quick welcome on your feed — three tips, then you are in.
        </p>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="auth-flow-notice auth-flow-notice--success">
          <i className="bi bi-check-circle-fill shrink-0" aria-hidden />
          <span>Your account is ready. Welcome to the Huud.</span>
        </div>

        <ul className="grid gap-2">
          {SETUP_CHECKLIST.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-primary/12 bg-primary/5 px-3.5 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <i className={`bi ${item.icon} text-sm`} aria-hidden />
              </span>
              <span className="text-sm font-semibold text-[var(--neu-text)]">{item.label}</span>
              <i className="bi bi-check-lg ml-auto text-primary" aria-hidden />
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">HuudCoins</p>
              <p className="text-[11px] font-semibold text-[var(--neu-text-muted)]">Already in your wallet</p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="text-3xl font-black leading-none">{walletBalance}</span>
              <i className="bi bi-coin text-xl text-brand-amber" aria-hidden />
            </div>
          </div>
          <ul className="grid gap-1 border-t border-primary/10 pt-2">
            {SIGNUP_REWARDS.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-[10px] font-medium text-[var(--neu-text-muted)]"
              >
                <span>{item.label}</span>
                <span className="font-bold text-primary">+{item.coins}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
          Your feed is one tap away — three quick tips when you arrive, then daily check-ins unlock.
        </p>
      </div>
    </AuthFlowPage>
  );
}
