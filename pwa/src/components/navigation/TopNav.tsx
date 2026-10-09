'use client';

import { Suspense, useMemo, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  Plus,
  PlusSquare,
  PenSquare,
  Megaphone,
  ShieldAlert,
  BarChart2,
  Calendar,
  HandHeart,
  ShoppingBag,
  Gift,
  Bell,
  Sparkles,
} from 'lucide-react';

import { AnimatedNeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useScrollHideBottomNav, useIsScrolled } from '@/hooks/useScrollHideBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import { useMyGamificationStats } from '@/hooks/useGamification';

type TopNavOrigin = 'page' | 'global';

function titleCaseFromSegment(segment: string) {
  const normalized = segment.replace(/[-_]+/g, ' ').trim();
  if (!normalized) return '';
  return normalized
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const CREATE_MENU_OPTIONS = [
  {
    key: 'post',
    label: 'Post',
    subtitle: 'Share photos, news or thoughts',
    icon: PenSquare,
    color: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/15',
  },
  {
    key: 'fyi',
    label: 'FYI Alert',
    subtitle: 'Power, road, or utility notice',
    icon: Megaphone,
    color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15',
  },
  {
    key: 'emergency',
    label: 'Safety Report',
    subtitle: 'Urgent incident or hazard alert',
    icon: ShieldAlert,
    color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/15',
  },
  {
    key: 'poll',
    label: 'Community Poll',
    subtitle: 'Ask neighbors to vote on a decision',
    icon: BarChart2,
    color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15',
  },
  {
    key: 'event',
    label: 'Huud Event',
    subtitle: 'Plan a gathering, patrol or meeting',
    icon: Calendar,
    color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/15',
  },
  {
    key: 'help_request',
    label: 'Help Request',
    subtitle: 'Request a tool, ride or hand',
    icon: HandHeart,
    color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-500/15',
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    subtitle: 'Buy, sell or giveaway items',
    icon: ShoppingBag,
    color: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/15',
  },
];

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
    feed: 'Huud Feed',
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
    safety: 'Sentinel Radar',
    sentinel: 'Sentinel Radar',
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
    rewards: 'Rewards & Streaks',
  };

  if (map[segment]) return map[segment];
  return titleCaseFromSegment(segment) || 'NeyborHuud';
}

export default function TopNav({ origin = 'page' }: { origin?: TopNavOrigin }) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnFeed = pathname === '/feed' || pathname === '/';
  const title = useMemo(() => (pathname ? getRouteTitle(pathname) : 'Huud Feed'), [pathname]);
  const { data: unreadCount = 0 } = useUnreadCount(undefined, 'message');
  const { data: stats } = useMyGamificationStats();
  const scrollHidden = useScrollHideBottomNav();
  const { user } = useAuth();
  const huudName = useHuudDisplayName(user);

  const [mounted, setMounted] = useState(false);
  const [balanceUnit, setBalanceUnit] = useState<'ngn' | 'coins'>('ngn');

  useEffect(() => {
    setMounted(true);
  }, []);

  const huudCoins = stats?.totalHuudCoins ?? 150;
  const balanceDisplay =
    balanceUnit === 'ngn'
      ? `₦${(huudCoins * 25).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `${huudCoins} HC`;

  const openMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
  };

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!createMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [createMenuOpen]);

  const handleSelectCreateType = (contentType?: string) => {
    setCreateMenuOpen(false);
    window.dispatchEvent(
      new CustomEvent('open-create-post', {
        detail: { contentType },
      })
    );
  };

  return (
    <>
      <div
        className={`w-full sticky top-2 sm:top-3 z-40 transition-transform duration-200 px-2.5 sm:px-4 pointer-events-none ${
          scrollHidden ? '-translate-y-24' : 'translate-y-0'
        }`}
        data-topnav-host="1"
      >
        <header
          data-topnav="1"
          data-topnav-origin={origin}
          className="pointer-events-auto max-w-4xl mx-auto h-12 sm:h-13 pl-2 sm:pl-3.5 pr-2 sm:pr-3 rounded-full bg-white/92 backdrop-blur-2xl border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-1 sm:gap-3 select-none"
        >
          {/* ZONE 1 (LEFT): Menu + Brand / Location */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={openMobileSidebar}
              className="lg:hidden p-1 sm:p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu size={18} />
            </button>

            {/* Mobile Logo / Desktop Location Breadcrumb */}
            {isOnFeed ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link href="/feed" className="flex items-center focus:outline-none">
                  <AnimatedNeyborHuudLogo tone="primary" />
                </Link>

                <div suppressHydrationWarning className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.06] text-xs font-bold text-slate-900">
                  <MapPin size={12} className="text-[#008A20] shrink-0" />
                  <span suppressHydrationWarning className="truncate max-w-[130px] lg:max-w-[180px]">
                    {huudName !== 'your neighborhood' && huudName ? huudName : 'Lekki Phase 1'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D431] animate-pulse ml-0.5" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="p-1 rounded-full text-slate-900 hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <ChevronLeft size={19} />
                </button>
                <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-[120px] sm:max-w-xs">
                  {title}
                </h1>
              </div>
            )}
          </div>

          {/* ZONE 2 (CENTER): Rewards / HuudCoins Pill (Modeled after game balance capsule) */}
          <Link
            href="/rewards"
            className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] text-[11px] sm:text-xs font-bold text-slate-800 transition-all active:scale-95 group shadow-xs shrink-0 cursor-pointer"
            title="Huud Economy & Daily Rewards"
          >
            <Gift size={13} className="text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-extrabold text-[10px] sm:text-xs text-[#008A20]">{huudCoins} HC</span>
            <span className="hidden min-[360px]:inline-block w-1.5 h-1.5 rounded-full bg-[#00D431] animate-pulse" />
          </Link>

          {/* ZONE 3 (RIGHT): Search + Bell + Circular Green (+) Button + Avatar */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {/* Quick Search */}
            <button
              type="button"
              onClick={() => router.push('/explore')}
              className="p-1 sm:p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search size={16} />
            </button>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-1 sm:p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Vibrant Green Circular (+) Create Button with Facebook/Instagram Popover */}
            <div className="relative" ref={createMenuRef}>
              <button
                type="button"
                onClick={() => setCreateMenuOpen((prev) => !prev)}
                className={`size-7 sm:size-8 rounded-full bg-[#00D431] hover:bg-[#00FF3E] text-slate-950 font-black shadow-sm flex items-center justify-center transition-transform active:scale-90 cursor-pointer shrink-0 ${
                  createMenuOpen ? 'ring-2 ring-[#00D431]/40' : ''
                }`}
                aria-label="Create post or alert"
                aria-expanded={createMenuOpen}
                title="Create"
              >
                <Plus size={17} strokeWidth={2.8} />
              </button>

              {/* Popover Menu */}
              {createMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white/95 dark:bg-[#242526] text-slate-800 dark:text-[#E4E6EB] border border-black/[0.08] dark:border-[#3E4042] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.14)] dark:shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl select-none"
                  role="menu"
                >
                  <div className="px-3 py-1.5 mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/50 border-b border-black/[0.06] dark:border-white/10">
                    Create
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {CREATE_MENU_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSelectCreateType(item.key)}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] active:bg-slate-200 dark:active:bg-[#4E4F50] transition-colors text-left group cursor-pointer"
                          role="menuitem"
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${item.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-white/60 truncate leading-tight mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
