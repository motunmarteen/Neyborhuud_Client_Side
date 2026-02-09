'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  onCreatePost: () => void;
}

export function BottomNav({ onCreatePost }: BottomNavProps) {
  const pathname = usePathname();
  const isFeed = pathname === '/feed';
  const isGossip = pathname === '/gossip';

  const navItemClass = (active: boolean) =>
    `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors touch-manipulation ${
      active
        ? 'text-primary'
        : ''
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 neu-nav safe-area-bottom"
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
          <span className={`material-symbols-outlined text-2xl ${isFeed ? 'fill-1' : ''}`}>home</span>
          <span>Home</span>
        </Link>

        {/* Gossip */}
        <Link
          href="/gossip"
          className={navItemClass(isGossip)}
          aria-current={isGossip ? 'page' : undefined}
          aria-label="Gossip"
        >
          <span className={`material-symbols-outlined text-2xl ${isGossip ? 'fill-1' : ''}`}>chat_bubble</span>
          <span>Gossip</span>
        </Link>

        {/* Create Post (center + button) */}
        <button
          type="button"
          onClick={onCreatePost}
          className="min-w-[44px] min-h-[44px] -mt-5 flex flex-col items-center justify-center touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
          aria-label="Create post"
        >
          <span className="w-12 h-12 rounded-2xl neu-fab text-primary flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl">add</span>
          </span>
        </button>

        {/* Search */}
        <Link
          href="/feed?search=1"
          className={navItemClass(false)}
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-2xl">search</span>
          <span>Search</span>
        </Link>

        {/* Profile */}
        <Link
          href="/settings"
          className={navItemClass(pathname === '/settings')}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          aria-label="Profile and settings"
        >
          <span className={`material-symbols-outlined text-2xl ${pathname === '/settings' ? 'fill-1' : ''}`}>person</span>
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
