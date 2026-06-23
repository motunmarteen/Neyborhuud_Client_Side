'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Redirect legacy /local-news/:id to the Huud Gist thread at its new /gist pillar. */
export default function LocalNewsLegacyRedirectClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  useEffect(() => {
    const id = params?.id;
    router.replace(id ? `/gist/${encodeURIComponent(id)}` : '/gist');
  }, [router, params]);
  return null;
}
