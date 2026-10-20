'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessagesSquare, Newspaper, Plus, Shield, Siren } from 'lucide-react';
import { useScrollHideBottomNav } from '@/hooks/useScrollHideBottomNav';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useSos } from '@/hooks/useSos';
import { CreateSheet } from '@/components/navigation/CreateSheet';

/**
 * Design foundation F-07: the bottom bar from the home mockup.
 *
 *   My Huud · Feed · ➕ · Chats · Sentinel   (Gist removed 2026-10-15: the Feed replaced it)
 *
 * - ➕ opens "Wetin you wan share?" (quick signals + create) on every screen
 * - Sentinel opens the Sentinel screen: every safety feature (Ask Huud is the 🔍 in the top bar). Press and hold for a silent SOS
 *   (moved here from the old centre Home button, so the habit still works).
 * - Profile is the avatar in the top bar; search/explore become part of Sentinel.
 *
 * Look (owner, 2026-10-15, from the meetdubai.app reference): a floating pill with space
 * around it, the active tab in green with a short underline, and a raised round ➕ in the
 * middle set in a ring so it looks cut into the bar. Light theme (owner: white, not dark).
 */

interface BottomNavProps {
  /** Set true only when the nav should be fully hidden (e.g. map overlay). */
  hidden?: boolean;
}

const SOS_HOLD_MS = 600;

/** Window event that opens the ➕ Create sheet from anywhere. */
export const OPEN_CREATE_SHEET = 'nh-open-create-sheet';

function Tab({
  label,
  active,
  children,
  badge,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <span className={`relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-[3px] text-[11px] font-bold ${active ? 'text-brand-green-dark' : 'text-muted'}`}>
      <span className="relative">
        {children}
        {badge && badge > 0 ? (
          <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-black text-white ring-2 ring-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      {label}
      {/* Short underline under the active tab. */}
      <span aria-hidden className={`h-[3px] w-4 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
    </span>
  );
}

export function BottomNav({ hidden = false }: BottomNavProps) {
  const pathname = usePathname() || '/';
  const scrollHidden = useScrollHideBottomNav();
  const router = useRouter();
  const { phase: sosPhase, triggerSos } = useSos();
  const { data: messageUnreadCount = 0 } = useUnreadCount('message');
  const [createOpen, setCreateOpen] = useState(false);
  const [createSub, setCreateSub] = useState<'poll' | 'lost_found' | null>(null);

  // Other screens (the map's "Wetin dey happen?" and "Report") open the same Create sheet;
  // Ask Huud can open the poll or lost & found form straight away (detail.sub).
  useEffect(() => {
    const open = (e: Event) => {
      const sub = (e as CustomEvent<{ sub?: 'poll' | 'lost_found' }>).detail?.sub;
      if (sub) setCreateSub(sub);
      else setCreateOpen(true);
    };
    window.addEventListener(OPEN_CREATE_SHEET, open);
    return () => window.removeEventListener(OPEN_CREATE_SHEET, open);
  }, []);

  // Press-and-hold Sentinel = silent SOS.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFired = useRef(false);
  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  const startHold = () => {
    holdFired.current = false;
    clearHold();
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      if (sosPhase === 'idle') void triggerSos({ silent: true });
    }, SOS_HOLD_MS);
  };
  const onSentinelClick = () => {
    if (holdFired.current) {
      holdFired.current = false;
      return;
    }
    router.push('/sentinel');
  };

  const sosActive = sosPhase !== 'idle';
  const isHome = pathname === '/huud' || pathname === '/';
  const isFeed = pathname === '/feed' || pathname.startsWith('/feed/');
  const isChats = pathname.startsWith('/friendship') || pathname.startsWith('/chat') || pathname.startsWith('/messages');
  const isSentinel = pathname.startsWith('/safety') || pathname.startsWith('/sentinel') || pathname.startsWith('/sos');

  const tabClass = 'flex flex-1 justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <>
      <nav
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 select-none px-3 pb-[max(10px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          hidden || scrollHidden ? 'translate-y-[calc(100%+1.5rem)]' : 'translate-y-0'
        }`}
        aria-label="Main navigation"
      >
        <div className="pointer-events-auto mx-auto flex h-16 max-w-xl items-center justify-around rounded-[28px] border border-[#E6EAF0] bg-white px-1 shadow-[0_10px_28px_rgba(29,36,51,0.16)]">
          <Link
            href="/huud"
            onClick={(e) => {
              // Already on the map: stay.
              if (pathname === '/huud') e.preventDefault();
            }}
            className={tabClass}
            aria-current={isHome ? 'page' : undefined}
          >
            <Tab label="My Huud" active={isHome}>
              <Home size={22} strokeWidth={isHome ? 2.5 : 2} aria-hidden />
            </Tab>
          </Link>

          <Link href="/feed" className={tabClass} aria-current={isFeed ? 'page' : undefined}>
            <Tab label="Feed" active={isFeed}>
              <Newspaper size={22} strokeWidth={isFeed ? 2.5 : 2} aria-hidden />
            </Tab>
          </Link>

          <div className="flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create: post, alert, sell, event and more"
              aria-haspopup="dialog"
              className="-mt-9 grid h-[62px] w-[62px] place-items-center rounded-full border-[5px] border-white bg-[radial-gradient(circle_at_35%_30%,#3DDC6A_0%,#00B82E_60%,#009A26_100%)] text-white shadow-[0_8px_20px_rgba(0,184,46,0.45)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:active:scale-95"
            >
              <Plus size={30} strokeWidth={2.8} aria-hidden />
            </button>
            <span aria-hidden className="mt-0.5 text-[11px] font-bold text-muted">
              Create
            </span>
          </div>

          <Link href="/chat" className={tabClass} aria-current={isChats ? 'page' : undefined}>
            <Tab label="Chats" active={isChats} badge={messageUnreadCount}>
              <MessagesSquare size={22} strokeWidth={isChats ? 2.5 : 2} aria-hidden />
            </Tab>
          </Link>

          <button
            type="button"
            onClick={onSentinelClick}
            onPointerDown={startHold}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
            onPointerCancel={clearHold}
            onContextMenu={(e) => e.preventDefault()}
            className={tabClass}
            aria-label={sosActive ? 'Sentinel: SOS is active' : 'Sentinel: all your safety tools. Press and hold for silent SOS'}
            aria-current={isSentinel ? 'page' : undefined}
          >
            {sosActive ? (
              <span className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-[3px] text-[11px] font-black text-brand-red motion-safe:animate-pulse">
                <Siren size={22} strokeWidth={2.5} aria-hidden />
                SOS on
              </span>
            ) : (
              <Tab label="Sentinel" active={isSentinel}>
                <Shield size={22} strokeWidth={isSentinel ? 2.5 : 2} aria-hidden />
              </Tab>
            )}
          </button>
        </div>
      </nav>

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} sub={createSub} onSubClosed={() => setCreateSub(null)} />
    </>
  );
}
