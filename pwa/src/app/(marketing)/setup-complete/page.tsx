'use client';

/**
 * "You're in" after setup (Getting started restyle, 2026-10-18). Only true things: the
 * checklist ticks what is really done (email, home area), the balance shows only once the
 * real number is loaded, and the next step is your map plus the welcome quest.
 * (It used to tick every step and show an invented "30" while loading.)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getNeedsCommunitySelection, getNeedsGpsLocationVerification, getStoredCommunity } from '@/lib/communityContext';
import { hasCompletedProductTour, markProductTourComplete } from '@/lib/onboarding';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';

export default function SetupCompletePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const community = useMemo(() => getStoredCommunity(), []);
  const { data: stats } = useMyGamificationStats();
  const balance = typeof stats?.totalHuudCoins === 'number' ? stats.totalHuudCoins : null;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
    if (!token) {
      router.replace('/huud?login=1');
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
      router.replace('/huud');
      return;
    }
    markProductTourComplete();
    setReady(true);
  }, [router]);

  if (!ready) return <AuthFlowLoading />;

  const u = user as { username?: string; firstName?: string; emailVerified?: boolean; isEmailVerified?: boolean; lga?: string; location?: { lga?: string } } | null;
  const name = u?.firstName || (u?.username ? `@${u.username}` : t('auth.setup.friend'));
  const area = community?.name || community?.communityName || u?.lga || u?.location?.lga || null;
  const checks = [
    { id: 'account', done: true, label: t('auth.setup.account') },
    { id: 'email', done: Boolean(u?.emailVerified || u?.isEmailVerified), label: t('auth.setup.email'), href: '/verify-email' },
    { id: 'home', done: Boolean(area), label: t('auth.setup.home'), href: '/settings' },
  ];

  return (
    <AuthFlowPage
      ariaLabel={t('auth.setup.title', { name })}
      stageKey="setup-complete"
      stepLabel={t('auth.setup.step')}
      hero={<AuthFlowHero icon="auto_awesome" eyebrow={t('auth.setup.kicker')} title={t('auth.setup.title', { name })} meta={area ?? ''} />}
      footer={
        <div className="auth-signup-actions">
          <button type="button" onClick={() => router.push('/huud')} className="auth-btn auth-btn-primary flex items-center justify-center gap-2">
            <span>{t('auth.verify.continue')}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <ul className="grid gap-2">
          {checks.map((c) => (
            <li key={c.id} className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 ${c.done ? 'border-primary/20 bg-primary/5' : 'border-line bg-white'}`}>
              <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${c.done ? 'bg-primary text-white' : 'bg-background text-muted'}`}>
                {c.done ? '✓' : '•'}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-navy">
                {c.label}
                <span className="sr-only">{c.done ? ` (${t('auth.setup.done')})` : ` (${t('auth.setup.notYet')})`}</span>
              </span>
              {!c.done && c.href ? (
                <Link href={c.href} className="text-xs font-bold text-brand-green-dark">
                  {t('auth.setup.doIt')}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        {balance !== null ? (
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-bold text-navy">{t('auth.verify.balance')}</p>
            <p className="font-heading text-2xl font-black text-navy">🪙 {balance.toLocaleString('en-NG')}</p>
          </div>
        ) : null}
        <Link href="/rewards" className="flex items-center gap-3 rounded-2xl bg-amber-soft px-4 py-3">
          <span aria-hidden className="text-2xl">
            🧭
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-bold text-navy">{t('auth.setup.questTitle')}</span>
            <span className="text-xs font-semibold text-muted">{t('auth.setup.questBody')}</span>
          </span>
        </Link>
      </div>
    </AuthFlowPage>
  );
}
