'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import { shouldRenderGlobalLeftSidebar } from '@/lib/shellRoutes';

/**
 * Global mobile drawer for the hamburger menu (TopNav dispatches toggle-mobile-sidebar).
 */
export default function AutoLeftSidebar() {
  const pathname = usePathname() || '/';

  const show = useMemo(() => shouldRenderGlobalLeftSidebar(pathname), [pathname]);

  if (!show) return null;

  return <LeftSidebar origin="global" mode="mobile" />;
}
