'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlobalSearch } from '@/components/GlobalSearch';

export default function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="z-50 flex items-center gap-3 whitespace-nowrap bg-white px-4 py-2.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="md:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-full hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[26px]" style={{ color: 'var(--neu-text)' }}>menu</span>
      </button>

      {/* Logo — text only */}
      <Link href="/feed" className="flex items-center shrink-0 cursor-pointer">
        <h2 className="text-lg font-extrabold leading-tight tracking-[-0.02em] text-primary">NeyborHuud</h2>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Search + Create Post + Notifications */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors"
          style={{ color: 'var(--neu-text)' }}
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        {/* Create Post */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-create-post'))}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors"
          style={{ color: 'var(--neu-text)' }}
          aria-label="Create post"
        >
          <span className="material-symbols-outlined text-[26px]">edit_square</span>
        </button>
        {/* Notifications */}
        <Link
          href="/notifications"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors relative"
          style={{ color: 'var(--neu-text)' }}
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
