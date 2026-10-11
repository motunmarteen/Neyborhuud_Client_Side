'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessagesSquare, Newspaper, Plus, Shield, Siren } from 'lucide-react';
import { useScrollHideBottomNav, scrollToTop } from '@/hooks/useScrollHideBottomNav';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useSos } from '@/hooks/useSos';
import { CreateSheet } from '@/components/navigation/CreateSheet';

/**
 * Design foundation F-07: the bottom bar from the home mockup.
 *
 *   My Huud · Gist · ➕ · Chats · Sentinel
 *
 * - ➕ opens "Wetin you wan share?" (quick signals + create) on every screen
 * - Sentinel opens the Sentinel screen: Ask Sentinel (SSAA) + safety + Explore. Press and hold for a silent SOS
 *   (moved here from the old centre Home button, so the habit still works).
 * - Profile is the avatar in the top bar; search/explore become part of Sentinel.
 */

interface BottomNavProps {
  /** Set true only when the nav should be fully hidden (e.g. map overlay). */
  hidden?: boolean;
}

const SOS_HOLD_MS = 600;

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
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-black text-white ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      {label}
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
  const isHome = pathname === '/feed' || pathname === '/';
  const isGist = pathname.startsWith('/gist') || pathname.startsWith('/gossip');
  const isChats = pathname.startsWith('/friendship') || pathname.startsWith('/chat') || pathname.startsWith('/messages');
  const isSentinel = pathname.startsWith('/safety') || pathname.startsWith('/sentinel') || pathname.startsWith('/explore');

  const tabClass = 'flex flex-1 justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <>
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 select-none border-t border-[#E6EAF0] bg-white/[0.98] pb-[max(6px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          hidden || scrollHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-[70px] max-w-xl items-center justify-around px-1">
          <Link
            href="/feed"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollToTop();
              }
            }}
            className={tabClass}
            aria-current={isHome ? 'page' : undefined}
          >
            <Tab label="My Huud" active={isHome}>
              <Home size={22} strokeWidth={isHome ? 2.5 : 2} aria-hidden />
            </Tab>
          </Link>

          <Link href="/gist" className={tabClass} aria-current={isGist ? 'page' : undefined}>
            <Tab label="Gist" active={isGist}>
              <Newspaper size={22} strokeWidth={isGist ? 2.5 : 2} aria-hidden />
            </Tab>
          </Link>

          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create: post, alert, sell, event and more"
              aria-haspopup="dialog"
              className="-mt-7 grid h-[58px] w-[58px] place-items-center rounded-full border-4 border-white bg-primary text-white shadow-[0_8px_18px_rgba(0,184,46,0.4)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:active:scale-95"
            >
              <Plus size={28} strokeWidth={2.6} aria-hidden />
            </button>
          </div>

          <Link href="/friendship" className={tabClass} aria-current={isChats ? 'page' : undefined}>
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
            className={`${tabClass} ${sosActive ? 'text-brand-red' : ''}`}
            aria-label={sosActive ? 'Sentinel: SOS is active' : 'Sentinel: safety and Ask Sentinel. Press and hold for silent SOS'}
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

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
