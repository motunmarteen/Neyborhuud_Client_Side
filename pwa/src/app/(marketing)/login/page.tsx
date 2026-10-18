'use client';

/**
 * Signing in happens on the live map now (Getting started restyle, 2026-10-18): the
 * "Welcome back" sheet on /huud. This address stays for old links and the sign-in guard,
 * and keeps ?next= so you still land where you were going.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute, validateStoredSession } from '@/lib/authSession';

function Redirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const next = params.get('next');
    let cancelled = false;
    void (async () => {
      // Already signed in: go straight on.
      if (apiClient.isAuthenticated() && (await validateStoredSession()) === 'valid') {
        if (!cancelled) router.replace(resolvePostAuthRoute(next));
        return;
      }
      if (!cancelled) router.replace(next ? `/huud?login=1&next=${encodeURIComponent(next)}` : '/huud?login=1');
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);
  return (
    <div className="grid min-h-screen place-items-center bg-[#9ED3F5] text-sm font-bold text-navy" role="status">
      Opening your map…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#9ED3F5]" />}>
      <Redirect />
    </Suspense>
  );
}
