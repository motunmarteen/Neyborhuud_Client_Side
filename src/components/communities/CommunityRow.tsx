'use client';

import Link from 'next/link';
import type { HubCommunity } from '@/types/hubCommunity';

const ACTIVITY_TONE: Record<HubCommunity['activityLevel'], string> = {
  High: 'text-green-600',
  Moderate: 'text-amber-600',
  Low: 'text-[var(--neu-text-muted)]',
};

type CommunityRowProps = {
  community: HubCommunity;
  joined: boolean;
  onJoin: (id: string) => void;
  joinPending?: boolean;
};

export function CommunityRow({
  community,
  joined,
  onJoin,
  joinPending = false,
}: CommunityRowProps) {
  const chatHref = community.conversationId
    ? `/chat/${community.conversationId}`
    : `/communities/${community.id}`;

  return (
    <div className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-black/[0.02]">
      <Link
        href={`/communities/${community.id}`}
        className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary no-underline"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={joined ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {community.icon}
        </span>
      </Link>

      <Link href={`/communities/${community.id}`} className="min-w-0 flex-1 no-underline">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
            {community.name}
          </p>
          <span className="mod-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
            {community.categoryLabel}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--neu-text-muted)]">
          {community.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[var(--neu-text-muted)]">
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">group</span>
            {community.membersCount.toLocaleString()} members
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span className={ACTIVITY_TONE[community.activityLevel]}>
              {community.activityLevel} activity
            </span>
          </span>
        </div>
      </Link>

      {joined ? (
        <Link
          href={chatHref}
          className="mod-chip mod-chip-active mt-0.5 inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline"
        >
          Chat
        </Link>
      ) : (
        <button
          type="button"
          disabled={joinPending}
          onClick={(e) => {
            e.preventDefault();
            onJoin(community.id);
          }}
          className="mod-chip mod-chip-active mt-0.5 inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-50"
        >
          {joinPending ? '…' : 'Join'}
        </button>
      )}
    </div>
  );
}
