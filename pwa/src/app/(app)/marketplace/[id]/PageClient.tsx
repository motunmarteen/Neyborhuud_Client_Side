'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Redirect legacy /marketplace/:id to the browse view (client-side for static export). */
export default function MarketplaceLegacyRedirectClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  useEffect(() => {
    const id = params?.id;
    router.replace(id ? `/marketplace?product=${encodeURIComponent(id)}` : '/marketplace');
  }, [router, params]);
  return null;
}
