'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { AppNavIcon } from '@/components/navigation/AppNavIcon';

import { SidebarProfileLockup } from './SidebarProfileLockup';
import { SidebarBuildingSilhouette } from './SidebarBuildingSilhouette';
import { SidebarSkyHeaderPanel } from './SidebarSkyHeader';
import { LocalHuudMenu } from './LocalHuudMenu';
import { useSwipeBackDisabled } from '@/contexts/SwipeBackContext';

const mainNav = [
  { icon: 'location_on', label: 'My Huud', href: '/neighborhood' },
  { icon: 'groups', label: 'Communities', href: '/communities' },
  { icon: 'bookmark', label: 'Saved', href: '/saved' },
  { icon: 'newspaper', label: 'Local News', href: '/local-news' },
  { icon: 'military_tech', label: 'My Huud Score', href: '/gamification' },
];

type LeftSidebarOrigin = 'page' | 'global';
type LeftSidebarMode = 'desktop' | 'mobile' | 'both';

function SidebarLink({
  href,
  icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li className="left-sidebar__nav-item">
      <Link
        href={href}
        onClick={onNavigate}
        className={`left-sidebar__link${active ? ' left-sidebar__link--active' : ''}`}
      >
        <span className="left-sidebar__link-icon">
          <span className={`material-symbols-outlined${active ? ' fill-1' : ''}`}>{icon}</span>
        </span>
        <span className="left-sidebar__link-label">{label}</span>
      </Link>
    </li>
  );
}

function SidebarContent({ onNavigate, onClose, isDrawer }: { onNavigate?: () => void; onClose?: () => void; isDrawer?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const authUser = mounted ? user : null;

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="left-sidebar__body">
      <SidebarSkyHeaderPanel isDrawer={isDrawer}>
        <div className="left-sidebar__header-top">
          <Link href="/feed" onClick={onNavigate} className="left-sidebar__header-logo">
            <NeyborHuudLogo layout="wordmark" size="chrome" tone="primary" />
          </Link>
          <Link
            href="/safety"
            onClick={onNavigate}
            className={`left-sidebar__sentinel-btn${isActive('/safety') ? ' left-sidebar__sentinel-btn--active' : ''}`}
            aria-label="Sentinel AI"
          >
            <AppNavIcon name="shield" active={isActive('/safety')} />
          </Link>
        </div>

        <SidebarProfileLockup
          variant="sky"
          user={authUser}
          profileHref={authUser ? `/profile/${authUser.username}` : '/settings'}
          onNavigate={onNavigate}
        />
      </SidebarSkyHeaderPanel>

      <div className="left-sidebar__main">
        <section className="left-sidebar__section">
          <ul className="left-sidebar__nav">
            {mainNav.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>

        <LocalHuudMenu variant="sidebar" onNavigate={onNavigate} />

        <section className="left-sidebar__section">
          <ul className="left-sidebar__nav">
            <SidebarLink
              href="/settings"
              icon="settings"
              label="Settings &amp; Privacy"
              active={isActive('/settings')}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/help-center"
              icon="support"
              label="Help Center"
              active={isActive('/help-center')}
              onNavigate={onNavigate}
            />
          </ul>
        </section>
      </div>

      <div className="left-sidebar__footer">
        <SidebarBuildingSilhouette />
      </div>
    </div>
  );
}

export default function LeftSidebar({ origin = 'page', mode = 'desktop' }: { origin?: LeftSidebarOrigin; mode?: LeftSidebarMode }) {
  return <LeftSidebarInner origin={origin} mode={mode} />;
}

function LeftSidebarInner({ origin = 'page', mode = 'desktop' }: { origin?: LeftSidebarOrigin; mode?: LeftSidebarMode }) {
  const enableMobile = mode === 'mobile' || mode === 'both';
  const enableDesktop = mode === 'desktop' || mode === 'both';

  const [mobileOpen, setMobileOpen] = useState(false);

  useSwipeBackDisabled(enableMobile && mobileOpen, 'mobile-sidebar');

  useEffect(() => {
    if (!enableMobile) return;
    const handleToggle = () => setMobileOpen(true);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, [enableMobile]);

  useEffect(() => {
    if (!enableMobile) return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [enableMobile, mobileOpen]);

  return (
    <>
      {/* Invisible marker so global auto-drawer can detect a page sidebar */}
      <span
        data-leftsidebar="1"
        data-leftsidebar-origin={origin}
        data-leftsidebar-mode={mode}
        className="hidden"
        aria-hidden
      />

      {enableDesktop ? (
        <aside className="left-sidebar left-sidebar--desktop">
          <div className="left-sidebar__scrim" aria-hidden />
          <Suspense fallback={null}>
            <SidebarContent />
          </Suspense>
        </aside>
      ) : null}

      {enableMobile && mobileOpen ? (
        <div className="left-sidebar-overlay">
          <div className="left-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="left-sidebar left-sidebar--drawer">
            <div className="left-sidebar__scrim" aria-hidden />
            <Suspense fallback={null}>
              <SidebarContent isDrawer onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
            </Suspense>
          </aside>
        </div>
      ) : null}
    </>
  );
}
