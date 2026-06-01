'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import { routeUsesBrowseShell } from '@/lib/browseShellRoutes';

/**
 * Renders a TopNav globally for routes that don't already include one.
 * Skips `/`, `/feed`, `/chat/*` thread (custom header), and `AppBrowseLayout` routes.
 */
export default function AutoTopNav() {
  const pathname = usePathname() || '/';

  const excluded = useMemo(() => {
    if (pathname === '/' || pathname === '/feed') return true;
    if (routeUsesBrowseShell(pathname)) return true;
    // Thread view has its own back + title bar; inbox uses global nav only once
    if (pathname.startsWith('/chat/') && pathname !== '/chat') return true;
    return false;
  }, [pathname]);

  if (excluded) return null;
  return <TopNav origin="global" />;
}
