'use client';

import React, { useRef, useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutGrid, Compass, Home, Shield, MessagesSquare, Siren, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScrollHideBottomNav, scrollToTop } from '@/hooks/useScrollHideBottomNav';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useSos } from '@/hooks/useSos';
import { useSentinelBottomSheet } from '@/contexts/SentinelBottomSheetContext';
import { LocalHuudBottomSheet } from '@/components/navigation/LocalHuudBottomSheet';
import { UserProfileDrawer } from '@/components/navigation/UserProfileDrawer';
import { resolveUserAvatarUrl, resolveProfileAvatarInitial } from '@/lib/userAvatar';

interface BottomNavProps {
  /** Set true only when the nav should be fully hidden (e.g. map overlay). */
  hidden?: boolean;
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BottomNav({ hidden = false }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const scrollHidden = useScrollHideBottomNav();
  const { openSheet: openSentinelSheet } = useSentinelBottomSheet();
  const { phase: sosPhase, triggerSos } = useSos();
  const [localHuudOpen, setLocalHuudOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  const isClient = useIsClient();
  const { data: messageUnreadCount = 0 } = useUnreadCount('message');

  const resolvedAvatar = isClient ? resolveUserAvatarUrl(user) : null;
  const initial = isClient ? resolveProfileAvatarInitial(user, user?.username) : 'N';

  // SOS activation logic
  const sosLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosLongPressFired = useRef(false);

  const clearSosLongPressTimer = () => {
    if (sosLongPressTimer.current) {
      clearTimeout(sosLongPressTimer.current);
      sosLongPressTimer.current = null;
    }
  };

  const startSosLongPress = () => {
    sosLongPressFired.current = false;
    clearSosLongPressTimer();
    sosLongPressTimer.current = setTimeout(() => {
      sosLongPressFired.current = true;
      if (sosPhase === 'idle') {
        void triggerSos({ silent: true });
      }
    }, 600);
  };

  const cancelSosLongPress = () => {
    clearSosLongPressTimer();
  };

  const handleCenterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (sosLongPressFired.current) {
      sosLongPressFired.current = false;
      return;
    }
    if (pathname === '/feed' || pathname === '/') {
      scrollToTop();
    } else {
      router.push('/feed');
    }
  };

  const sosActive = sosPhase !== 'idle';
  const isFeed = pathname === '/feed' || pathname === '/';
  const isExplore = pathname.startsWith('/map') || pathname.startsWith('/explore');
  const isSentinel = pathname.startsWith('/safety') || pathname.startsWith('/sentinel');
  const isChat = pathname.startsWith('/friendship') || pathname.startsWith('/chat');
  const isProfile = pathname.startsWith('/profile') || userDrawerOpen;

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex justify-center pb-safe mb-1.5 px-2.5 sm:px-3 select-none"
        role="navigation"
        aria-label="Main navigation"
      >
        <div
          className={`pointer-events-auto transition-transform duration-300 ease-out ${
            hidden || scrollHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Frosted Curved Bottom Dock — Daylight Light Theme */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            {/* 1. MENU */}
            <button
              type="button"
              onClick={() => setLocalHuudOpen(true)}
              className="flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-2xl text-[#5B6478] hover:text-[#1D2433] transition-all active:scale-95 group relative cursor-pointer"
              aria-label="Community Menu"
            >
              <LayoutGrid size={19} className="transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Menu</span>
            </button>

            {/* 2. EXPLORE */}
            <Link
              href="/map"
              className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-2xl transition-all active:scale-95 group relative ${
                isExplore ? 'text-[#0E8A3E] font-bold' : 'text-[#5B6478] hover:text-[#1D2433]'
              }`}
              aria-label="Explore & Street Radar"
              aria-current={isExplore ? 'page' : undefined}
            >
              <Compass size={19} className="transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Explore</span>
              {isExplore && (
                <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-[#0E8A3E]" />
              )}
            </Link>

            {/* 3. CENTER HIGHLIGHTED BEACON (FEED / SOS) */}
            <div className="relative -top-2 px-0.5 sm:px-1">
              <button
                type="button"
                onClick={handleCenterClick}
                onPointerDown={startSosLongPress}
                onPointerUp={cancelSosLongPress}
                onPointerLeave={clearSosLongPressTimer}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative w-12 sm:w-13 h-12 sm:h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer ${
                  sosActive
                    ? 'bg-red-600 text-white shadow-red-600/50 animate-pulse'
                    : isFeed
                      ? 'bg-[#00B82E] text-black shadow-[#00B82E]/40'
                      : 'bg-[#F0F4F1] text-black border border-black/10 hover:border-[#0E8A3E]/40'
                }`}
                aria-label="Home Feed (Long press for SOS)"
              >
                {sosActive ? (
                  <Siren size={23} className="stroke-[2.5]" />
                ) : (
                  <Home size={21} className={isFeed ? 'stroke-[2.5]' : 'stroke-2'} />
                )}
                {/* Ambient halo glow */}
                <span
                  className={`absolute -inset-1 rounded-2xl -z-10 blur-sm opacity-40 transition-opacity ${
                    sosActive
                      ? 'bg-red-500'
                      : isFeed
                        ? 'bg-[#00B82E]'
                        : 'bg-transparent'
                  }`}
                />
              </button>
            </div>

            {/* 4. SAFETY / SENTINEL */}
            <button
              type="button"
              onClick={() => openSentinelSheet()}
              className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-2xl transition-all active:scale-95 group relative cursor-pointer ${
                isSentinel ? 'text-[#0E8A3E] font-bold' : 'text-[#5B6478] hover:text-[#1D2433]'
              }`}
              aria-label="Sentinel Safety Toolkit"
              aria-current={isSentinel ? 'page' : undefined}
            >
              <Shield size={19} className="transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Sentinel</span>
              {isSentinel && (
                <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-[#0E8A3E]" />
              )}
            </button>

            {/* 5. CHAT */}
            <Link
              href="/friendship"
              className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-2xl transition-all active:scale-95 group relative ${
                isChat ? 'text-[#0E8A3E] font-bold' : 'text-[#5B6478] hover:text-[#1D2433]'
              }`}
              aria-label="Chat & Messages"
              aria-current={isChat ? 'page' : undefined}
            >
              <div className="relative">
                <MessagesSquare size={19} className="transition-transform group-hover:scale-110" />
                {messageUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white">
                    {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Chat</span>
              {isChat && (
                <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-[#0E8A3E]" />
              )}
            </Link>

            {/* 6. PROFILE */}
            <button
              type="button"
              onClick={() => setUserDrawerOpen(true)}
              className={`flex flex-col items-center justify-center w-11 sm:w-13 h-12 rounded-2xl transition-all active:scale-95 group relative cursor-pointer ${
                isProfile ? 'text-[#0E8A3E] font-bold' : 'text-[#5B6478] hover:text-[#1D2433]'
              }`}
              aria-label="Resident Profile"
              aria-current={isProfile ? 'page' : undefined}
            >
              <div className="relative">
                <div
                  className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black transition-all ${
                    isProfile
                      ? 'ring-2 ring-[#0E8A3E] bg-emerald-100 text-[#0E8A3E]'
                      : 'ring-1 ring-black/15 bg-slate-100 text-slate-700'
                  }`}
                >
                  {resolvedAvatar ? (
                    <Image
                      src={resolvedAvatar}
                      alt={user?.firstName || 'Profile'}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  ) : initial ? (
                    <span>{initial}</span>
                  ) : (
                    <User size={13} className="stroke-[2.2]" />
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Profile</span>
              {isProfile && (
                <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-[#0E8A3E]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Local Huud Community Services Bottom Sheet */}
      <LocalHuudBottomSheet
        open={localHuudOpen}
        onClose={() => setLocalHuudOpen(false)}
      />

      {/* User Profile Drawer */}
      <UserProfileDrawer
        isOpen={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
      />
    </>
  );
}
