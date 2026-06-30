'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import { shouldRenderGlobalLeftSidebar } from '@/lib/shellRoutes';
import { isOnboardingOrAuthRoute } from '@/lib/appShellGates';

/**
 * Global mobile drawer for the hamburger menu (TopNav dispatches toggle-mobile-sidebar).
 */
export default function AutoLeftSidebar() {
  const pathname = usePathname() || '/';

  const show = useMemo(() => {
    if (isOnboardingOrAuthRoute(pathname)) return false;
    return shouldRenderGlobalLeftSidebar(pathname);
  }, [pathname]);

  if (!show) return null;

  return <LeftSidebar origin="global" mode="mobile" />;
}
