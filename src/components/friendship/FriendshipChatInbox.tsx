'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import socketService from '@/lib/socket';
import type { Conversation } from '@/types/api';

function getDisplayName(c: Conversation): string {
  if (c.type === 'incident') return '🚨 Emergency Chat';
  if (c.type === 'community') return '🏘️ Community Chat';
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
  if (c.type === 'group') return c.name || c.groupName || 'Group Chat';
  if (c.otherParticipant) {
    return c.otherParticipant.name || c.otherParticipant.username || 'Direct Message';
  }
  return 'Direct Message';
}

function getAvatarUrl(c: Conversation): string | null {
  if (c.contextType === 'marketplace' && c.context?.productThumbnail) {
    return c.context.productThumbnail;
  }
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
  if (c.type === 'community') return '🏘️';
  if (c.contextType === 'marketplace') return '🛍️';
  if (c.contextType === 'jobs') return '💼';
  if (c.type === 'group') return '👥';
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
    <div className="divide-y divide-gray-100 animate-pulse bg-white">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded-full bg-slate-100" />
            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center bg-white px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-slate-50">
        <span className="material-symbols-outlined fill-1 text-[32px] text-[#00D431]">chat</span>
      </div>
      <h3 className="mb-1 text-sm font-bold text-slate-800">No conversations yet</h3>
      <p className="max-w-xs text-xs leading-relaxed text-slate-500">
        Message a friend from your followers list to start chatting.
      </p>
    </div>
  );
}

type FriendshipChatInboxProps = {
  searchQuery?: string;
  hideSearchBar?: boolean;
};

/** Chats tab UI from Friendship — conversation search + list only. */
export function FriendshipChatInbox({
  searchQuery: searchQueryProp,
  hideSearchBar = false,
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
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        getDisplayName(c).toLowerCase().includes(q) ||
        (c.otherParticipant?.username || '').toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div className="flex flex-col bg-white">
      {!hideSearchBar && (
        <div className="border-b border-gray-100 px-4 pb-3 pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="search"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#00D431] focus:outline-none focus:ring-1 focus:ring-[#00D431]"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <ChatListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <div className="divide-y divide-gray-100 bg-white">
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
                href={`/messages/${cid}`}
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 transition-colors duration-150 hover:bg-slate-50"
              >
                {url ? (
                  <img
                    src={url}
                    alt={displayName}
                    className="h-12 w-12 rounded-full border border-slate-100 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00D431]/10 text-sm font-bold text-[#00D431]">
                    {getInitials(c)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                    {lastTime && <span className="text-xs text-slate-400">{timeAgo(lastTime)}</span>}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="max-w-[200px] truncate text-xs text-slate-500">
                      {lastMsg ? (lastMsg.isDeleted ? 'Message deleted' : lastMsg.content) : 'No messages yet'}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00D431] px-1 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
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
