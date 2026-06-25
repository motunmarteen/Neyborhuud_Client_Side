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
    <header
      className={`chat-room__header shrink-0 ${isIncident ? 'chat-room__header--incident' : ''}`}
    >
      <div className="chat-room__header-inner">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="chat-room__back mod-inset"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
        ) : (
          <Link
            href={backHref}
            className="chat-room__back mod-inset"
            aria-label="Back to chats"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
        )}

        <div
          className={`chat-room__identity min-w-0 flex-1 ${onCommunityInfo ? 'cursor-pointer active:opacity-70' : ''}`}
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
              className="chat-room__avatar neu-avatar h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={`chat-room__avatar neu-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isIncident ? 'bg-status-danger/15 text-status-danger/70' : 'bg-primary/15 text-primary'
              }`}
              aria-hidden
            >
              {avatarInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              {displayName}
            </p>
            {subtitle ? (
              <p className="truncate text-xs text-[var(--neu-text-muted)]">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onInviteGuest ? (
            <button
              type="button"
              onClick={onInviteGuest}
              className="chat-room__keys mod-inset"
              title="Invite a guest"
              aria-label="Invite a guest for a limited time"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </button>
          ) : null}
          {onAudioCall ? (
            <button
              type="button"
              onClick={onAudioCall}
              disabled={callDisabled}
              className="chat-room__keys mod-inset disabled:opacity-40"
              title="Audio call"
              aria-label="Start audio call"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </button>
          ) : null}
          {onVideoCall ? (
            <button
              type="button"
              onClick={onVideoCall}
              disabled={callDisabled}
              className="chat-room__keys mod-inset disabled:opacity-40"
              title="Video call"
              aria-label="Start video call"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </button>
          ) : null}
          {encrypted && !isIncident ? (
            <span className="chat-room__trust mod-chip hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline-flex">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              Secured
            </span>
          ) : null}
          {onToggleKeys ? (
            <button
              type="button"
              onClick={onToggleKeys}
              className={`chat-room__keys mod-inset ${showKeyPanel ? 'chat-room__keys--active' : ''}`}
              title="Encryption keys"
              aria-label="View encryption keys"
              aria-pressed={showKeyPanel}
            >
              <span className="material-symbols-outlined text-[20px]">encrypted</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
