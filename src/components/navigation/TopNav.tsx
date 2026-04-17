'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { GlobalSearch } from '@/components/GlobalSearch';

export default function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isOnFeed = pathname === '/feed' || pathname === '/';

  const iconColor = isOnFeed ? 'rgba(255,255,255,0.92)' : 'var(--neu-text)';
  const iconShadow = isOnFeed ? '0 1px 4px rgba(0,0,0,0.4)' : 'none';

  return (
    <header
      className="relative z-20 flex items-center gap-3 whitespace-nowrap px-4 py-2.5 transition-all duration-[2000ms]"
      style={isOnFeed
        ? { background: 'transparent' }
        : { background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
      }
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="md:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-full transition-colors"
        style={{ color: iconColor }}
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[26px]" style={{ textShadow: iconShadow }}>menu</span>
      </button>

      {/* Logo */}
      <Link href="/feed" className="flex items-center shrink-0 cursor-pointer">
        <h2
          className="text-lg font-extrabold leading-tight tracking-[-0.02em] transition-colors duration-[2000ms]"
          style={isOnFeed
            ? { color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }
            : { color: 'var(--color-primary)' }
          }
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
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{ color: iconColor }}
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[26px]" style={{ textShadow: iconShadow }}>search</span>
        </button>
        {/* Create Post */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-create-post'))}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{ color: iconColor }}
          aria-label="Create post"
        >
          <span className="material-symbols-outlined text-[26px]" style={{ textShadow: iconShadow }}>edit_square</span>
        </button>
        {/* Notifications */}
        <Link
          href="/notifications"
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors relative"
          style={{ color: iconColor }}
        >
          <span className="material-symbols-outlined text-[26px]" style={{ textShadow: iconShadow }}>notifications</span>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></div>
        </Link>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06]">
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl"
              style={{ color: 'var(--neu-text)' }}
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
