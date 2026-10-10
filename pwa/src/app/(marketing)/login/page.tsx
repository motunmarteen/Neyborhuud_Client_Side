'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, UserPlus, AlertCircle, Fingerprint, Lock, Mail, Sparkles } from 'lucide-react';
import { PremiumInput } from '@/components/ui/PremiumInput';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute, validateStoredSession } from '@/lib/authSession';
import { getAuthErrorMessage } from '@/lib/error-handler';
import { useAuth } from '@/hooks/useAuth';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import { DEMO_MODE } from '@/lib/demoMode';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const { login, isLoggingIn } = useAuth();

  const [checkingSession, setCheckingSession] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!apiClient.isAuthenticated()) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      const validation = await validateStoredSession();
      if (cancelled) return;

      if (validation === 'valid') {
        router.replace(resolvePostAuthRoute(nextParam));
        return;
      }

      if (validation === 'invalid') {
        apiClient.clearToken();
        if (!cancelled) setCheckingSession(false);
        return;
      }

      if (!cancelled) setCheckingSession(false);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [router, nextParam]);

  const loading = isLoggingIn;
  const canLogin = formData.email.trim().length > 0 && formData.password.length > 0 && !loading;
  const loginIdentity = formData.email.trim() || 'you@example.com';

  const handleDemoLogin = () => {
    // Never available in production builds — see lib/demoMode.ts.
    if (!DEMO_MODE) return;
    const demoToken = 'demo_resident_token_' + Date.now();
    const demoUser = {
      id: 'usr_6633a1b2c3d4e5f678901234',
      _id: 'usr_6633a1b2c3d4e5f678901234',
      username: 'MotunMarteen',
      firstName: 'Motun',
      lastName: 'Marteen',
      email: 'demo@neyborhuud.ng',
      isEmailVerified: true,
      emailVerified: true,
      isVerified: true,
      role: 'user',
      points: 150,
      trustScore: 88,
      location: {
        neighborhood: 'Egbeda',
        lga: 'Alimosho',
        state: 'Lagos',
        country: 'Nigeria',
        address: 'Lasu-Isheri Road, Alimosho, Lagos',
        coordinates: [3.2500, 6.5497],
      },
      primaryLocation: {
        address: 'Lasu-Isheri Road, Alimosho, Lagos',
        state: 'Lagos',
        lga: 'Alimosho',
        neighborhood: 'Egbeda',
        lat: 6.5497,
        lng: 3.2500,
        type: 'Point',
        coordinates: [3.2500, 6.5497],
      },
    };

    const demoCommunity = {
      id: '6633a1b2c3d4e5f678901234',
      locationKey: 'alimosho-egbeda',
      communityName: 'Egbeda Central',
      name: 'Egbeda Central',
      state: 'Lagos',
      lga: 'Alimosho',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('neyborhuud_access_token', demoToken);
      localStorage.setItem('neyborhuud_user', JSON.stringify(demoUser));
      localStorage.setItem('neyborhuud_community', JSON.stringify(demoCommunity));
      localStorage.removeItem('neyborhuud_needs_community');
      localStorage.removeItem('neyborhuud_needs_gps_verify');
      apiClient.setToken(demoToken);
    }

    toast.success('Welcome back, Motun! Resident pass unlocked. 🎉');
    router.replace('/feed');
  };

  const fillTestCredentials = () => {
    setFormData({
      email: 'demo@neyborhuud.ng',
      password: 'TestPassword123!',
    });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const raw = formData.email.trim();
    // Normalize: strip leading '@' if entered as @username
    let identifier = raw;
    if (identifier.startsWith('@') && !identifier.slice(1).includes('@')) {
      identifier = identifier.slice(1).trim();
    }

    // If using the demo credentials directly, log in smoothly with demo pass
    if (DEMO_MODE && (identifier === 'demo@neyborhuud.ng' || identifier === 'demo')) {
      handleDemoLogin();
      return;
    }

    try {
      const response = await login({
        identifier,
        password: formData.password,
      });

      if (!response.success || !apiClient.isAuthenticated()) {
        const msg = getAuthErrorMessage(response.message || 'Login failed');
        setFormError(msg);
        toast.error(msg, { duration: 5000 });
        return;
      }

      router.push(resolvePostAuthRoute(nextParam));
    } catch (error: unknown) {
      const friendlyMsg = getAuthErrorMessage(error);
      setFormError(friendlyMsg);
      toast.error(friendlyMsg, { duration: 5000 });
    }
  };

  if (checkingSession) {
    return <AuthFlowLoading />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthFlowPage
        ariaLabel="Enter your Huud"
        stageKey="login"
        showChrome={false}
        keyboardAware
        hero={
          <AuthFlowHero
            icon={Fingerprint}
            eyebrow={formData.email.trim() ? 'Resident Pass Ready' : 'Biometric & Secure Entry'}
            title="Welcome back"
            meta={loginIdentity}
          />
        }
        footer={
          <div className="w-full flex flex-col gap-2">
            <button
              type="submit"
              disabled={!canLogin}
              className="w-full py-3 px-5 rounded-xl bg-[#00B82E] hover:bg-[#00FF3E] disabled:opacity-40 disabled:pointer-events-none text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-black/30 border-t-black animate-spin"
                    aria-hidden
                  />
                  <span>Opening your Huud…</span>
                </>
              ) : (
                <>
                  <span>Enter Your Huud</span>
                  <ArrowRight size={15} strokeWidth={2.4} />
                </>
              )}
            </button>

            {DEMO_MODE && (
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] text-[#1D2433] font-bold text-xs flex items-center justify-center gap-2 border border-black/[0.08] transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles size={14} className="text-[#0E8A3E]" />
              <span>Explore as Demo Resident (1-Tap Pass)</span>
            </button>
            )}

            <Link
              href="/signup"
              className="w-full py-2.5 px-5 rounded-xl border border-black/[0.08] bg-white text-[#1D2433] font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/[0.04] transition-all active:scale-[0.98] no-underline cursor-pointer"
            >
              <UserPlus size={14} strokeWidth={2} />
              <span>Create New Resident Account</span>
            </Link>
          </div>
        }
      >
        <div className="flex flex-col gap-3.5 w-full">
          <PremiumInput
            label="Email or Username"
            type="text"
            icon={Mail}
            placeholder="resident@neyborhuud.ng or @username"
            value={formData.email}
            onChange={(e) => {
              setFormError(null);
              setFormData({ ...formData, email: e.target.value });
            }}
            autoComplete="username"
            inputMode="text"
          />

          <PremiumInput
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Enter account password"
            value={formData.password}
            onChange={(e) => {
              setFormError(null);
              setFormData({ ...formData, password: e.target.value });
            }}
            autoComplete="current-password"
          />

          <div className="flex justify-between items-center px-1">
            {DEMO_MODE ? (
            <button
              type="button"
              onClick={fillTestCredentials}
              className="text-[11px] font-bold text-[#0E8A3E] hover:text-[#00B02A] flex items-center gap-1 transition-colors"
            >
              <Sparkles size={12} />
              <span>Fill demo credentials</span>
            </button>
            ) : <span />}
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-[#0E8A3E] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {formError && (
            <div
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2"
              role="alert"
            >
              <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>
      </AuthFlowPage>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFlowLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
