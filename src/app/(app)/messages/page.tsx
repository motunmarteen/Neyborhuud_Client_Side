'use client';

/**
 * /messages → /chat
 *
 * On the web/server build this redirect is handled by next.config redirects().
 * The static export (Capacitor) build does not support redirects(), so this
 * client-side replace covers it. Harmless on web: the server redirect fires
 * first, so this component never renders there.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/chat');
  }, [router]);
  return null;
}
