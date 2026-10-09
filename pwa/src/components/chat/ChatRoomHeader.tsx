'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Phone, Video, UserPlus, Info } from 'lucide-react';

export type ChatRoomHeaderProps = {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  isIncident?: boolean;
  showKeyPanel?: boolean;
  onToggleKeys?: () => void;
  backHref?: string;
  /** When provided, the back control runs this (smart history-aware back) instead of navigating to backHref. */
  onBack?: () => void;
  /** When provided, shows an "invite a guest" (incognito) action. */
  onInviteGuest?: () => void;
  /** When provided, tapping the community name/avatar opens the info sheet. */
  onCommunityInfo?: () => void;
  /** When provided, shows voice call action. */
  onAudioCall?: () => void;
  /** When provided, shows video call action. */
  onVideoCall?: () => void;
};

export function ChatRoomHeader({
  displayName,
  subtitle,
  avatarUrl,
  avatarInitials = '💬',
  isIncident = false,
  showKeyPanel = false,
  onToggleKeys,
  backHref = '/chat',
  onBack,
  onInviteGuest,
  onCommunityInfo,
  onAudioCall,
  onVideoCall,
}: ChatRoomHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-2xl border-b border-black/[0.06] shadow-xs select-none">
      <div className="mx-auto flex w-full max-w-[600px] px-2 sm:px-3 h-14 items-center justify-between gap-2 sm:gap-3">
        {/* Back Button */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
        ) : (
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            aria-label="Back to chats"
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </Link>
        )}

        {/* Conversation Identity Pill */}
        <div
          className={`flex min-w-0 flex-1 items-center gap-2.5 ${
            onCommunityInfo ? 'cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all' : ''
          }`}
          onClick={onCommunityInfo}
          role={onCommunityInfo ? 'button' : undefined}
          tabIndex={onCommunityInfo ? 0 : undefined}
          onKeyDown={onCommunityInfo ? (e) => { if (e.key === 'Enter') onCommunityInfo(); } : undefined}
          aria-label={onCommunityInfo ? 'Community info' : undefined}
        >
          {avatarUrl ? (
            <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-black/[0.08] shadow-xs">
              <Image
                src={avatarUrl}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-xs border ${
                isIncident
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              aria-hidden
            >
              {avatarInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] sm:text-[15px] font-bold tracking-tight text-slate-900 leading-snug">
              {displayName}
            </p>
            {subtitle ? (
              <p className="truncate text-xs font-medium text-slate-500 leading-none mt-0.5">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right-Side Action Cluster */}
        <div className="flex shrink-0 items-center gap-1">
          {onAudioCall ? (
            <button
              type="button"
              onClick={onAudioCall}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A827] hover:bg-emerald-50 active:scale-90 transition-all cursor-pointer"
              title="Voice Call"
              aria-label="Start voice call"
            >
              <Phone size={19} strokeWidth={2.2} />
            </button>
          ) : null}

          {onVideoCall ? (
            <button
              type="button"
              onClick={onVideoCall}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A827] hover:bg-emerald-50 active:scale-90 transition-all cursor-pointer"
              title="Video Call"
              aria-label="Start video call"
            >
              <Video size={20} strokeWidth={2.2} />
            </button>
          ) : null}

          {onInviteGuest ? (
            <button
              type="button"
              onClick={onInviteGuest}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
              title="Invite a guest"
              aria-label="Invite a guest for a limited time"
            >
              <UserPlus size={19} strokeWidth={2.2} />
            </button>
          ) : null}

          {onCommunityInfo && !onAudioCall && !onVideoCall ? (
            <button
              type="button"
              onClick={onCommunityInfo}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
              title="Community Details"
              aria-label="Community details"
            >
              <Info size={19} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
