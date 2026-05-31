'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

import { SidebarProfileLockup } from './SidebarProfileLockup';
import { SidebarBuildingSilhouette } from './SidebarBuildingSilhouette';
import { SidebarSkyHeaderPanel } from './SidebarSkyHeader';
import { useSwipeBackDisabled } from '@/contexts/SwipeBackContext';

const mainNav = [
  { icon: 'location_on', label: 'My Huud', href: '/neighborhood' },
  { icon: 'groups', label: 'Communities', href: '/communities' },
  { icon: 'bookmark', label: 'Saved', href: '/saved' },
  { icon: 'local_fire_department', label: 'Fans out', href: '/popular' },
  { icon: 'newspaper', label: 'Local News', href: '/local-news' },
  { icon: 'military_tech', label: 'My Huud Score', href: '/gamification' },
];

const browseTypes = [
  { icon: 'campaign', label: 'FYI Bulletins', type: 'fyi', href: '/fyi' },
  { icon: 'help', label: 'Help Requests', type: 'help_request', href: '/help-request' },
  { icon: 'work', label: 'Jobs', type: 'job', href: '/jobs' },
  { icon: 'event', label: 'Events', type: 'event', href: '/events' },
  { icon: 'shopping_bag', label: 'Marketplace', type: 'marketplace', href: '/marketplace' },
  { icon: 'handyman', label: 'Services', type: 'services', href: '/services' },
  { icon: 'report', label: 'Incident Reports', type: 'incident', href: '/incident-reports' },
  { icon: 'add_alert', label: 'Community Alerts', type: 'emergency', href: '/community-emergency' },
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const activeType = pathname === '/feed' ? searchParams.get('type') : null;

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
            <NeyborHuudLogo layout="wordmark" size={isDrawer ? 'sm' : 'md'} tone="primary" />
          </Link>
          <Link
            href="/safety"
            onClick={onNavigate}
            className={`left-sidebar__sentinel-btn${isActive('/safety') ? ' left-sidebar__sentinel-btn--active' : ''}`}
            aria-label="Sentinel AI"
          >
            <span className={`material-symbols-outlined${isActive('/safety') ? ' fill-1' : ''}`}>shield</span>
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

        <section className="left-sidebar__section">
          <div className="left-sidebar__explore-grid">
            {browseTypes.map((item) => {
              const active = item.href ? pathname?.startsWith(item.href) : activeType === item.type;
              return (
                <Link
                  key={item.type}
                  href={item.href || `/feed?type=${item.type}`}
                  onClick={onNavigate}
                  className={`left-sidebar__explore-link${active ? ' left-sidebar__explore-link--active' : ''}`}
                >
                  <span className="left-sidebar__explore-icon">
                    <span className={`material-symbols-outlined${active ? ' fill-1' : ''}`}>{item.icon}</span>
                  </span>
                  <span className="left-sidebar__explore-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

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
