'use client';

/**
 * /chat (inbox landing) now lives inside the unified Connect hub (/friendship).
 * Only the INBOX LANDING moved — actual conversations (/chat/[conversationId])
 * are untouched. This page redirects, preserving the tab.
 *
 * Server redirect is also configured in next.config; this client redirect covers
 * the static-export (Capacitor) build which doesn't support redirects().
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ChatRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    let target = '/friendship?tab=dms';
    if (tab === 'communities' || tab === 'groups') target = '/friendship?tab=communities';
    else if (tab === 'all') target = '/friendship?tab=dms';
    router.replace(target);
  }, [router, searchParams]);

  return null;
}

export default function ChatInboxRedirectPage() {
  return (
    <Suspense fallback={null}>
      <ChatRedirect />
    </Suspense>
  );
}
