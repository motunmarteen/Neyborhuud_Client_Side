'use client';

import { Suspense, useMemo, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Settings } from 'lucide-react';

import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { AppNavIcon } from '@/components/navigation/AppNavIcon';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useScrollHideBottomNav, useIsScrolled, scrollToTop } from '@/hooks/useScrollHideBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { PostCardMenuIcon } from '@/components/feed/PostCardMenuIcon';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveProfileDisplayName } from '@/lib/profileSnapHelpers';
import { resolveProfileAvatarInitial, resolveUserAvatarUrl } from '@/lib/userAvatar';

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
    return 'HuudGist';
  }

  const map: Record<string, string> = {
    friendship: 'Connections',
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
    gossip: 'HuudGist',
    gist: 'HuudGist',
    messages: 'Messages',
    chat: 'Chat',
    info: 'Info',
    sos: 'Safety Alert',
    profile: 'Profile',
    gamification: 'Huud Economy',
    'huud-economy': 'Huud Economy',
  };

  if (map[segment]) return map[segment];
  return titleCaseFromSegment(segment) || 'NeyborHuud';
}

export default function TopNav({ origin = 'page' }: { origin?: TopNavOrigin }) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnFeed = pathname === '/feed' || pathname === '/';
  const title = useMemo(() => (pathname ? getRouteTitle(pathname) : 'NeyborHuud'), [pathname]);
  const { data: unreadCount = 0 } = useUnreadCount(undefined, 'message');
  const scrollHidden = useScrollHideBottomNav();
  const isScrolled = useIsScrolled(60);
  const { user, logout } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const profileHref = mounted && user?.username ? `/profile/${user.username}` : '/settings';

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const handle = (user?.username ?? 'neybor').trim().toLowerCase();
  const resolvedAvatar = resolveUserAvatarUrl(user);
  const displayName = resolveProfileDisplayName(user, handle);
  const initial = resolveProfileAvatarInitial(user, handle);

  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      try {
        await logout();
      } catch (error) {
        console.warn('Backend logout failed, but clearing local session:', error);
        localStorage.removeItem('neyborhuud_token');
        localStorage.removeItem('neyborhuud_user');
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('neyborhuud_token');
      localStorage.removeItem('neyborhuud_user');
      router.push('/login');
    }
  };

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


      {isOnFeed ? (
        <div className="relative flex items-center min-w-0 pl-3 md:pl-4 gap-1" ref={dropdownContainerRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer focus:outline-none select-none transition-colors -ml-2 ${skyOverlay ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10 text-brand-black dark:text-white'}`}
            aria-expanded={showDropdown}
            aria-haspopup="true"
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
              <span className={`absolute left-0 w-5 h-[2px] bg-current rounded-full transition-all duration-300 origin-center ${showDropdown ? 'rotate-45 top-[7px]' : 'top-0'}`} />
              <span className={`absolute left-0 w-5 h-[2px] bg-current rounded-full transition-all duration-300 ${showDropdown ? 'opacity-0 scale-0' : 'top-[7px]'}`} />
              <span className={`absolute left-0 w-5 h-[2px] bg-current rounded-full transition-all duration-300 origin-center ${showDropdown ? '-rotate-45 top-[7px]' : 'top-[14px]'}`} />
            </div>
          </button>
          <div className="flex-shrink-0 cursor-pointer select-none" onClick={() => router.push('/feed')}>
            <NeyborHuudLogo layout="wordmark" size="chrome" tone={skyOverlay ? 'light' : 'primary'} />
          </div>
          
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-[90] bg-transparent"
                onClick={() => setShowDropdown(false)}
                onTouchStart={() => setShowDropdown(false)}
              />
              <div
                className="fixed top-[72px] inset-x-1.5 mx-auto max-w-[400px] z-[100] overflow-hidden rounded-none border border-black/5 bg-white dark:bg-[#1c221e] p-3 shadow-[0_30px_60px_rgba(0,0,0,0.2)] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200"
              >
              <div className="mb-2 flex items-center justify-between px-2">
                {user ? (
                  <Link
                    href={profileHref}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                  >
                    {/* Custom Clipped Map Pin */}
                    <div className="relative h-[72px] w-[58px] shrink-0 group-hover:scale-105 transition-transform">
                      <svg 
                        viewBox="0 0 40 50" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0 h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
                      >
                        <defs>
                          <clipPath id="pin-clip">
                            <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.954 31.046 0 20 0Z" />
                          </clipPath>
                        </defs>
                        
                        <foreignObject x="0" y="0" width="40" height="50" clipPath="url(#pin-clip)">
                          <div className="h-full w-full bg-gray-100 dark:bg-gray-800">
                            {resolvedAvatar ? (
                              <img
                                src={resolvedAvatar}
                                alt={displayName}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-[40px] w-full items-center justify-center text-[18px] font-semibold text-gray-500">
                                {initial}
                              </div>
                            )}
                          </div>
                        </foreignObject>

                        {/* Thin crisp border around the pin */}
                        <path 
                          d="M20 1C9.507 1 1 9.507 1 20C1 34.256 19.06 48.163 20 48.914C20.94 48.163 39 34.256 39 20C39 9.507 30.493 1 20 1Z" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className="text-white dark:text-black/10"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[160px]">
                      <span className="font-semibold text-[15px] text-brand-black dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{handle}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="w-10"></div>
                )}

                <Link
                  href="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center justify-center text-brand-black dark:text-white hover:opacity-80 transition-opacity shrink-0"
                  aria-label="Settings"
                >
                  <Settings 
                    className="h-[30px] w-[30px]" 
                    strokeWidth={1.5}
                    style={{ animation: 'spin 12s linear infinite' }}
                  />
                </Link>
              </div>
              
              {/* Inner Gray Container for Grid Menu */}
              <div className="bg-[#f5f7f5] dark:bg-[#141a16] rounded-none py-3 px-4 mb-0 -mx-3">
                <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                  <Link
                    href="/marketplace"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#007AFF]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>shopping_bag</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">Marketplace</span>
                  </Link>

                  <Link
                    href="/jobs"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#FF9500]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>work</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">Work</span>
                  </Link>

                  <Link
                    href="/events"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#AF52DE]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>local_activity</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">Events</span>
                  </Link>

                  <Link
                    href="/fyi"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#FFCC00]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>campaign</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">FYI Bulletin</span>
                  </Link>

                  <Link
                    href="/help-request"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#34C759]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>volunteer_activism</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">Help Request</span>
                  </Link>

                  <Link
                    href="/sos"
                    onClick={() => setShowDropdown(false)}
                    className="flex flex-col items-center gap-1 group transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[#FF3B30]" style={{ fontSize: '38px', fontVariationSettings: "'wght' 300" }}>gpp_maybe</span>
                    <span className="text-[13px] font-semibold text-brand-black dark:text-white tracking-wide whitespace-nowrap">Safety Alert</span>
                  </Link>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 flex items-center justify-between px-1">
                <Link
                  href="/help-center"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-[14px] font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'wght' 300" }} aria-hidden="true">support_agent</span>
                  <span>Help Center</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-[14px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <span>Logout</span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'wght' 300" }} aria-hidden="true">logout</span>
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 items-center min-w-0 pl-6">
          <h1 className="app-topnav__title truncate">{title}</h1>
        </div>
      )}

      <div className="flex-1" />

      <div className="app-topnav__actions pr-6">
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
      </div>
    </header>
    </div>
    </>
  );
}
