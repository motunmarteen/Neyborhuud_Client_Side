'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface BottomNavProps {
  hidden?: boolean;
}

export function BottomNav({ hidden }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isFeed = pathname === '/feed';
  const isGossip = pathname === '/gossip';
  const profileHref = user?.username ? `/profile/${user.username}` : '/settings';

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

        {/* Gossip */}
        <Link
          href="/gossip"
          className={navItemClass(isGossip)}
          aria-current={isGossip ? 'page' : undefined}
          aria-label="Gossip"
        >
          <span className={`material-symbols-outlined text-[30px] ${isGossip ? 'fill-1' : ''}`}>chat_bubble</span>
        </Link>

        {/* SOS */}
        <Link
          href="/safety"
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-current={pathname === '/safety' ? 'page' : undefined}
          aria-label="SOS"
        >
          {/* Pulsing ring when active */}
          {pathname === '/safety' && (
            <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-red-500/20 animate-ping" />
          )}
          {/* Steady glow backdrop */}
          <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-red-500/10" />
          <span className={`material-symbols-outlined text-[30px] text-red-500 relative z-10 ${pathname === '/safety' ? 'fill-1' : ''}`}>sos</span>
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className={navItemClass(pathname === '/messages')}
          aria-current={pathname === '/messages' ? 'page' : undefined}
          aria-label="Messages"
        >
          <span className={`material-symbols-outlined text-[30px] ${pathname === '/messages' ? 'fill-1' : ''}`}>chat</span>
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
