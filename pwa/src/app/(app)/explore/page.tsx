'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Explore and search now live on the Sentinel screen (Ask Sentinel, tracker F-14).
 * Old links (/explore, /explore?q=#tag from posts) still work: they land there with the query.
 */
function ExploreRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const q = params.get('q');
    router.replace(q ? `/sentinel?q=${encodeURIComponent(q)}` : '/sentinel');
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
