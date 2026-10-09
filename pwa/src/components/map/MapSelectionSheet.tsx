'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MapPin,
  Building2,
  Users,
  Heart,
  X,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

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

  /** Match app horizontal inset */
  const sheetInset = '1rem';
  const sheetPaddingBottom = embedded
    ? `calc(var(--app-nav-bottom, 4.25rem) + ${sheetInset})`
    : `max(${sheetInset}, env(safe-area-inset-bottom, 0px))`;

  const placeHue =
    selection.type === 'place'
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
            <div className="pointer-events-auto mx-auto box-border w-full max-w-lg min-w-0 overflow-hidden rounded-3xl bg-white dark:bg-[#12161A] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                  {selection.type === 'user' ? 'Neighbor Pin' : 'Estate / Ward Pin'}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition-colors"
                  aria-label="Close sheet"
                >
                  <X size={16} />
                </button>
              </div>

              {selection.type === 'user' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      {selection.data.avatarUrl || selection.data.profilePicture ? (
                        <Image
                          src={selection.data.avatarUrl || selection.data.profilePicture!}
                          alt={selection.data.username}
                          width={60}
                          height={60}
                          className="h-15 w-15 rounded-2xl border-2 border-black/[0.08] dark:border-white/[0.08] object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-15 w-15 items-center justify-center rounded-2xl border-2 border-black/[0.08] bg-gradient-to-br from-[#00C830] to-teal-700 text-lg font-black text-white shadow-sm">
                          {`${(selection.data.firstName || '')[0] || ''}${(selection.data.lastName || '')[0] || ''}`.toUpperCase() || '?'}
                        </div>
                      )}
                      {selection.data.isVerified ? (
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-slate-900 p-0.5 text-[#00C830] shadow-sm">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {selection.data.firstName} {selection.data.lastName}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        @{selection.data.username}
                      </p>
                      {(selection.data.lga || selection.data.state) && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span className="truncate">
                            {[selection.data.lga, selection.data.state].filter(Boolean).join(', ')}
                          </span>
                          {selection.data.distanceMetres != null ? (
                            <span className="font-black text-[#00C830]">
                              · {fmtDist(selection.data.distanceMetres)}
                            </span>
                          ) : null}
                        </p>
                      )}
                    </div>
                  </div>

                  {selection.data.bio ? (
                    <p className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] px-3.5 py-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {selection.data.bio}
                    </p>
                  ) : null}

                  {/* BC.Game Actions Row */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <Link
                      href={`/profile/${selection.data.username}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#00C830] transition-colors"
                      onClick={onClose}
                    >
                      <span>View Profile</span>
                      <ArrowRight size={14} />
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
                      className={`flex-1 rounded-2xl py-3 text-xs font-black transition-all active:scale-95 disabled:opacity-50 ${
                        selection.data.isFollowing
                          ? 'border border-black/[0.08] dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                          : 'bg-[#00C830] hover:bg-[#00B52B] text-white shadow-md shadow-[#00C830]/20'
                      }`}
                    >
                      {isActionPending
                        ? '…'
                        : selection.data.isFollowing
                          ? 'Following'
                          : 'Follow Neighbor'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, hsl(${placeHue},65%,32%), hsl(${(placeHue + 30) % 360},75%,20%))`,
                      }}
                    >
                      <Building2 size={28} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {selection.data.lga}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {selection.data.state}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} className="text-[#00C830]" />
                          <span>{selection.data.userCount.toLocaleString()} residents</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart size={12} className="text-rose-500" />
                          <span>
                            {(placeStats?.followerCount ?? selection.data.followerCount).toLocaleString()}{' '}
                            followers
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Game Metric Tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Residents
                      </p>
                      <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
                        {loadingPlaceStats ? '…' : (placeStats?.userCount ?? selection.data.userCount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Followers
                      </p>
                      <p className="mt-0.5 text-base font-black text-[#00C830]">
                        {loadingPlaceStats
                          ? '…'
                          : (placeStats?.followerCount ?? selection.data.followerCount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Posts (7d)
                      </p>
                      <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
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
                    className={`w-full rounded-2xl py-3 text-xs font-black transition-all active:scale-95 disabled:opacity-50 ${
                      selection.data.isFollowing
                        ? 'border border-black/[0.08] dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                        : 'bg-[#00C830] hover:bg-[#00B52B] text-white shadow-md shadow-[#00C830]/20'
                    }`}
                  >
                    {isActionPending
                      ? '…'
                      : selection.data.isFollowing
                        ? 'Following Place'
                        : 'Follow This Place'}
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
