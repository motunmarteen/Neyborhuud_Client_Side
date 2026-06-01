'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import { routeUsesBrowseShell } from '@/lib/browseShellRoutes';

/**
 * Global mobile drawer for the hamburger menu (TopNav dispatches toggle-mobile-sidebar).
 * Feed and `AppBrowseLayout` routes mount their own sidebar.
 */
export default function AutoLeftSidebar() {
  const pathname = usePathname() || '/';
  const excluded = useMemo(
    () => pathname === '/' || pathname === '/feed' || routeUsesBrowseShell(pathname),
    [pathname],
  );

  if (excluded) return null;

  return <LeftSidebar origin="global" mode="mobile" />;
}
