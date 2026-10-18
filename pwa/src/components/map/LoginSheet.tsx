'use client';

/**
 * "Welcome back" on the live map (Getting started restyle, 2026-10-18). Replaces the old dark
 * /login page, like the Join sheet replaced /signup. Email or @username plus password; after
 * signing in you go where you were heading (?next=) or stay on your map.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { getAuthErrorMessage } from '@/lib/error-handler';
import { parseSafeNextPath } from '@/lib/authSession';
import { useTranslation } from '@/lib/i18n';

const INPUT =
  'min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold text-navy outline-none placeholder:text-faint focus:border-primary';

export function LoginSheet({ next, onClose, onJoin }: { next: string | null; onClose: () => void; onJoin: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let identifier = id.trim();
    if (identifier.startsWith('@') && !identifier.slice(1).includes('@')) identifier = identifier.slice(1).trim();
    try {
      const res = await login({ identifier, password: pw });
      if (!res.success || !apiClient.isAuthenticated()) {
        setError(getAuthErrorMessage(res.message || 'Login failed'));
        return;
      }
      const safe = parseSafeNextPath(next);
      if (safe && safe !== '/huud') router.push(safe);
      else onClose();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} aria-labelledby="login-h" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-green-dark">{t('auth.login.kicker')}</p>
          <h2 id="login-h" className="font-heading text-xl font-black text-navy">
            {t('auth.login.title')}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-10 w-10 place-items-center rounded-full bg-background text-navy">
          ✕
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-navy">{t('auth.login.identifier')}</span>
        <input
          className={INPUT}
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          inputMode="email"
          placeholder={t('auth.login.identifierHint')}
        />
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="login-pw" className="text-sm font-bold text-navy">
          {t('auth.password')}
        </label>
        <div className="relative">
          <input
            id="login-pw"
            className={`${INPUT} pr-20`}
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-full px-3 text-xs font-bold text-muted">
            {show ? t('auth.hide') : t('auth.show')}
          </button>
        </div>
        <Link href="/forgot-password" className="self-end text-xs font-bold text-brand-green-dark">
          {t('auth.login.forgot')}
        </Link>
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl bg-[#FDECEC] px-4 py-2 text-sm font-bold text-[#B42318]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!id.trim() || !pw || isLoggingIn}
        className="min-h-12 rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-50"
      >
        {isLoggingIn ? t('auth.login.busy') : t('auth.login.submit')}
      </button>
      <p className="text-center text-sm font-semibold text-muted">
        {t('auth.login.newHere')}{' '}
        <button type="button" onClick={onJoin} className="font-bold text-brand-green-dark">
          {t('auth.login.join')}
        </button>
      </p>
    </form>
  );
}
