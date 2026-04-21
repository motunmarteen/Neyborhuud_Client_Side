'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { getStoredCommunity } from '@/lib/communityContext';
import AmbientProfileCard from './AmbientProfileCard';

const quickActions = [
  { icon: 'sos', label: 'SOS', href: '/safety', accent: '#ef4444' },
  { icon: 'shield', label: 'Sentinel AI', href: '/sentinel', accent: '#8b5cf6' },
];

const mainNav = [
  { icon: 'location_on', label: 'My Huud', href: '/neighborhood' },
  { icon: 'groups', label: 'Communities', href: '/communities' },
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

  // Backend may return location as nested object OR as flat fields (lga, state, etc.)
  const u = user as any;
  const community = getStoredCommunity();

  const [userLocation, setUserLocation] = useState('');
  useEffect(() => {
    const loc = user?.location?.lga
      || u?.lga
      || user?.location?.state
      || u?.state
      || user?.location?.neighborhood
      || u?.neighborhood
      || (community?.lga && community?.state ? `${community.lga}, ${community.state}` : community?.lga || community?.state || community?.communityName || community?.name)
      || '';
    setUserLocation(loc);
  }, [user, u?.lga, u?.state, u?.neighborhood]);

  // Try user's lat/lng first, then fall back to community LGA centroid
  const [fallbackCoords, setFallbackCoords] = useState<{ lat: number; lng: number } | null>(null);
  const resolvedLga = user?.location?.lga || u?.lga || community?.lga || '';
  const resolvedState = user?.location?.state || u?.state || community?.state || '';
  const resolvedLat = user?.location?.latitude || u?.latitude;
  const resolvedLng = user?.location?.longitude || u?.longitude;

  useEffect(() => {
    // If user already has coordinates, no need for fallback
    if (resolvedLat && resolvedLng) return;

    // Try to get LGA centroid from backend geo API
    if (resolvedLga && resolvedState) {
      import('@/lib/api-client').then(({ default: apiClient }) => {
        apiClient.get(`/geo/lga-centroid?lga=${encodeURIComponent(resolvedLga)}&state=${encodeURIComponent(resolvedState)}`)
          .then((res: any) => {
            if (res?.data?.latitude && res?.data?.longitude) {
              setFallbackCoords({ lat: res.data.latitude, lng: res.data.longitude });
            }
          })
          .catch(() => {});
      });
    }
  }, [resolvedLat, resolvedLng, resolvedLga, resolvedState]);

  const userLat = resolvedLat || fallbackCoords?.lat;
  const userLng = resolvedLng || fallbackCoords?.lng;

  // Debug: log what coordinates we're passing
  useEffect(() => {
    console.log('🗺️ Sidebar map coords:', {
      userLat, userLng,
      fromUser: { lat: resolvedLat, lng: resolvedLng },
      fallback: fallbackCoords,
      location: user?.location,
      flatFields: { lga: u?.lga, state: u?.state },
      userId: user?.id,
      fullUser: user,
    });
  }, [userLat, userLng, resolvedLat, resolvedLng, user?.location, fallbackCoords, u?.lga, u?.state, user?.id, user]);

  return (
    <div className="flex flex-col h-full">
      {/* Ambient Profile Card — full width, edge-to-edge */}
      {/* Ambient Profile Card — full width, edge-to-edge */}
      <div>
        <AmbientProfileCard
          avatarUrl={user?.avatarUrl}
          displayName={userDisplayName}
          initial={userInitial}
          username={user?.username || 'user'}
          location={userLocation}
          lat={userLat}
          lng={userLng}
          profileHref={user ? `/profile/${user.username}` : '/settings'}
          onNavigate={onNavigate}
          userId={user?.id}
        />
      </div>

      <div className="px-3 pt-3 pb-3 flex flex-col gap-0.5 flex-1 min-h-0">

      {/* Quick Actions — SOS + Sentinel AI */}
      <div className="flex gap-2 mb-3">
        {quickActions.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full text-[12px] font-bold transition-all flex-1 justify-center whitespace-nowrap ${
                active
                  ? 'text-white shadow-md'
                  : 'hover:opacity-80'
              }`}
              style={active
                ? { background: item.accent, color: '#fff', boxShadow: `0 4px 16px ${item.accent}55` }
                : { color: item.accent, background: `${item.accent}14` }
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-0">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                active
                  ? 'bg-primary/[0.08] text-primary'
                  : 'hover:bg-black/[0.04]'
              }`}
              style={!active ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''} transition-colors`} style={{ fontSize: '20px' }}>
                {item.icon}
              </span>
              <p className={`text-[13px] ${active ? 'font-bold' : 'font-medium'} leading-normal tracking-tight`}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Divider + Section label */}
      <div className="mt-2 mb-0">
        <div className="border-t border-black/[0.06]" />
        <p className="text-[10px] font-bold uppercase mt-2 mb-1 px-1" style={{ color: 'var(--neu-text-muted)', opacity: 0.55, letterSpacing: '0.14em' }}>
          Browse Feed
        </p>
      </div>

      {/* Feed Filters — 2-col grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {browseTypes.map((item) => {
          const active = activeType === item.type;
          return (
            <Link
              key={item.type}
              href={`/feed?type=${item.type}`}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                active
                  ? 'bg-primary/[0.08] text-primary'
                  : 'hover:bg-black/[0.05] bg-black/[0.025]'
              }`}
              style={!active ? { color: 'var(--neu-text)' } : undefined}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''} transition-colors shrink-0`} style={{ fontSize: '16px' }}>
                {item.icon}
              </span>
              <p className={`text-[11px] ${active ? 'font-bold' : 'font-medium'} leading-snug`}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Mobile-only: Settings at bottom */}
      <div className="md:hidden mt-auto pt-4 border-t border-black/[0.06]">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-black/[0.04] cursor-pointer transition-all"
          style={{ color: 'var(--neu-text)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
          <p className="text-[14.5px] font-medium leading-normal tracking-tight">Settings &amp; Privacy</p>
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
      <aside className="hidden md:flex w-64 flex-col overflow-hidden shrink-0 border-r border-black/[0.06]" style={{ backgroundColor: '#FFFFFF', backgroundImage: "url('/doodle-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '500px 500px' }}>
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
          <aside className="absolute top-0 left-0 bottom-0 w-72 overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col" style={{ boxShadow: '8px 0 24px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', backgroundImage: "url('/doodle-pattern.svg')", backgroundRepeat: 'repeat', backgroundSize: '500px 500px' }}>
            <SidebarContent onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
