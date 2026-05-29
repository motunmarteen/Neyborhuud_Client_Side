'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

import { SidebarProfileLockup } from './SidebarProfileLockup';
import { SidebarFxWidget } from './SidebarFxWidget';
import { SidebarBuildingSilhouette } from './SidebarBuildingSilhouette';
import { SidebarSkyHeaderPanel } from './SidebarSkyHeader';
import { useSwipeBackDisabled } from '@/contexts/SwipeBackContext';

const mainNav = [
  { icon: 'location_on', label: 'My Huud', href: '/neighborhood' },
  { icon: 'groups', label: 'Communities', href: '/communities' },
  { icon: 'bookmark', label: 'Saved', href: '/saved' },
  { icon: 'local_fire_department', label: 'Popular Nearby', href: '/popular' },
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
          {isDrawer && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="left-sidebar__sky-close"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : null}
        </div>

        <SidebarProfileLockup
          variant="sky"
          user={authUser}
          profileHref={authUser ? `/profile/${authUser.username}` : '/settings'}
          onNavigate={onNavigate}
        />

        <SidebarFxWidget variant="sky" />
      </SidebarSkyHeaderPanel>

      <div className="left-sidebar__main">
        <section className="left-sidebar__section">
          <h2 className="left-sidebar__section-label">Navigation</h2>
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
          <h2 className="left-sidebar__section-label">Explore</h2>
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
      </div>

      <div className="left-sidebar__footer">
        <div className="left-sidebar__footer-settings">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={`left-sidebar__link${isActive('/settings') ? ' left-sidebar__link--active' : ''}`}
          >
            <span className="left-sidebar__link-icon">
              <span className={`material-symbols-outlined${isActive('/settings') ? ' fill-1' : ''}`}>settings</span>
            </span>
            <span className="left-sidebar__link-label">Settings &amp; Privacy</span>
          </Link>
        </div>
        <SidebarBuildingSilhouette />
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useSwipeBackDisabled(mobileOpen, 'mobile-sidebar');

  useEffect(() => {
    const handleToggle = () => setMobileOpen(true);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <aside className="left-sidebar left-sidebar--desktop">
        <div className="left-sidebar__scrim" aria-hidden />
        <Suspense fallback={null}>
          <SidebarContent />
        </Suspense>
      </aside>

      {mobileOpen ? (
        <div className="left-sidebar-overlay">
          <div className="left-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="left-sidebar left-sidebar--drawer">
            <div className="left-sidebar__scrim" aria-hidden />
            <Suspense fallback={null}>
              <SidebarContent
                isDrawer
                onNavigate={() => setMobileOpen(false)}
                onClose={() => setMobileOpen(false)}
              />
            </Suspense>
          </aside>
        </div>
      ) : null}
    </>
  );
}
