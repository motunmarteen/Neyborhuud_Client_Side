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
}: ChatRoomHeaderProps) {
  return (
    <header
      className={`chat-room__header shrink-0 ${isIncident ? 'chat-room__header--incident' : ''}`}
    >
      <div className="chat-room__header-inner">
        <Link
          href={backHref}
          className="chat-room__back mod-inset"
          aria-label="Back to chats"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>

        <div className="chat-room__identity min-w-0 flex-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="chat-room__avatar neu-avatar h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={`chat-room__avatar neu-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isIncident ? 'bg-red-500/20 text-brand-red/70' : 'bg-primary/15 text-primary'
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
