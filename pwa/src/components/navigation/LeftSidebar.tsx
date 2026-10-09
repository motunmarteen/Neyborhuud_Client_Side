'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  Home,
  Compass,
  Users,
  Bookmark,
  ShieldAlert,
  ShoppingBag,
  Briefcase,
  Megaphone,
  Newspaper,
  Wallet,
  Settings,
  LifeBuoy,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { AnimatedNeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { resolveProfileDisplayName, getGuestUsername, getGuestDisplayName } from '@/lib/profileSnapHelpers';
import { resolveProfileAvatarInitial, resolveUserAvatarUrl } from '@/lib/userAvatar';
import { useSwipeBackDisabled } from '@/contexts/SwipeBackContext';

type LeftSidebarOrigin = 'page' | 'global';
type LeftSidebarMode = 'desktop' | 'mobile' | 'both';

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const NAV_MAIN: NavItem[] = [
  { icon: Home, label: 'Feed', href: '/feed' },
  { icon: Compass, label: 'My Huud', href: '/neighborhood' },
  { icon: Users, label: 'Communities', href: '/communities' },
  { icon: Bookmark, label: 'Saved Posts', href: '/saved' },
];

const NAV_DISCOVER: NavItem[] = [
  { icon: ShieldAlert, label: 'Sentinel Radar', href: '/safety', badge: 'LIVE', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: Briefcase, label: 'Gigs & Services', href: '/jobs' },
  { icon: Megaphone, label: 'FYI Bulletins', href: '/fyi' },
  { icon: Newspaper, label: 'Local News', href: '/local-news' },
];

const NAV_FINANCE: NavItem[] = [
  { icon: Wallet, label: 'Huud Economy', href: '/huud-economy' },
];

const NAV_BOTTOM: NavItem[] = [
  { icon: Settings, label: 'Settings & Privacy', href: '/settings' },
  { icon: LifeBuoy, label: 'Help Center', href: '/info/community-rules' },
];

function SidebarNavItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          active
            ? 'bg-emerald-50 text-[#008A20] font-bold shadow-xs'
            : 'text-[#374151] hover:bg-black/[0.04] hover:text-[#111827]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            size={18}
            strokeWidth={active ? 2.5 : 2}
            className={`shrink-0 transition-transform group-hover:scale-105 ${
              active ? 'text-[#008A20]' : 'text-[#6B7280] group-hover:text-[#111827]'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge && (
          <span
            className={`text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
              item.badgeColor || 'bg-black/5 text-[#111827]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function SidebarContent({
  onNavigate,
  onClose,
  isDrawer,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
  isDrawer?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const huudName = useHuudDisplayName(user);
  const { data: stats } = useMyGamificationStats();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const authUser = mounted ? user : null;
  const handle = (authUser?.username ?? getGuestUsername()).trim().toLowerCase();
  const resolvedAvatar = resolveUserAvatarUrl(authUser);
  const displayName = authUser ? resolveProfileDisplayName(authUser, handle) : getGuestDisplayName();
  const initial = resolveProfileAvatarInitial(authUser, handle);
  const huudCoins = stats?.totalHuudCoins ?? 150;

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate?.();
      router.push('/login');
    } catch {
      // silent
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. BRAND & CLOSE (Drawer only) */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link
          href="/feed"
          onClick={onNavigate}
          className="flex items-center gap-2 focus:outline-none"
        >
          <AnimatedNeyborHuudLogo tone="primary" />
        </Link>

        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 text-[#6B7280] hover:text-[#111827] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. RESIDENT PROFILE CARD */}
      <div suppressHydrationWarning className="px-3.5 py-2">
        <Link
          suppressHydrationWarning
          href={authUser ? `/profile/${authUser.username}` : '/settings'}
          onClick={onNavigate}
          className="group block p-3 rounded-2xl bg-white hover:bg-black/[0.02] border border-black/[0.08] shadow-xs transition-all"
        >
          <div className="flex items-center gap-3">
            <div suppressHydrationWarning className="relative w-10 h-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-sm font-black text-[#008A20] shrink-0 border border-emerald-300/40">
              {resolvedAvatar ? (
                <Image
                  src={resolvedAvatar}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span suppressHydrationWarning>{initial}</span>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00D431] ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span suppressHydrationWarning className="text-xs font-black text-[#111827] truncate">
                  {displayName}
                </span>
                <ShieldCheck size={13} className="text-[#008A20] shrink-0" />
              </div>
              <p suppressHydrationWarning className="text-[11px] font-semibold text-[#6B7280] truncate">
                @{handle}
              </p>
            </div>

            <ChevronRight
              size={14}
              className="text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </div>

          {/* Active Huud Badge & Balance */}
          <div className="mt-2.5 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
            <span suppressHydrationWarning className="inline-flex items-center gap-1 font-bold text-[#008A20]">
              <MapPin size={11} />
              <span suppressHydrationWarning className="truncate max-w-[110px]">
                {huudName !== 'your neighborhood' && huudName ? huudName : 'Lekki Phase 1'}
              </span>
            </span>

            <span suppressHydrationWarning className="font-extrabold text-[#111827] tabular-nums">
              {huudCoins} HC
            </span>
          </div>
        </Link>
      </div>

      {/* 3. SCROLLABLE NAVIGATION LIST */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-2 space-y-4 no-scrollbar">
        {/* Main Section */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
            Main
          </p>
          <ul className="space-y-0.5">
            {NAV_MAIN.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>

        {/* Discover & Services */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
            Services &amp; Safety
          </p>
          <ul className="space-y-0.5">
            {NAV_DISCOVER.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>

        {/* Economy */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
            Economy
          </p>
          <ul className="space-y-0.5">
            {NAV_FINANCE.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </nav>

      {/* 4. FOOTER UTILITIES */}
      <div className="p-3.5 border-t border-black/[0.08] bg-white">
        <ul className="space-y-0.5">
          {NAV_BOTTOM.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}

          {authUser && (
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut size={16} strokeWidth={2} className="shrink-0" />
                <span>Sign Out</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function LeftSidebar({
  origin = 'page',
  mode = 'desktop',
}: {
  origin?: LeftSidebarOrigin;
  mode?: LeftSidebarMode;
}) {
  return <LeftSidebarInner origin={origin} mode={mode} />;
}

function LeftSidebarInner({
  origin = 'page',
  mode = 'desktop',
}: {
  origin?: LeftSidebarOrigin;
  mode?: LeftSidebarMode;
}) {
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
      <span
        data-leftsidebar="1"
        data-leftsidebar-origin={origin}
        data-leftsidebar-mode={mode}
        className="hidden"
        aria-hidden
      />

      {/* DESKTOP FIXED SIDEBAR */}
      {enableDesktop ? (
        <aside className="hidden lg:flex flex-col w-[270px] h-screen sticky top-0 shrink-0 border-r border-black/[0.08] z-30 bg-white">
          <Suspense fallback={null}>
            <SidebarContent />
          </Suspense>
        </aside>
      ) : null}

      {/* MOBILE DRAWER */}
      {enableMobile && mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Drawer Slide */}
          <aside className="relative w-[280px] max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col">
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
