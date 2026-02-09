'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { GlobalSearch } from '@/components/GlobalSearch';

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Home', href: '/feed' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Safety', href: '/safety' },
    { label: 'Events', href: '/events' },
    { label: 'Messages', href: '/messages' },
  ];

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    return pathname?.startsWith(href);
  };

  const userDisplayName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username
    : 'User';
  const userInitial = userDisplayName[0]?.toUpperCase() || 'U';

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="z-50 flex items-center justify-between whitespace-nowrap neu-base px-4 sm:px-10 py-3" style={{ boxShadow: '0 4px 12px var(--neu-shadow-dark)' }}>
      <div className="flex items-center gap-4 sm:gap-8">
        {/* Mobile hamburger – dispatches a custom event the LeftSidebar listens for */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--neu-text)' }}>menu</span>
        </button>

        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-4 cursor-pointer">
          <div className="size-8 text-primary">
            <span className="material-symbols-outlined text-4xl">holiday_village</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block" style={{ color: 'var(--neu-text)' }}>NeyborHuud</h2>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-col min-w-40 max-w-64">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex flex-1 justify-end gap-4 sm:gap-8">
        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium leading-normal transition-colors ${
                isActive(link.href)
                  ? 'font-bold border-b-2 border-primary'
                  : 'hover:text-primary'
              }`}
              style={{ color: isActive(link.href) ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 items-center">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 neu-btn gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
            style={{ color: 'var(--neu-text)' }}
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 neu-btn gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] relative"
            style={{ color: 'var(--neu-text)' }}
          >
            <span className="material-symbols-outlined">notifications</span>
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
          </Link>

          {/* Profile Button */}
          <Link
            href={user ? `/profile/${user.username}` : '/settings'}
            className="hidden sm:flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 neu-btn gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
            style={{ color: 'var(--neu-text)' }}
          >
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>

        {/* Avatar with Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label="Profile menu"
          >
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 neu-avatar flex items-center justify-center font-bold overflow-hidden cursor-pointer hover:scale-105 transition-all" style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={userDisplayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{userInitial}</span>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-56 neu-modal rounded-2xl z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User info */}
              <div className="px-4 py-3">
                <div className="neu-divider mb-3" />
                <p className="text-sm font-bold truncate" style={{ color: 'var(--neu-text)' }}>{userDisplayName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>@{user?.username || 'user'}</p>
              </div>

              <Link
                href={user ? `/profile/${user.username}` : '/settings'}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--neu-text)' }}
              >
                <span className="material-symbols-outlined text-lg">person</span>
                My Profile
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--neu-text)' }}
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                Settings
              </Link>

              <div className="neu-divider my-1" />

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-red hover:opacity-70 transition-colors w-full text-left disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute top-full left-0 right-0 neu-base p-4 md:hidden z-50" style={{ boxShadow: '0 8px 16px var(--neu-shadow-dark)' }}>
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
