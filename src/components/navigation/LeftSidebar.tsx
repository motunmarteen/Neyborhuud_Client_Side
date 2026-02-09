'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const shortcuts = [
  { icon: 'home', label: 'Feed', href: '/feed', filled: true },
  { icon: 'chat_bubble', label: 'Gossip', href: '/gossip' },
  { icon: 'storefront', label: 'Marketplace', href: '/marketplace' },
  { icon: 'security', label: 'Safety Hub', href: '/safety' },
  { icon: 'calendar_month', label: 'Events', href: '/events' },
  { icon: 'location_on', label: 'My Neighborhood', href: '/neighborhood' },
];

const groups = [
  { initial: 'P', color: 'bg-purple-500', label: 'Pet Owners', href: '/groups/pet-owners' },
  { initial: 'G', color: 'bg-blue-500', label: 'Gardening Club', href: '/groups/gardening' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

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

  return (
    <div className="p-4 flex flex-col gap-6 h-full">
      {/* Mobile-only: user info at top */}
      <div className="md:hidden flex items-center gap-3 pb-4">
        <div className="neu-divider absolute bottom-0 left-0 right-0" />
        <div className="w-10 h-10 rounded-full neu-avatar flex items-center justify-center font-bold overflow-hidden shrink-0" style={{ background: 'var(--neu-bg)', color: 'var(--neu-text)' }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={userDisplayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">{userInitial}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--neu-text)' }}>{userDisplayName}</p>
          <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>@{user?.username || 'user'}</p>
        </div>
      </div>

      {/* Shortcuts Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col px-3">
          <h1 className="text-base font-bold leading-normal" style={{ color: 'var(--neu-text)' }}>Shortcuts</h1>
          <p className="text-xs font-normal leading-normal" style={{ color: 'var(--neu-text-muted)' }}>Quick access</p>
        </div>
        <div className="flex flex-col gap-1">
          {shortcuts.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  active
                    ? 'neu-btn-active text-primary'
                    : 'neu-flat hover:opacity-70 group'
                }`}
                style={!active ? { color: 'var(--neu-text)' } : undefined}
              >
                <span className={`material-symbols-outlined ${active ? 'fill-1' : 'group-hover:text-primary'} transition-colors`}>
                  {item.icon}
                </span>
                <p className={`text-sm ${active ? 'font-bold' : 'font-medium'} leading-normal`}>
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Groups Section */}
      <div className="pt-4">
        <div className="neu-divider mb-4" />
        <div className="flex flex-col px-3 mb-2">
          <h1 className="text-base font-bold leading-normal" style={{ color: 'var(--neu-text)' }}>Groups</h1>
        </div>
        <div className="flex flex-col gap-1">
          {groups.map((group) => (
            <Link
              key={group.href}
              href={group.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-70 cursor-pointer transition-all"
              style={{ color: 'var(--neu-text)' }}
            >
              <div className={`w-6 h-6 rounded ${group.color} flex items-center justify-center text-white text-xs font-bold`}>
                {group.initial}
              </div>
              <p className="text-sm font-medium leading-normal">{group.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile-only: Settings & extras at bottom */}
      <div className="md:hidden mt-auto pt-4 flex flex-col gap-1">
        <div className="neu-divider mb-2" />
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-70 cursor-pointer transition-all"
          style={{ color: 'var(--neu-text)' }}
        >
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium leading-normal">Settings</p>
        </Link>
        <Link
          href={user ? `/profile/${user.username}` : '/settings'}
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-70 cursor-pointer transition-all"
          style={{ color: 'var(--neu-text)' }}
        >
          <span className="material-symbols-outlined">person</span>
          <p className="text-sm font-medium leading-normal">My Profile</p>
        </Link>
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for toggle event from TopNav hamburger
  useEffect(() => {
    const handleToggle = () => setMobileOpen(true);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop sidebar – hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col neu-base overflow-y-auto shrink-0" style={{ boxShadow: '4px 0 12px var(--neu-shadow-dark)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-72 neu-base overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col" style={{ boxShadow: '8px 0 24px var(--neu-shadow-dark)' }}>
            {/* Close button */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <Link href="/feed" className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">holiday_village</span>
                <span className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>NeyborHuud</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-xl neu-btn flex items-center justify-center transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--neu-text)' }}>close</span>
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
