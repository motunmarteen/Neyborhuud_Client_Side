'use client';

import React, { useRef, useSyncExternalStore, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppNavIcon, type AppNavIconName } from '@/components/navigation/AppNavIcon';
import { useScrollHideBottomNav, scrollToTop } from '@/hooks/useScrollHideBottomNav';

interface BottomNavProps {
  /** Set true only when the nav should be fully hidden (e.g. map overlay). */
  hidden?: boolean;
}

type NavLinkTab = {
  href: string;
  label: string;
  icon: AppNavIconName;
  match: (p: string) => boolean;
};

import { useSentinelBottomSheet } from '@/contexts/SentinelBottomSheetContext';

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Shrinks the bottom nav pill to 2/3 size when the user scrolls down.
 *  Uses capture-phase listener so it catches scroll from ANY container
 *  (Next.js App Router wraps content in a scrollable div, not window). */
function useScrollCompact() {
  return false;
}

export function BottomNav({ hidden = false }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const compact = useScrollCompact();
  const scrollHidden = useScrollHideBottomNav();
  const { openSheet } = useSentinelBottomSheet();

  const isClient = useIsClient();


  const profileHref =
    isClient && user?.username ? `/profile/${user.username}` : '/settings';
  const isProfile =
    pathname.startsWith('/profile') ||
    (profileHref === '/settings' && pathname.startsWith('/settings'));

  const LINK_TABS: NavLinkTab[] = [
    { href: '/feed', label: 'Home', icon: 'home', match: (p) => p === '/feed' || p === '/' },
    { href: '/explore', label: 'Search', icon: 'search', match: (p) => p.startsWith('/explore') && !p.startsWith('/map') },
    { href: '/safety', label: 'Sentinel', icon: 'shield', match: (p) => p.startsWith('/safety') || p.startsWith('/sentinel') },
    { href: '/map', label: 'Map', icon: 'mapPin', match: (p) => p.startsWith('/map') }, 
    { href: '/friendship', label: 'Connect', icon: 'connect', match: (p) => p.startsWith('/friendship') || p.startsWith('/chat') },
    { href: '/gist', label: 'Gist', icon: 'gist', match: (p) => p.startsWith('/gist') },
  ];

  const renderLinkTab = (tab: NavLinkTab) => {
    const active = tab.match(pathname);
    
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`app-bottomnav__item ${active ? 'app-bottomnav__item--active' : ''}`}
        aria-label={tab.label}
        aria-current={active ? 'page' : undefined}
        onClick={(e) => {
          if (tab.label === 'Sentinel') {
            e.preventDefault();
            openSheet();
            return;
          }
          if (active) {
            e.preventDefault();
            scrollToTop();
          }
        }}
      >
        <span className="app-bottomnav__icon-wrap">
          <AppNavIcon name={tab.icon} active={active} />
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="app-bottomnav"
      role="navigation"
      aria-label="Main navigation"
      data-compact={compact ? 'true' : undefined}
    >
      <div className={`app-bottomnav__dock${hidden || scrollHidden ? ' app-bottomnav__dock--hidden' : ''}`}>
        <div className="app-bottomnav__pill app-bottomnav__glass">
          {LINK_TABS.map(renderLinkTab)}
        </div>

      </div>
    </nav>
  );
}
