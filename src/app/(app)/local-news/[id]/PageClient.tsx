'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Redirect legacy /local-news/:id to the Huud Gist thread (client-side for static export). */
export default function LocalNewsLegacyRedirectClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  useEffect(() => {
    const id = params?.id;
    router.replace(id ? `/local-news/gist/${encodeURIComponent(id)}` : '/local-news');
  }, [router, params]);
  return null;
}
