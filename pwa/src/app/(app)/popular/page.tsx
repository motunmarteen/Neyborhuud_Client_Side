'use client';

/** Legacy /popular URL — merged into My Huud (Street Radar tab). Client-side
 *  redirect so it works under static export (no server searchParams). */
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PopularRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const legacy = searchParams.get('tab');
    const tab = !legacy || legacy === 'hot' ? 'street-radar' : legacy;
    router.replace(`/neighborhood?tab=${encodeURIComponent(tab)}`);
  }, [router, searchParams]);
  return null;
}

export default function PopularPage() {
  return (
    <Suspense fallback={null}>
      <PopularRedirect />
    </Suspense>
  );
}
