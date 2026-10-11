'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  Bell,
} from 'lucide-react';

import { AnimatedNeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useScrollHideBottomNav } from '@/hooks/useScrollHideBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName, HUUD_NAME_FALLBACK } from '@/hooks/useHuudDisplayName';
import { useMyGamificationStats } from '@/hooks/useGamification';

type TopNavOrigin = 'page' | 'global';

/*
 * Design foundation F-06: floating top bar (matches the home mockup).
 *
 *   [ NeyborHuud      ]          [🪙 120] [🔍] [🔔•] [T]
 *   [ ● Somolu        ]
 *
 * Home: logo + your area. Other pages: back arrow + page title.
 * Right: HuudCredit balance (only once it has loaded — never a made-up number),
 * notifications, create, and your avatar, which opens the "Me" menu.
 * Visitors (not signed in) see "Join free" instead.
 *
 * Create (➕) lives in the bottom bar (F-07). 🔍 opens Search / Ask Sentinel (SSAA).
 */

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

  if ((segment === 'gamification' || segment === 'huud-economy') && parts[1] === 'wallet') return 'Huud Wallet';
  if (segment === 'huud-economy' && parts[1] === 'score') return 'Huud Score';
  if (segment === 'huud-economy') return 'Huud Economy';
  if (segment === 'local-news' && parts[1] === 'gist') return 'HuudGist';

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

const ICON_BTN =
  'tap-target relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F3F5F9] text-navy ' +
  'transition-colors hover:bg-[#E6EAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export type TopBarProps = {
  isHome: boolean;
  title: string;
  /** Your area, e.g. "Somolu"; null hides the line. */
  area: string | null;
  signedIn: boolean;
  /** HuudCredit balance; null while loading (shows a placeholder, never a guess). */
  credit: number | null;
  unreadCount: number;
  initial: string;
  avatarUrl: string | null;
  scrollHidden?: boolean;
  origin?: TopNavOrigin;
  onBack: () => void;
  onSearch: () => void;
  onMe: () => void;
};

/** The bar itself, driven only by props (also shown on /design-kit with sample data). */
export function TopBar({
  isHome,
  title,
  area,
  signedIn,
  credit,
  unreadCount,
  initial,
  avatarUrl,
  scrollHidden = false,
  origin = 'page',
  onBack,
  onSearch,
  onMe,
}: TopBarProps) {
  return (
    <div
      className={`pointer-events-none sticky top-2 z-40 w-full px-3 transition-transform duration-200 motion-reduce:transition-none sm:top-3 sm:px-4 ${
        scrollHidden ? '-translate-y-24' : 'translate-y-0'
      }`}
      data-topnav-host="1"
    >
      <header
        data-topnav="1"
        data-topnav-origin={origin}
        className="pointer-events-auto mx-auto flex h-[52px] max-w-4xl select-none items-center justify-between gap-2 rounded-full bg-white/[0.97] pl-3.5 pr-2 min-[380px]:pl-4 shadow-[0_6px_18px_rgba(29,36,51,0.16)]"
      >
        {/* Left: logo + area on home, back + title elsewhere */}
        {isHome ? (
          <Link href="/feed" className="flex min-w-0 shrink-0 flex-col justify-center leading-none focus:outline-none" aria-label="NeyborHuud home">
            <AnimatedNeyborHuudLogo tone="primary" />
            {area ? (
              <span suppressHydrationWarning className="mt-0.5 inline-flex min-w-0 items-center gap-1 text-[11.5px] font-extrabold text-brand-green-dark">
                <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="truncate">{area}</span>
              </span>
            ) : null}
          </Link>
        ) : (
          <div className="-ml-2 flex min-w-0 items-center gap-1">
            <button type="button" onClick={onBack} className={`${ICON_BTN} bg-transparent`} aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <h1 className="truncate font-heading text-base font-extrabold text-navy">{title}</h1>
          </div>
        )}

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1 min-[380px]:gap-1.5">
          {!signedIn ? (
            <Link
              href="/signup"
              className="tap-target inline-flex h-[38px] items-center rounded-full bg-primary px-4 text-[13px] font-extrabold text-white"
            >
              Join free
            </Link>
          ) : (
            <>
              {credit !== null ? (
                <Link
                  href="/rewards"
                  className="tap-target hidden h-[34px] items-center gap-1 rounded-full bg-[#FFF6E0] min-[350px]:inline-flex px-2.5 text-xs font-extrabold text-amber-ink transition-colors hover:bg-amber-soft"
                  aria-label={`${credit.toLocaleString('en-NG')} HuudCredit. Open rewards`}
                >
                  <span aria-hidden>🪙</span>
                  {credit.toLocaleString('en-NG')}
                </Link>
              ) : (
                <span className="hidden h-[34px] w-14 animate-pulse rounded-full bg-[#F3F5F9] motion-reduce:animate-none min-[350px]:block" aria-hidden />
              )}

              <button type="button" onClick={onSearch} className={ICON_BTN} aria-label="Search or ask Sentinel">
                <Search size={17} />
              </button>

              <Link
                href="/notifications"
                className={ICON_BTN}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications'}
              >
                <Bell size={17} />
                {unreadCount > 0 ? (
                  <span className="absolute right-[7px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-brand-red" aria-hidden />
                ) : null}
              </Link>

              <button
                type="button"
                onClick={onMe}
                className="tap-target grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-heading text-base font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Me: profile, HuudCredit, settings and more"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{initial}</span>
                )}
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}


export default function TopNav({ origin = 'page' }: { origin?: TopNavOrigin }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = useMemo(() => (pathname ? getRouteTitle(pathname) : 'Huud Feed'), [pathname]);
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount(undefined, 'message');
  const { data: stats } = useMyGamificationStats();
  const scrollHidden = useScrollHideBottomNav();
  const huudName = useHuudDisplayName(user);

  const me = user as {
    firstName?: string | null;
    name?: string;
    username?: string;
    avatarUrl?: string | null;
    profilePicture?: string | null;
  } | null;
  const displayName = me?.firstName || me?.name || me?.username || '';

  return (
    <TopBar
      isHome={pathname === '/feed' || pathname === '/'}
      title={title}
      area={huudName && huudName !== HUUD_NAME_FALLBACK ? huudName : null}
      signedIn={Boolean(user)}
      credit={typeof stats?.totalHuudCoins === 'number' ? stats.totalHuudCoins : null}
      unreadCount={unreadCount}
      initial={displayName.trim().charAt(0).toUpperCase() || '🙂'}
      avatarUrl={me?.avatarUrl || me?.profilePicture || null}
      scrollHidden={scrollHidden}
      origin={origin}
      onBack={() => router.back()}
      onSearch={() => router.push('/explore')}
      onMe={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
    />
  );
}
