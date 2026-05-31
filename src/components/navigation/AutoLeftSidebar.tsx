'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/navigation/LeftSidebar';

/**
 * Global mobile drawer for the hamburger menu (TopNav dispatches toggle-mobile-sidebar).
 * Feed mounts its own LeftSidebar with mode="both"; all other routes use this global drawer.
 */
export default function AutoLeftSidebar() {
  const pathname = usePathname() || '/';
  const excluded = useMemo(() => pathname === '/' || pathname === '/feed', [pathname]);

  if (excluded) return null;

  return <LeftSidebar origin="global" mode="mobile" />;
}
