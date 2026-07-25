'use client';

import React, { useRef, useSyncExternalStore, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppNavIcon, type AppNavIconName } from '@/components/navigation/AppNavIcon';
import { useScrollHideBottomNav, scrollToTop } from '@/hooks/useScrollHideBottomNav';
import { useUnreadCount } from '@/hooks/useNotifications';

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
  const { data: messageUnreadCount = 0 } = useUnreadCount('message');

  // Long-press on the Sentinel tab jumps straight to Fake Call — the
  // toolkit sheet + tile route needs 3+ taps, which undermines a feature
  // whose entire value is being fast and unremarkable to reach.
  const sentinelLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelLongPressFired = useRef(false);

  const clearSentinelLongPressTimer = () => {
    if (sentinelLongPressTimer.current) {
      clearTimeout(sentinelLongPressTimer.current);
      sentinelLongPressTimer.current = null;
    }
  };
  const startSentinelLongPress = () => {
    sentinelLongPressFired.current = false;
    clearSentinelLongPressTimer();
    sentinelLongPressTimer.current = setTimeout(() => {
      sentinelLongPressFired.current = true;
      router.push('/safety/fake-call');
    }, 600);
  };
  const cancelSentinelLongPress = () => {
    clearSentinelLongPressTimer();
  };


  const profileHref =
    isClient && user?.username ? `/profile/${user.username}` : '/settings';
  const isProfile =
    pathname.startsWith('/profile') ||
    (profileHref === '/settings' && pathname.startsWith('/settings'));

  const LINK_TABS: NavLinkTab[] = [
    { href: '/feed', label: 'Home', icon: 'home', match: (p) => p === '/feed' || p === '/' },
    { href: '/explore', label: 'Search', icon: 'search', match: (p) => p.startsWith('/explore') && !p.startsWith('/map') },
    { href: '/safety', label: 'Sentinel', icon: 'shield', match: (p) => p.startsWith('/safety') || p.startsWith('/sentinel') },
    { href: '/friendship', label: 'Connect', icon: 'connect', match: (p) => p.startsWith('/friendship') || p.startsWith('/chat') },
    { href: '/gist', label: 'Gist', icon: 'gist', match: (p) => p.startsWith('/gist') },
    { href: profileHref, label: 'Profile', icon: 'profile', match: (p) => p.startsWith('/profile') || (profileHref === '/settings' && p.startsWith('/settings')) },
  ];

  const renderLinkTab = (tab: NavLinkTab) => {
    const active = tab.match(pathname);
    const badgeCount = tab.label === 'Connect' ? messageUnreadCount : 0;
    const isSentinelTab = tab.label === 'Sentinel';

    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`app-bottomnav__item ${active ? 'app-bottomnav__item--active' : ''} relative`}
        aria-label={isSentinelTab ? 'Sentinel — tap to open, long-press for Fake Call' : tab.label}
        aria-current={active ? 'page' : undefined}
        onPointerDown={isSentinelTab ? startSentinelLongPress : undefined}
        onPointerUp={isSentinelTab ? cancelSentinelLongPress : undefined}
        onPointerLeave={isSentinelTab ? () => clearSentinelLongPressTimer() : undefined}
        onContextMenu={isSentinelTab ? (e) => e.preventDefault() : undefined}
        onClick={(e) => {
          if (isSentinelTab) {
            e.preventDefault();
            if (sentinelLongPressFired.current) {
              sentinelLongPressFired.current = false;
              return;
            }
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
          <div className="relative inline-flex items-center justify-center">
            <AppNavIcon name={tab.icon} active={active} />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
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
