'use client';

/**
 * The welcome is the live map itself now (owner: visitors see their area with no sign-up
 * wall). The old welcome page advertised Lagos "pilot zones"; NeyborHuud is for all of
 * Nigeria. This address opens the map for old links.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/huud');
  }, [router]);
  return (
    <div className="grid min-h-screen place-items-center bg-[#9ED3F5] text-sm font-bold text-navy" role="status">
      Opening your map…
    </div>
  );
}
