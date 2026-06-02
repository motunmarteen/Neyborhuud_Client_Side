'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type MapUser = {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  profilePicture?: string;
  bio?: string;
  lga?: string;
  state?: string;
  isVerified?: boolean;
  distanceMetres?: number;
  isFollowing?: boolean;
};

type MapPlace = {
  lga: string;
  state: string;
  userCount: number;
  followerCount: number;
  isFollowing: boolean;
};

export type MapSelection =
  | { type: 'user'; data: MapUser }
  | { type: 'place'; data: MapPlace };

type MapSelectionSheetProps = {
  selection: MapSelection | null;
  embedded?: boolean;
  isActionPending: boolean;
  loadingPlaceStats?: boolean;
  placeStats?: {
    userCount?: number;
    followerCount?: number;
    recentPostCount?: number;
  };
  onClose: () => void;
  onUserFollowToggle: (userId: string, isFollowing: boolean) => void;
  onPlaceFollowToggle: (lga: string, state: string, isFollowing: boolean) => void;
  fmtDist: (m: number) => string;
};

export function MapSelectionSheet({
  selection,
  embedded = false,
  isActionPending,
  loadingPlaceStats,
  placeStats,
  onClose,
  onUserFollowToggle,
  onPlaceFollowToggle,
  fmtDist,
}: MapSelectionSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selection) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selection]);

  if (!mounted || !selection) return null;

  /** Match app horizontal inset (friendship / browse pages use px-4). */
  const sheetInset = '1rem';
  const sheetPaddingBottom = embedded
    ? `calc(var(--app-nav-bottom, 4.25rem) + ${sheetInset})`
    : `max(${sheetInset}, env(safe-area-inset-bottom, 0px))`;

  const placeHue = selection.type === 'place'
    ? Array.from(selection.data.lga).reduce((s, c) => s + c.charCodeAt(0), 0) % 360
    : 0;

  return createPortal(
    <AnimatePresence>
      {selection ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[60] border-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[61] box-border flex flex-col justify-end px-4 pointer-events-none"
            style={{ paddingBottom: sheetPaddingBottom }}
          >
            <div className="mod-card pointer-events-auto mx-auto box-border w-full max-w-lg min-w-0 overflow-hidden rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
                  {selection.type === 'user' ? 'Neighbour' : 'Place'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="mod-chip shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold"
                >
                  Close
                </button>
              </div>

              {selection.type === 'user' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {selection.data.avatarUrl || selection.data.profilePicture ? (
                        <Image
                          src={selection.data.avatarUrl || selection.data.profilePicture!}
                          alt={selection.data.username}
                          width={56}
                          height={56}
                          className="rounded-full border-2 border-black/[0.08] object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black/[0.08] bg-gradient-to-br from-primary to-brand-green-dark text-lg font-bold text-white">
                          {`${(selection.data.firstName || '')[0] || ''}${(selection.data.lastName || '')[0] || ''}`.toUpperCase() || '?'}
                        </div>
                      )}
                      {selection.data.isVerified ? (
                        <span className="material-symbols-outlined absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 text-[15px] text-primary fill-1">
                          verified
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                        {selection.data.firstName} {selection.data.lastName}
                      </p>
                      <p className="text-sm text-[var(--neu-text-muted)]">@{selection.data.username}</p>
                      {(selection.data.lga || selection.data.state) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--neu-text-muted)]">
                          <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                          <span className="truncate">
                            {[selection.data.lga, selection.data.state].filter(Boolean).join(', ')}
                          </span>
                          {selection.data.distanceMetres != null ? (
                            <span className="font-semibold text-primary">
                              · {fmtDist(selection.data.distanceMetres)}
                            </span>
                          ) : null}
                        </p>
                      )}
                    </div>
                  </div>

                  {selection.data.bio ? (
                    <p className="mod-inset rounded-xl px-3 py-2.5 text-sm leading-relaxed text-[var(--neu-text-muted)]">
                      {selection.data.bio}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/profile/${selection.data.username}`}
                      className="mod-chip flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold text-primary"
                      onClick={onClose}
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        onUserFollowToggle(
                          selection.data._id,
                          selection.data.isFollowing ?? false,
                        )
                      }
                      disabled={isActionPending}
                      className={`mod-chip mod-chip-active flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-50 ${
                        selection.data.isFollowing
                          ? 'text-[var(--neu-text-muted)]'
                          : 'text-primary'
                      }`}
                    >
                      {isActionPending
                        ? '…'
                        : selection.data.isFollowing
                          ? 'Following'
                          : 'Follow'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08]"
                      style={{
                        background: `linear-gradient(135deg, hsl(${placeHue},60%,28%), hsl(${(placeHue + 30) % 360},70%,18%))`,
                      }}
                    >
                      <span className="material-symbols-outlined fill-1 text-[28px] text-white">
                        location_city
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                        {selection.data.lga}
                      </p>
                      <p className="text-sm text-[var(--neu-text-muted)]">{selection.data.state}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--neu-text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">person</span>
                          {selection.data.userCount.toLocaleString()} residents
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">favorite</span>
                          {(placeStats?.followerCount ?? selection.data.followerCount).toLocaleString()}{' '}
                          followers
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="mod-inset rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neu-text-muted)]">
                        Residents
                      </p>
                      <p className="mt-0.5 text-base font-black" style={{ color: 'var(--neu-text)' }}>
                        {loadingPlaceStats ? '…' : (placeStats?.userCount ?? selection.data.userCount)}
                      </p>
                    </div>
                    <div className="mod-inset rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neu-text-muted)]">
                        Followers
                      </p>
                      <p className="mt-0.5 text-base font-black text-primary">
                        {loadingPlaceStats
                          ? '…'
                          : (placeStats?.followerCount ?? selection.data.followerCount)}
                      </p>
                    </div>
                    <div className="mod-inset rounded-xl p-2.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--neu-text-muted)]">
                        Posts (7d)
                      </p>
                      <p className="mt-0.5 text-base font-black" style={{ color: 'var(--neu-text)' }}>
                        {loadingPlaceStats ? '…' : (placeStats?.recentPostCount ?? 0)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onPlaceFollowToggle(
                        selection.data.lga,
                        selection.data.state,
                        selection.data.isFollowing,
                      )
                    }
                    disabled={isActionPending}
                    className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
                  >
                    {isActionPending
                      ? '…'
                      : selection.data.isFollowing
                        ? 'Following place'
                        : 'Follow this place'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
