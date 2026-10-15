'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Old /local-news/:id links (Huud Gist threads, removed 2026-10-15) open the news list. */
export default function LocalNewsLegacyRedirectClient() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/local-news');
  }, [router]);
  return null;
}
