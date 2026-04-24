'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { chatService } from '@/services/chat.service';
import { searchService } from '@/services/search.service';
import { Conversation } from '@/types/api';
import socketService from '@/lib/socket';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCid(c: Conversation): string {
  return (c as any).conversationId ?? (c as any)._id ?? c.id ?? '';
}

function getDisplayName(c: Conversation): string {
  if (c.type === 'incident') return '🚨 Emergency Chat';
  if (c.type === 'community') return '🏘️ Community Chat';
  if (c.type === 'group') return c.name || c.groupName || 'Group Chat';
  if (c.otherParticipant) {
    return c.otherParticipant.name || c.otherParticipant.username || 'Direct Message';
  }
  return 'Direct Message';
}

function getAvatarUrl(c: Conversation): string | null {
  if (c.type === 'direct' && c.otherParticipant?.avatarUrl) return c.otherParticipant.avatarUrl;
  return null;
}

function getInitials(c: Conversation): string {
  if (c.type === 'incident') return '🚨';
  if (c.type === 'community') return '🏘️';
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

// ─── Avatar Component ─────────────────────────────────────────────────────────

function ConvAvatar({ conv }: { conv: Conversation }) {
  const url = getAvatarUrl(conv);
  const initials = getInitials(conv);
  const isEmoji = !initials.match(/^[A-Z]/);
  const isIncident = conv.type === 'incident';

  if (url) {
    return <img src={url} alt={getDisplayName(conv)} className="h-12 w-12 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold ${
      isIncident ? 'bg-red-900/70 text-red-200' : isEmoji ? 'bg-gray-700 text-xl' : 'bg-blue-700 text-sm text-white'
    }`}>
      {initials}
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchService.searchUsers(query.trim(), 1, 10);
        // Backend shape: { results: { users: { data: [...] } } }
        const payload = res.data as any;
        const raw =
          payload?.results?.users?.data ??  // globalSearch response (type=users)
          payload?.users?.data ??
          payload?.results ??
          payload?.items ??
          payload?.data ??
          [];
        const users = Array.isArray(raw) ? raw.map((r: any) => (r.type === 'user' ? r.data : r)) : [];
        setResults(users);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const startChat = async (userId: string) => {
    if (startingId) return;
    setStartingId(userId);
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      const conv = (res.data as any)?.conversation ?? (res.data as any);
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) { onClose(); router.push(`/messages/${convId}`); }
    } catch { setStartingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">New Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg leading-none">✕</button>
        </div>
        <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people…" className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
        <div className="mt-3 flex max-h-72 flex-col overflow-y-auto">
          {searching && <p className="py-4 text-center text-sm text-gray-400">Searching…</p>}
          {!searching && query.trim() && results.length === 0 && <p className="py-4 text-center text-sm text-gray-400">No users found.</p>}
          {!searching && results.map((u) => {
            const uid = u._id ?? u.id;
            return (
              <button key={uid} onClick={() => startChat(uid)} disabled={!!startingId} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-800 disabled:opacity-60">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">
                    {(u.name || u.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-200">{u.name || u.username}</p>
                  {u.name && u.username && <p className="truncate text-xs text-gray-500">@{u.username}</p>}
                </div>
                {startingId === uid && <span className="ml-auto text-xs text-blue-400">Opening…</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
    staleTime: 30_000,
  });

  const conversations: Conversation[] = (data as any)?.data?.conversations ?? [];

  // Refresh list when a new message arrives via socket
  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['conversations'] });
    socketService.on('message:new', handler);
    socketService.on('message:priority', handler);
    return () => {
      socketService.off('message:new', handler);
      socketService.off('message:priority', handler);
    };
  }, [queryClient]);

  const filtered = conversations.filter((c) =>
    getDisplayName(c).toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const ta = a.lastMessageAt ?? (a.lastMessage?.createdAt) ?? a.createdAt ?? '';
    const tb = b.lastMessageAt ?? (b.lastMessage?.createdAt) ?? b.createdAt ?? '';
    return tb.localeCompare(ta);
  });

  return (
    <>
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}

      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />

          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pb-24">

              {/* Header */}
              <div className="flex items-center justify-between rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-card)] p-4">
                <div>
                  <h1 className="text-xl font-bold text-[var(--neu-text)]">Messages</h1>
                  <p className="mt-0.5 text-sm text-[var(--neu-text-muted)]">Your conversations</p>
                </div>
                <button
                  onClick={() => setShowNewChat(true)}
                  title="New message"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-xl border border-[var(--neu-border)] bg-[var(--neu-card)] px-4 py-2.5 text-sm text-[var(--neu-text)] placeholder-[var(--neu-text-muted)] focus:border-blue-500 focus:outline-none"
              />

              {/* List */}
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--neu-card)]" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-card)] p-10 text-center">
                  <p className="mb-2 text-4xl">💬</p>
                  <p className="text-sm text-[var(--neu-text-muted)]">
                    {search ? 'No conversations match your search.' : 'No conversations yet.'}
                  </p>
                  {!search && (
                    <button onClick={() => setShowNewChat(true)} className="mt-3 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500">
                      Start a conversation
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sorted.map((conv) => {
                    const id = getCid(conv);
                    const isIncident = conv.type === 'incident';
                    const lastMsg = conv.lastMessage;
                    const lastTime = conv.lastMessageAt ?? lastMsg?.createdAt ?? conv.createdAt;

                    return (
                      <Link
                        key={id}
                        href={`/messages/${id}`}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
                          isIncident
                            ? 'border-red-800/60 bg-red-950/20 hover:bg-red-950/35'
                            : 'border-[var(--neu-border)] bg-[var(--neu-card)] hover:brightness-110'
                        }`}
                      >
                        <ConvAvatar conv={conv} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-sm font-semibold ${isIncident ? 'text-red-200' : 'text-[var(--neu-text)]'}`}>
                              {getDisplayName(conv)}
                              {conv.isMuted && <span className="ml-1.5 text-xs opacity-50">🔇</span>}
                              {conv.isPinned && <span className="ml-1 text-xs text-yellow-400">📌</span>}
                            </p>
                            {lastTime && (
                              <span className="shrink-0 text-xs text-[var(--neu-text-muted)]">{timeAgo(lastTime)}</span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-[var(--neu-text-muted)]">
                              {lastMsg
                                ? lastMsg.isDeleted ? 'Message deleted'
                                  : lastMsg.type !== 'text' ? `📎 ${lastMsg.type}`
                                  : lastMsg.content
                                : 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                          </div>

                          {conv.otherParticipant?.username && (
                            <p className="mt-0.5 truncate text-[11px] text-[var(--neu-text-muted)] opacity-60">
                              @{conv.otherParticipant.username}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    </>
  );
}
