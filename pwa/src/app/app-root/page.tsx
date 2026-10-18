'use client';

/**
 * The app's front door (app.neyborhuud.com/ is rewritten here). Everyone goes to the live
 * map: members to My Huud, visitors to their area with a welcome card and "Join free"
 * (owner: no sign-up wall). This replaced the old dark splash screen (2026-10-18).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute, validateStoredSession } from '@/lib/authSession';

export default function AppRoot() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (apiClient.isAuthenticated() && (await validateStoredSession()) !== 'invalid') {
        if (!cancelled) router.replace(resolvePostAuthRoute());
        return;
      }
      if (!cancelled) router.replace('/huud');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  return <div className="min-h-screen bg-[#9ED3F5]" aria-busy="true" />;
}
