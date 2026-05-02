'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { useSos } from '@/hooks/useSos';

interface BottomNavProps {
  hidden?: boolean;
}

export function BottomNav({ hidden }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const sos = useSos();
  const isFeed = pathname === '/feed';
  const isGossip = pathname === '/local-news';
  const profileHref = user?.username ? `/profile/${user.username}` : '/settings';

  // Long-press → silent SOS. ≥600 ms hold fires silently in the background.
  // Tap → /sos (the dedicated emergency command center, where the user can
  // pick visibility mode, run a drill, see active SOS state, etc.). The
  // /safety hub remains for browsing the broader safety toolkit.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const SOS_HREF = '/sos';

  const startSosPress = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      // Silent SOS — no UI feedback, by design. If the backend rejects (e.g. missing
      // profile fields), useSos surfaces the error; we do NOT pre-empt with a redirect
      // because a safety control must not silently navigate users away from the action.
      void sos.triggerSos({ silent: true });
    }, 600);
  };

  const cancelSosPress = (e: React.SyntheticEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressFired.current) {
      // Suppress the navigation that would otherwise follow a click after long-press.
      e.preventDefault();
      e.stopPropagation();
      longPressFired.current = false;
      return;
    }
    // Short tap → navigate to the dedicated SOS command center.
    if (e.type === 'pointerup' || e.type === 'touchend' || e.type === 'mouseup') {
      router.push(SOS_HREF);
    }
  };

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: !!user,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const unreadMessages = ((convData?.data as any)?.conversations ?? (convData?.data as any)?.data ?? [])
    .reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0);

  const navItemClass = (active: boolean) =>
    `min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors touch-manipulation ${
      active
        ? 'text-primary'
        : ''
    }`;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 neu-nav safe-area-bottom transition-transform duration-300 ease-in-out ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-14 px-2">
        {/* Home */}
        <Link
          href="/feed"
          className={navItemClass(isFeed)}
          aria-current={isFeed ? 'page' : undefined}
          aria-label="Home"
        >
          <span className={`material-symbols-outlined text-[30px] ${isFeed ? 'fill-1' : ''}`}>home</span>
        </Link>

        {/* Local News */}
        <Link
          href="/local-news"
          className={navItemClass(isGossip)}
          aria-current={isGossip ? 'page' : undefined}
          aria-label="Local News"
        >
          <span className={`material-symbols-outlined text-[30px] ${isGossip ? 'fill-1' : ''}`}>chat_bubble</span>
        </Link>

        {/* SOS / Safety — tap navigates; long-press fires SILENT SOS */}
        <button
          type="button"
          onPointerDown={startSosPress}
          onPointerUp={cancelSosPress}
          onPointerLeave={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation select-none"
          aria-current={pathname.startsWith('/sos') || pathname.startsWith('/safety') ? 'page' : undefined}
          aria-label="SOS — tap to open command center, long-press for silent SOS"
        >
          {/* Pulsing ring when active or pending */}
          {(pathname.startsWith('/sos') || pathname.startsWith('/safety') || sos.phase !== 'idle') && (
            <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-red-500/20 animate-ping" />
          )}
          {/* Steady glow backdrop */}
          <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-red-500/10" />
          <span className={`material-symbols-outlined text-[30px] text-red-500 relative z-10 ${pathname.startsWith('/sos') || pathname.startsWith('/safety') ? 'fill-1' : ''}`}>sos</span>
        </button>

        {/* Messages */}
        <Link
          href="/messages"
          className={navItemClass(pathname === '/messages')}
          aria-current={pathname === '/messages' ? 'page' : undefined}
          aria-label="Messages"
        >
          <div className="relative">
            <span className={`material-symbols-outlined text-[30px] ${pathname === '/messages' ? 'fill-1' : ''}`}>chat</span>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </div>
        </Link>

        {/* Profile */}
        <Link
          href={profileHref}
          className={navItemClass(pathname.startsWith('/profile'))}
          aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
          aria-label="Profile"
        >
          <span className={`material-symbols-outlined text-[30px] ${pathname.startsWith('/profile') ? 'fill-1' : ''}`}>person</span>
        </Link>
      </div>
    </nav>
  );
}

