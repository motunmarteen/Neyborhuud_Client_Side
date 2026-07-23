'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import socketService from '@/lib/socket';
import type { Conversation } from '@/types/api';
import { isCommunityChat } from '@/lib/chatPaths';

function getDisplayName(c: Conversation): string {
  if (c.type === 'incident') return '🚨 Emergency Chat';
  if (isCommunityChat(c)) return c.name || c.groupName || '🏘️ Community';
  if (c.contextType === 'marketplace') {
    return (
      c.context?.productTitle ||
      c.contextLabel ||
      c.otherParticipant?.name ||
      c.otherParticipant?.username ||
      'Marketplace Chat'
    );
  }
  if (c.contextType === 'jobs') {
    return (
      c.context?.jobTitle ||
      c.contextLabel ||
      c.otherParticipant?.name ||
      c.otherParticipant?.username ||
      'Job Chat'
    );
  }
  if (c.otherParticipant) {
    return c.otherParticipant.name || c.otherParticipant.username || 'Direct Message';
  }
  return 'Direct Message';
}

function getAvatarUrl(c: Conversation): string | null {
  if (c.contextType === 'marketplace' && c.context?.productThumbnail) {
    return c.context.productThumbnail;
  }
  if (isCommunityChat(c) && c.imageUrl) return c.imageUrl;
  if (c.type === 'direct' && c.otherParticipant?.avatarUrl) return c.otherParticipant.avatarUrl;
  return null;
}

function getCid(c: Conversation): string {
  return (c as Conversation & { conversationId?: string; _id?: string }).conversationId
    ?? (c as Conversation & { _id?: string })._id
    ?? c.id
    ?? '';
}

function getInitials(c: Conversation): string {
  if (c.type === 'incident') return '🚨';
  if (isCommunityChat(c)) return '🏘️';
  if (c.contextType === 'marketplace') return '🛍️';
  if (c.contextType === 'jobs') return '💼';
  if (c.otherParticipant) {
    const n = c.otherParticipant.name || c.otherParticipant.username || '?';
    return n.slice(0, 2).toUpperCase();
  }
  return '💬';
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function ChatListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mod-card flex h-[4.5rem] items-center gap-3 rounded-2xl px-3" />
      ))}
    </div>
  );
}

function ChatEmptyState({ filter }: { filter: InboxFilter }) {
  const isCommunities = filter === 'communities';
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mod-inset mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isCommunities ? 'groups' : 'chat'}
        </span>
      </div>
      <h3 className="mb-1 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
        {isCommunities ? 'No community chats yet' : 'No conversations yet'}
      </h3>
      <p className="max-w-xs text-xs leading-relaxed text-[var(--neu-text-muted)]">
        {isCommunities
          ? 'Create or join a community to start a group chat, or tap Browse to discover hubs near you.'
          : 'Message a friend from your followers list to start chatting.'}
      </p>
      {isCommunities ? (
        <Link
          href="/communities"
          className="mod-chip mod-chip-active mt-4 rounded-full px-4 py-2 text-xs font-bold text-primary no-underline"
        >
          Browse communities
        </Link>
      ) : null}
    </div>
  );
}

type InboxFilter = 'all' | 'direct' | 'communities';

function matchesFilter(c: Conversation, filter: InboxFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'direct') return c.type === 'direct';
  if (filter === 'communities') return isCommunityChat(c);
  return true;
}

type FriendshipChatInboxProps = {
  searchQuery?: string;
  hideSearchBar?: boolean;
  inboxFilter?: InboxFilter;
};

/** Chats tab UI from Friendship — conversation search + list only. */
export function FriendshipChatInbox({
  searchQuery: searchQueryProp,
  hideSearchBar = false,
  inboxFilter = 'all',
}: FriendshipChatInboxProps = {}) {
  const queryClient = useQueryClient();
  const [internalSearch, setInternalSearch] = useState('');
  const search = searchQueryProp ?? internalSearch;

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
    staleTime: 30_000,
  });

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['conversations'] });
    socketService.on('message:new', handler);
    socketService.on('message:priority', handler);
    return () => {
      socketService.off('message:new', handler);
      socketService.off('message:priority', handler);
    };
  }, [queryClient]);

  const conversations: Conversation[] = (conversationsData as { data?: { conversations?: Conversation[] } })?.data?.conversations ?? [];

  const filtered = useMemo(() => {
    let list = conversations.filter((c) => matchesFilter(c, inboxFilter));
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        getDisplayName(c).toLowerCase().includes(q) ||
        (c.otherParticipant?.username || '').toLowerCase().includes(q),
    );
  }, [conversations, search, inboxFilter]);

  return (
    <div className="flex flex-col">
      {!hideSearchBar && (
        <div className="px-4 pb-3">
          <div className="mod-inset relative rounded-2xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--neu-text-muted)]">
              search
            </span>
            <input
              type="search"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-2xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-[var(--neu-text)] placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <ChatListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <ChatEmptyState filter={inboxFilter} />
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {filtered.map((c, index) => {
            const cid = getCid(c);
            if (!cid) return null;
            const lastMsg = c.lastMessage;
            const lastTime = c.lastMessageAt ?? lastMsg?.createdAt ?? c.createdAt;
            const displayName = getDisplayName(c);
            const url = getAvatarUrl(c);

            return (
              <Link
                key={cid || `conv-${index}`}
                href={`/chat/${cid}`}
                className="mod-card mod-card-hover flex items-center gap-3 rounded-2xl p-3 no-underline transition-opacity"
              >
                {url ? (
                  <Image
                    src={url}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="neu-avatar h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="mod-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(c)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                      {displayName}
                    </p>
                    {lastTime ? (
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--neu-text-muted)]">
                        {timeAgo(lastTime)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="max-w-[200px] truncate text-xs text-[var(--neu-text-muted)]">
                      {lastMsg ? (lastMsg.isDeleted ? 'Message deleted' : lastMsg.content) : 'No messages yet'}
                    </p>
                    {c.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
