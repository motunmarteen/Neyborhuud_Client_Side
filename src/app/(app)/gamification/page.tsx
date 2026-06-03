'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy route — forwards to Huud Economy hub. */
export default function GamificationRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const qs = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    router.replace(`/huud-economy/score${qs}`);
  }, [router, searchParams]);

  return null;
}
