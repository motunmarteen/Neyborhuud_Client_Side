'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Explore and search now live in Ask Huud (/ask, owner 2026-10-19).
 * Old links (/explore, /explore?q=#tag from posts) still work: they land there with the query.
 */
function ExploreRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const q = params.get('q');
    router.replace(q ? `/ask?q=${encodeURIComponent(q)}` : '/ask');
  }, [params, router]);
  return null;
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreRedirect />
    </Suspense>
  );
}
