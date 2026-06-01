'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import { shouldRenderGlobalTopNav } from '@/lib/shellRoutes';

/**
 * Single global TopNav for routes that do not mount their own (feed, friendship, safety, etc.).
 */
export default function AutoTopNav() {
  const pathname = usePathname() || '/';

  const show = useMemo(() => shouldRenderGlobalTopNav(pathname), [pathname]);

  if (!show) return null;
  return <TopNav origin="global" />;
}
