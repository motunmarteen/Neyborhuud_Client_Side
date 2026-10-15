'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Sends old links to their new home (e.g. Gist, removed 2026-10-15, now opens the Feed). */
export function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);
  return null;
}
