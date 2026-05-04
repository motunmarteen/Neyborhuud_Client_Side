'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { GlobalSearch } from '@/components/GlobalSearch';

export default function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isOnFeed = pathname === '/feed' || pathname === '/';
  const isOnProfile = pathname?.startsWith('/profile/');
  const isTransparent = isOnFeed || isOnProfile;
  const navTone = isOnFeed ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]' : isOnProfile ? 'text-primary' : 'text-charcoal';

  return (
    <header
      className={`relative z-20 flex items-center gap-3 whitespace-nowrap px-4 py-2.5 ${isTransparent ? 'bg-transparent' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'}`}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className={`md:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-full transition-colors ${navTone}`}
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[26px]">menu</span>
      </button>

      {/* Logo */}
      <Link href="/feed" className="flex items-center shrink-0 cursor-pointer">
        <h2
          className={`text-lg font-extrabold leading-tight tracking-[-0.02em] ${isOnFeed ? 'text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]' : 'text-primary'}`}
        >
          NeyborHuud
        </h2>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Search + Create Post + Notifications */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${navTone}`}
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        {/* Create Post */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-create-post'))}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${navTone}`}
          aria-label="Create post"
        >
          <span className="material-symbols-outlined text-[26px]">edit_square</span>
        </button>
        {/* Notifications */}
        <Link
          href="/notifications"
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors relative ${navTone}`}
        >
          <span className="material-symbols-outlined text-[26px]">notifications</span>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></div>
        </Link>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06]">
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl text-charcoal"
              aria-label="Close search"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div className="flex-1">
              <GlobalSearch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
