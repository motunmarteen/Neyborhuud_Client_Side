'use client';

/** Legacy gist detail path — Huud Gist now lives at /gist/[id]. Redirects, preserving the id. */

import { Suspense, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

function GistDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  useEffect(() => {
    router.replace(threadId ? `/gist/${threadId}` : '/gist');
  }, [router, threadId]);

  return null;
}

export default function LegacyGistDetailPage() {
  return (
    <Suspense fallback={null}>
      <GistDetailRedirect />
    </Suspense>
  );
}
