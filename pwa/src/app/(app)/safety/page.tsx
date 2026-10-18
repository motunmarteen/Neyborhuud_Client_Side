'use client';

/**
 * The Sentinel tab is one screen (owner decisions 2026-10-11 and the agreed mockup): Ask
 * Sentinel, the area's mood, SOS, your guardians and trips, and every safety tool, at
 * /sentinel. This old address opens it so existing links keep working.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SafetyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sentinel');
  }, [router]);
  return (
    <div className="grid min-h-screen place-items-center text-sm font-bold text-navy" role="status">
      Opening Sentinel…
    </div>
  );
}
