'use client';

import Link from 'next/link';

export type ChatRoomHeaderProps = {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  isIncident?: boolean;
  encrypted?: boolean;
  showKeyPanel?: boolean;
  onToggleKeys?: () => void;
  backHref?: string;
  /** When provided, the back control runs this (smart history-aware back) instead of navigating to backHref. */
  onBack?: () => void;
  /** When provided, shows an "invite a guest" (incognito) action. */
  onInviteGuest?: () => void;
  /** When provided, tapping the community name/avatar opens the info sheet. */
  onCommunityInfo?: () => void;
  /** When provided, shows an audio-call button (direct 1-on-1 chats). */
  onAudioCall?: () => void;
  /** When provided, shows a video-call button (direct 1-on-1 chats). */
  onVideoCall?: () => void;
  /** Disables call buttons (e.g. while a call is already in progress). */
  callDisabled?: boolean;
};

export function ChatRoomHeader({
  displayName,
  subtitle,
  avatarUrl,
  avatarInitials = '💬',
  isIncident = false,
  encrypted = true,
  showKeyPanel = false,
  onToggleKeys,
  backHref = '/chat',
  onBack,
  onInviteGuest,
  onCommunityInfo,
  onAudioCall,
  onVideoCall,
  callDisabled = false,
}: ChatRoomHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto flex w-full max-w-[600px] px-1 h-14 items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          </button>
        ) : (
          <Link
            href={backHref}
            className="flex text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Back to chats"
          >
            <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          </Link>
        )}

        <div
          className={`flex min-w-0 flex-1 items-center gap-3 ${onCommunityInfo ? 'cursor-pointer active:opacity-70' : ''}`}
          onClick={onCommunityInfo}
          role={onCommunityInfo ? 'button' : undefined}
          tabIndex={onCommunityInfo ? 0 : undefined}
          onKeyDown={onCommunityInfo ? (e) => { if (e.key === 'Enter') onCommunityInfo(); } : undefined}
          aria-label={onCommunityInfo ? 'Community info' : undefined}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                isIncident ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}
              aria-hidden
            >
              {avatarInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-gray-900">
              {displayName}
            </p>
            {subtitle ? (
              <p className="truncate text-xs font-medium text-gray-500">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {onInviteGuest ? (
            <button
              type="button"
              onClick={onInviteGuest}
              className="flex text-gray-500 hover:text-gray-700 transition-colors"
              title="Invite a guest"
              aria-label="Invite a guest for a limited time"
            >
              <span className="material-symbols-outlined text-[22px]">person_add</span>
            </button>
          ) : null}
          {onAudioCall ? (
            <button
              type="button"
              onClick={onAudioCall}
              disabled={callDisabled}
              className="flex text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
              title="Audio call"
              aria-label="Start audio call"
            >
              <span className="material-symbols-outlined text-[22px]">call</span>
            </button>
          ) : null}
          {onVideoCall ? (
            <button
              type="button"
              onClick={onVideoCall}
              disabled={callDisabled}
              className="flex text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
              title="Video call"
              aria-label="Start video call"
            >
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
