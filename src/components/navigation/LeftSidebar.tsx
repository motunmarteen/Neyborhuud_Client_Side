'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollowers, useFollowing } from '@/hooks/useFollow';
import { getStoredCommunity } from '@/lib/communityContext';
import AmbientProfileCard from './AmbientProfileCard';

const quickActions = [
  { icon: 'sos', label: 'SOS', href: '/safety', accent: '#ef4444' },
  { icon: 'shield', label: 'Sentinel AI', href: '/sentinel', accent: '#8b5cf6' },
];

const mainNav = [
  { icon: 'location_on', label: 'My Huud', href: '/neighborhood' },
  { icon: 'groups', label: 'Groups', href: '/groups' },
  { icon: 'bookmark', label: 'Saved', href: '/saved' },
  { icon: 'local_fire_department', label: 'Popular Nearby', href: '/popular' },
];

const browseTypes = [
  { icon: 'campaign', label: 'FYI Bulletins', type: 'fyi' },
  { icon: 'forum', label: 'Gossip', type: 'gossip' },
  { icon: 'help', label: 'Help Requests', type: 'help_request' },
  { icon: 'work', label: 'Jobs', type: 'job' },
  { icon: 'event', label: 'Events', type: 'event' },
  { icon: 'shopping_bag', label: 'Marketplace', type: 'marketplace' },
];



function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const activeType = pathname === '/feed' ? searchParams.get('type') : null;

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    return pathname?.startsWith(href);
  };

  const userDisplayName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username
    : 'User';
  const userInitial = userDisplayName[0]?.toUpperCase() || 'U';
  const community = getStoredCommunity();
  const userLocation = user?.location?.lga
    || user?.location?.state
    || user?.location?.neighborhood
    || (community?.lga && community?.state ? `${community.lga}, ${community.state}` : community?.lga || community?.state || community?.communityName || community?.name)
    || '';

  const { data: followersData } = useFollowers(user?.id, 1, 1);
  const { data: followingData } = useFollowing(user?.id, 1, 1);
  const followerCount = (followersData as any)?.data?.pagination?.total ?? 0;
  const followingCount = (followingData as any)?.data?.pagination?.total ?? 0;

  const userLat = user?.location?.latitude;
  const userLng = user?.location?.longitude;

  return (
    <div className="flex flex-col h-full">
      {/* Ambient Profile Card — full width, edge-to-edge */}
      <div className="md:hidden">
        <AmbientProfileCard
          avatarUrl={user?.avatarUrl}
          displayName={userDisplayName}
          initial={userInitial}
          username={user?.username || 'user'}
          location={userLocation}
          followerCount={followerCount}
          followingCount={followingCount}
          lat={userLat}
          lng={userLng}
          profileHref={user ? `/profile/${user.username}` : '/settings'}
          onNavigate={onNavigate}
        />
      </div>

      <div className="px-3 pt-4 pb-3 flex flex-col gap-1 flex-1 overflow-y-auto">

      {/* Quick Actions — prominent pill buttons */}
      <div className="flex gap-2 mb-2 px-1">
        {quickActions.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-1 justify-center ${
                active
                  ? 'text-white shadow-sm'
                  : 'bg-black/[0.04] hover:bg-black/[0.07]'
              }`}
              style={active
                ? { background: item.accent, color: '#fff' }
                : { color: item.accent }
              }
            >
              <span className="material-symbols-outlined text-base" style={{ fontSize: '18px' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                active
                  ? 'bg-primary/[0.08] text-primary'
                  : 'hover:bg-black/[0.04]'
              }`}
              style={!active ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''} transition-colors`} style={{ fontSize: '22px' }}>
                {item.icon}
              </span>
              <p className={`text-sm ${active ? 'font-bold' : 'font-medium'} leading-normal`}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Divider + Section label */}
      <div className="mt-2 mb-1 px-3">
        <div className="border-t border-black/[0.06]" />
        <p className="text-[10px] font-semibold uppercase tracking-widest mt-2.5" style={{ color: 'var(--neu-text-muted)', opacity: 0.6 }}>
          Browse Feed
        </p>
      </div>

      {/* Feed Filters — compact grid */}
      <div className="grid grid-cols-2 gap-1.5 px-1">
        {browseTypes.map((item) => {
          const active = activeType === item.type;
          return (
            <Link
              key={item.type}
              href={`/feed?type=${item.type}`}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                active
                  ? 'bg-primary/[0.08] text-primary'
                  : 'hover:bg-black/[0.04] bg-black/[0.02]'
              }`}
              style={!active ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''} transition-colors`} style={{ fontSize: '18px' }}>
                {item.icon}
              </span>
              <p className={`text-xs ${active ? 'font-bold' : 'font-medium'} leading-normal truncate`}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Mobile-only: Settings at bottom */}
      <div className="md:hidden mt-auto pt-3 border-t border-black/[0.06]">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] cursor-pointer transition-all"
          style={{ color: 'var(--neu-text)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
          <p className="text-sm font-medium leading-normal">Settings & Privacy</p>
        </Link>
      </div>
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for toggle event from TopNav hamburger
  useEffect(() => {
    const handleToggle = () => setMobileOpen(true);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  // Prevent body scroll when mobile drawer is open
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
      {/* Desktop sidebar – hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col bg-white overflow-y-auto shrink-0 border-r border-black/[0.06]">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-white overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col" style={{ boxShadow: '8px 0 24px rgba(0,0,0,0.08)' }}>
            <SidebarContent onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
