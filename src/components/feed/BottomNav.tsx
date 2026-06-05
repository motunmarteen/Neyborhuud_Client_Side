'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useScrollHideBottomNav } from '@/hooks/useScrollHideBottomNav';
import { useSos } from '@/hooks/useSos';
import { useNeighborhoodEmergency } from '@/hooks/useNeighborhoodEmergency';
import { AppNavIcon, type AppNavIconName } from '@/components/navigation/AppNavIcon';
import { LocalHuudBottomSheet } from '@/components/navigation/LocalHuudBottomSheet';
import { isLocalHuudPath } from '@/lib/localHuudLinks';

interface BottomNavProps {
  /**
   * When set, parent controls visibility (e.g. feed page).
   * When omitted, nav auto-hides on scroll down and shows on scroll up.
   */
  hidden?: boolean;
}

const TABS: { href: string; label: string; icon: AppNavIconName; match: (p: string) => boolean }[] = [
  { href: '/feed', label: 'Home', icon: 'home', match: (p) => p === '/feed' || p === '/' },
  { href: '/safety', label: 'Safety', icon: 'shield', match: (p) => p.startsWith('/safety') || p.startsWith('/sentinel') },
  { href: '/friendship', label: 'Connect', icon: 'connect', match: (p) => p.startsWith('/friendship') },
];

export function BottomNav({ hidden: hiddenProp }: BottomNavProps) {
  const pathname = usePathname();
  const scrollHidden = useScrollHideBottomNav(hiddenProp === undefined, pathname);
  const hidden = hiddenProp ?? scrollHidden;
  const router = useRouter();
  const sos = useSos();
  const hasNeighborhoodEmergency = useNeighborhoodEmergency();
  const [localHuudOpen, setLocalHuudOpen] = useState(false);

  useEffect(() => {
    setLocalHuudOpen(false);
  }, [pathname]);

  const isLocalHuud = isLocalHuudPath(pathname) || localHuudOpen;

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

  const [homeTab, safetyTab, connectTab] = TABS;
  const homeActive = homeTab.match(pathname);
  const safetyActive = safetyTab.match(pathname);
  const connectActive = connectTab.match(pathname);

  const renderTab = (
    tab: (typeof TABS)[number],
    active: boolean,
    edge = false,
  ) => (
    <Link
      key={tab.href}
      href={tab.href}
      className={`app-bottomnav__item${edge ? ' app-bottomnav__item--edge' : ''}${active ? ' app-bottomnav__item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={tab.label}
    >
      <span className="app-bottomnav__icon-wrap">
        <AppNavIcon name={tab.icon} active={active} />
      </span>
      <span className="app-bottomnav__label">{tab.label}</span>
    </Link>
  );

  return (
    <nav className="app-bottomnav" role="navigation" aria-label="Main navigation">
      <div className={`app-bottomnav__bar${hidden ? ' app-bottomnav__bar--hidden' : ''}`}>
        <div className="app-bottomnav__inner">
          {renderTab(homeTab, homeActive, true)}

          <div className="app-bottomnav__center">
            {renderTab(safetyTab, safetyActive)}
            <div className="app-bottomnav__sos-slot" aria-hidden />
            {renderTab(connectTab, connectActive)}
          </div>

          <button
            type="button"
            onClick={() => setLocalHuudOpen(true)}
            className={`app-bottomnav__item app-bottomnav__item--edge${isLocalHuud ? ' app-bottomnav__item--active' : ''}`}
            aria-expanded={localHuudOpen}
            aria-haspopup="dialog"
            aria-label="Local Huud — community services"
          >
            <span className="app-bottomnav__icon-wrap">
              <AppNavIcon name="localHuud" active={isLocalHuud} />
            </span>
            <span className="app-bottomnav__label">Huud</span>
          </button>
        </div>
      </div>

      <LocalHuudBottomSheet open={localHuudOpen} onClose={() => setLocalHuudOpen(false)} />

      <div className="app-bottomnav__sos">
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
    </nav>
  );
}
