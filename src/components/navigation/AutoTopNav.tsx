'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';

/**
 * Renders a TopNav globally for routes that don't already include one.
 * Explicitly skips '/' and '/feed' per product requirement.
 */
export default function AutoTopNav() {
  const pathname = usePathname() || '/';

  const excluded = useMemo(() => pathname === '/' || pathname === '/feed', [pathname]);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (excluded) {
      setShouldRender(false);
      return;
    }

    // If the page already rendered its own TopNav, don't render another.
    const hasPageTopNav = !!document.querySelector('[data-topnav="1"][data-topnav-origin="page"]');
    setShouldRender(!hasPageTopNav);
  }, [excluded, pathname]);

  if (!shouldRender) return null;
  return <TopNav origin="global" />;
}
