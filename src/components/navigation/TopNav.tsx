'use client';

import { Suspense, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { AppNavIcon } from '@/components/navigation/AppNavIcon';
import { TopNavChatAction, CHAT_INBOX_HREF } from '@/components/navigation/TopNavChatAction';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useScrollHideBottomNav, useIsScrolled, scrollToTop } from '@/hooks/useScrollHideBottomNav';

type TopNavOrigin = 'page' | 'global';

function titleCaseFromSegment(segment: string) {
  const normalized = segment.replace(/[-_]+/g, ' ').trim();
  if (!normalized) return '';
  return normalized
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getRouteTitle(pathname: string) {
  const parts = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const segment = (parts[0] ?? '').toLowerCase();

  if (
    (segment === 'gamification' || segment === 'huud-economy') &&
    parts[1] === 'wallet'
  ) {
    return 'Huud Wallet';
  }
  if (segment === 'huud-economy' && parts[1] === 'score') {
    return 'Huud Score';
  }
  if (segment === 'huud-economy') {
    return 'Huud Economy';
  }
  if (segment === 'local-news' && parts[1] === 'gist') {
    return 'Huud Gist';
  }

  const map: Record<string, string> = {
    friendship: 'Friendship',
    marketplace: 'Marketplace',
    communities: 'Communities',
    neighborhood: 'My Huud',
    'help-request': 'Help Request',
    events: 'Events',
    'local-news': 'Local News',
    jobs: 'Jobs',
    notifications: 'Notifications',
    settings: 'Settings',
    safety: 'Sentinel AI',
    sentinel: 'Sentinel AI',
    map: 'Discovery',
    explore: 'Explore',
    popular: 'My Huud',
    gossip: 'Huud Gist',
    messages: 'Messages',
    chat: 'Chat',
    info: 'Info',
    sos: 'SOS',
    profile: 'Profile',
    gamification: 'Huud Economy',
    'huud-economy': 'Huud Economy',
  };

  if (map[segment]) return map[segment];
  return titleCaseFromSegment(segment) || 'NeyborHuud';
}

export default function TopNav({ origin = 'page' }: { origin?: TopNavOrigin }) {
  const pathname = usePathname();
  const isOnFeed = pathname === '/feed' || pathname === '/';
  const title = useMemo(() => (pathname ? getRouteTitle(pathname) : 'NeyborHuud'), [pathname]);
  const { data: unreadCount = 0 } = useUnreadCount();
  const scrollHidden = useScrollHideBottomNav();
  const isScrolled = useIsScrolled(60);

  // If we are on the feed, and the nav is either at the top OR it is currently hiding,
  // keep the transparent sky overlay so it doesn't flash solid white as it slides away.
  const skyOverlay = isOnFeed && (!isScrolled || scrollHidden);

  return (
    <>
    <div
      className={`app-topnav-host${skyOverlay ? ' app-topnav-host--sky-overlay' : ''}${scrollHidden ? ' app-topnav-host--hidden' : ''}`}
      data-topnav-host="1"
    >
    <header
      data-topnav="1"
      data-topnav-origin={origin}
      className={`app-topnav ${skyOverlay ? 'app-topnav--sky' : 'app-topnav--solid'}`}
    >
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="app-topnav__action md:hidden"
        aria-label="Open menu"
      >
        <AppNavIcon name="menu" />
      </button>

      {isOnFeed ? (
        <Link 
          href="/feed" 
          className="flex shrink-0 items-center min-w-0 cursor-pointer"
          onClick={(e) => {
            if (pathname === '/feed' || pathname === '/') {
              e.preventDefault();
              scrollToTop();
            }
          }}
        >
          <NeyborHuudLogo layout="wordmark" size="chrome" tone={skyOverlay ? 'light' : 'primary'} />
        </Link>
      ) : (
        <div className="flex shrink-0 items-center min-w-0">
          <h1 className="app-topnav__title truncate">{title}</h1>
        </div>
      )}

      <div className="flex-1" />

      <div className="app-topnav__actions">
        <Link
          href="/explore"
          className="app-topnav__action"
          aria-label="Search"
        >
          <AppNavIcon name="search" />
        </Link>
        <Link
          href="/notifications"
          className="app-topnav__action"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <AppNavIcon name="notifications" />
          {unreadCount > 0 && (
            <span className="app-topnav__badge" aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <Suspense
          fallback={
            <Link href={CHAT_INBOX_HREF} className="app-topnav__action" aria-label="Chat">
              <AppNavIcon name="messages" />
            </Link>
          }
        >
          <TopNavChatAction />
        </Suspense>
      </div>
    </header>
    </div>
    </>
  );
}
