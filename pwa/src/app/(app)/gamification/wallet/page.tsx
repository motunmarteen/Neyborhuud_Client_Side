'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy route — forwards to Huud Economy wallet. */
export default function GamificationWalletRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    const qs = params.toString();
    router.replace(`/huud-economy/wallet${qs ? `?${qs}` : ''}`);
  }, [router, searchParams]);

  return null;
}
