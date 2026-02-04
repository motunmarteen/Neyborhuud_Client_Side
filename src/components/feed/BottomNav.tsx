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
    `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors touch-manipulation ${active ? 'text-charcoal' : 'text-charcoal/50 active:text-charcoal'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-black/5 safe-area-bottom"
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
          <i className={`bi text-2xl ${isFeed ? 'bi-house-fill' : 'bi-house'}`} aria-hidden />
          <span>Home</span>
        </Link>

        {/* Gossip */}
        <Link
          href="/gossip"
          className={navItemClass(isGossip)}
          aria-current={isGossip ? 'page' : undefined}
          aria-label="Gossip"
        >
          <i className={`bi text-2xl ${isGossip ? 'bi-chat-dots-fill' : 'bi-chat-dots'}`} aria-hidden />
          <span>Gossip</span>
        </Link>

        {/* Search - opens search on feed */}
        <Link
          href="/feed?search=1"
          className={navItemClass(false)}
          aria-label="Search"
        >
          <i className="bi bi-search text-2xl" aria-hidden />
          <span>Search</span>
        </Link>

        {/* Create Post (center + button) */}
        <button
          type="button"
          onClick={onCreatePost}
          className="min-w-[44px] min-h-[44px] -mt-5 flex flex-col items-center justify-center touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 rounded-full"
          aria-label="Create post"
        >
          <span className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <i className="bi bi-plus-lg text-2xl" aria-hidden />
          </span>
          <span className="text-[10px] font-medium text-charcoal/50 mt-1 sr-only sm:not-sr-only">Create</span>
        </button>

        {/* Notifications */}
        <Link
          href="/feed"
          className={navItemClass(false)}
          aria-label="Notifications"
        >
          <i className="bi bi-heart text-2xl" aria-hidden />
          <span>Activity</span>
        </Link>

        {/* Profile → Settings (complete profile accessible from there) */}
        <Link
          href="/settings"
          className={navItemClass(pathname === '/settings')}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          aria-label="Profile and settings"
        >
          <i className={`bi text-2xl ${pathname === '/settings' ? 'bi-person-fill' : 'bi-person'}`} aria-hidden />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
