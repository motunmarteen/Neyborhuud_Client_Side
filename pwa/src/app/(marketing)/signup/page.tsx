'use client';

/**
 * Joining now happens on the live map (owner 2026-10-18): the short "Join your neighbours"
 * sheet on /huud. This address stays so old links and shared invites still work; it passes
 * the invite code along (?ref=, ?invite=, ?referral= or ?code=).
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get('ref') ?? params.get('invite') ?? params.get('referral') ?? params.get('code');
    router.replace(ref ? `/huud?join=1&ref=${encodeURIComponent(ref.trim())}` : '/huud?join=1');
  }, [params, router]);
  return (
    <div className="grid min-h-screen place-items-center bg-[#9ED3F5] text-sm font-bold text-navy" role="status">
      Opening your map…
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#9ED3F5]" />}>
      <Redirect />
    </Suspense>
  );
}
