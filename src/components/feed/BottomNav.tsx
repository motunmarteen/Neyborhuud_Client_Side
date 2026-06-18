'use client';

import React, { useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSos } from '@/hooks/useSos';
import { useNeighborhoodEmergency } from '@/hooks/useNeighborhoodEmergency';
import { AppNavIcon, type AppNavIconName } from '@/components/navigation/AppNavIcon';

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

const LINK_TABS: NavLinkTab[] = [
  { href: '/feed', label: 'Home', icon: 'home', match: (p) => p === '/feed' || p === '/' },
  { href: '/safety', label: 'Safety', icon: 'shield', match: (p) => p.startsWith('/safety') || p.startsWith('/sentinel') },
  { href: '/friendship', label: 'Connect', icon: 'connect', match: (p) => p.startsWith('/friendship') },
  { href: '/chat', label: 'Calls', icon: 'call', match: (p) => p.startsWith('/chat') },
];

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BottomNav({ hidden = false }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const sos = useSos();
  const hasNeighborhoodEmergency = useNeighborhoodEmergency();

  const isClient = useIsClient();
  const profileHref =
    isClient && user?.username ? `/profile/${user.username}` : '/settings';
  const isProfile =
    pathname.startsWith('/profile') ||
    (profileHref === '/settings' && pathname.startsWith('/settings'));

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const SOS_HREF = '/sos';
  const sosActive = pathname.startsWith('/sos') || pathname.startsWith('/safety') || sos.phase !== 'idle';

  const startSosPress = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      void sos.triggerSos({ silent: true });
    }, 600);
  };

  const cancelSosPress = (e: React.SyntheticEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressFired.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressFired.current = false;
      return;
    }
    if (e.type === 'pointerup' || e.type === 'touchend' || e.type === 'mouseup') {
      router.push(SOS_HREF);
    }
  };

  const renderLinkTab = (tab: NavLinkTab) => {
    const active = tab.match(pathname);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`app-bottomnav__item${active ? ' app-bottomnav__item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
        aria-label={tab.label}
      >
        <span className="app-bottomnav__icon-wrap">
          <AppNavIcon name={tab.icon} active={active} />
        </span>
      </Link>
    );
  };

  return (
    <nav className="app-bottomnav" role="navigation" aria-label="Main navigation">
      <div className={`app-bottomnav__dock${hidden ? ' app-bottomnav__dock--hidden' : ''}`}>
        <div className="app-bottomnav__pill app-bottomnav__glass">
          {LINK_TABS.map(renderLinkTab)}

          <Link
            href={profileHref}
            className={`app-bottomnav__item${isProfile ? ' app-bottomnav__item--active' : ''}`}
            aria-current={isProfile ? 'page' : undefined}
            aria-label="Profile"
          >
            <span className="app-bottomnav__icon-wrap">
              <AppNavIcon name="profile" active={isProfile} />
            </span>
          </Link>
        </div>

        <div className="app-bottomnav__sos">
          <div className="app-bottomnav__sos-glass app-bottomnav__glass app-bottomnav__glass--disc">
            <button
              type="button"
              onPointerDown={startSosPress}
              onPointerUp={cancelSosPress}
              onPointerLeave={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`app-bottomnav__sos-btn${sosActive ? ' app-bottomnav__sos-btn--active' : ''}`}
              aria-current={sosActive ? 'page' : undefined}
              aria-label="SOS — tap to open command center, long-press for silent SOS"
            >
              <span
                className={`app-bottomnav__sos-ring ${(sos.phase !== 'idle' || hasNeighborhoodEmergency) ? 'app-bottomnav__sos-ring--live' : 'app-bottomnav__sos-ring--idle'}`}
                aria-hidden
              />
              <AppNavIcon name="sos" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
