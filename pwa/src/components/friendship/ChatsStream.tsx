'use client';

/**
 * ChatsStream — WhatsApp-style unified Chats list for the Connect hub.
 *
 * Merges conversations (direct + group + community) into ONE chronological
 * stream, newest first.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare, Phone, Video, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { chatService } from '@/services/chat.service';
import { chatThreadPath, isCommunityChat } from '@/lib/chatPaths';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useCall } from '@/contexts/CallContext';
import { toast } from '@/lib/toast';
import type { Conversation } from '@/types/api';

// ── Conversation row helpers (mirrors FriendshipChatInbox) ──────────────────
function convDisplayName(c: Conversation): string {
  if (c.type === 'incident') return '🚨 Emergency Chat';
  if (isCommunityChat(c)) return c.name || c.groupName || 'Community';
  if (c.otherParticipant) return c.otherParticipant.name || c.otherParticipant.username || 'Direct Message';
  return c.name || c.groupName || 'Direct Message';
}
function convAvatar(c: Conversation): string | null {
  if (isCommunityChat(c) && c.imageUrl) return c.imageUrl;
  if (c.type === 'direct' && c.otherParticipant?.avatarUrl) return c.otherParticipant.avatarUrl;
  return null;
}
function convCid(c: Conversation): string {
  return (c as any).conversationId ?? (c as any)._id ?? c.id ?? '';
}
function convPreview(c: Conversation): string {
  if (c.lastMessage?.content) return c.lastMessage.content;
  if (isCommunityChat(c)) return 'Community';
  return 'Tap to chat';
}

/** One row per entity (person or community), keyed by conversationId. */
type Row = {
  key: string;
  conversationId: string;
  ts: number;
  name: string;
  avatar: string | null;
  isCommunity: boolean;
  isVerified?: boolean;
  unreadCount?: number;
  subtitle: { text: string; icon?: string; danger?: boolean };
};

const DEMO_CONVERSATIONS: Row[] = [
  {
    key: 'demo-neighbor',
    conversationId: 'demo-neighbor',
    ts: Date.now() - 5 * 60 * 1000,
    name: 'Fatima Abdullahi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isCommunity: false,
    isVerified: true,
    unreadCount: 1,
    subtitle: { text: 'Good morning! The gate security has verified your visitor pass.' },
  },
  {
    key: 'demo-marketplace',
    conversationId: 'demo-marketplace',
    ts: Date.now() - 25 * 60 * 1000,
    name: 'Kunle Balogun · P2P Deal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isCommunity: false,
    isVerified: true,
    unreadCount: 2,
    subtitle: { text: '🤝 Deal Offer: Yamaha Generator 2.8kVA for ₦185,000' },
  },
  {
    key: 'demo-estate',
    conversationId: 'demo-estate',
    ts: Date.now() - 2 * 3600 * 1000,
    name: 'Victoria Garden City (VGC) Hub',
    avatar: null,
    isCommunity: true,
    isVerified: true,
    subtitle: { text: '📢 Notice: Estate transformer inspection scheduled today.' },
  },
  {
    key: 'demo-security',
    conversationId: 'demo-security',
    ts: Date.now() - 5 * 3600 * 1000,
    name: 'Estate Rapid Response Patrol',
    avatar: null,
    isCommunity: false,
    subtitle: { text: '🚨 Night security patrol protocol active across Avenue 2 & 4.', danger: true },
  },
];

type InboxFilter = 'all' | 'chats' | 'groups';
const INBOX_FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'chats', label: 'Chats' },
  { id: 'groups', label: 'Groups' },
];

interface ChatsStreamProps {
  currentUserId?: string;
  search?: string;
}

export function ChatsStream({ currentUserId, search }: ChatsStreamProps) {
  const router = useRouter();
  const { simulateIncomingCall, simulateActiveCall } = useCall();
  const [filter, setFilter] = useState<InboxFilter>('all');

  const { data: convData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations({ limit: 40 }),
    staleTime: 30_000,
  });

  const rawConversations: Conversation[] =
    (convData as { data?: { conversations?: Conversation[] } })?.data?.conversations ?? [];

  const rows = useMemo<Row[]>(() => {
    const byKey = new Map<string, Row>();

    // Seed from real conversations (DMs, groups, communities)
    for (const c of rawConversations) {
      const cid = convCid(c);
      if (!cid) continue;
      const ts = new Date(c.lastMessageAt || c.updatedAt || c.createdAt || 0).getTime();
      byKey.set(cid, {
        key: cid,
        conversationId: cid,
        ts,
        name: convDisplayName(c),
        avatar: convAvatar(c),
        isCommunity: isCommunityChat(c),
        isVerified: !!c.otherParticipant?.isVerified,
        unreadCount: (c as any).unreadCount || 0,
        subtitle: { text: convPreview(c) },
      });
    }

    // If account has no active conversations, populate demo conversations for live testing
    if (byKey.size === 0) {
      for (const d of DEMO_CONVERSATIONS) {
        byKey.set(d.key, d);
      }
    }

    let list = Array.from(byKey.values()).sort((a, b) => b.ts - a.ts);

    const q = search?.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    return list;
  }, [rawConversations, search]);

  const unreadIn = (pick: (r: Row) => boolean) =>
    rows.filter(pick).reduce((n, r) => n + (r.unreadCount ?? 0), 0);
  const unreadByFilter: Record<InboxFilter, number> = {
    all: unreadIn(() => true),
    chats: unreadIn((r) => !r.isCommunity),
    groups: unreadIn((r) => !!r.isCommunity),
  };
  const visibleRows =
    filter === 'all' ? rows : rows.filter((r) => (filter === 'groups' ? r.isCommunity : !r.isCommunity));

  if (loadingConvs) {
    return (
      <div className="divide-y divide-black/[0.04] bg-white">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
            <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded-full bg-slate-100" />
              <div className="h-3 w-1/2 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* ── Phase 3 Live Test Suite Bar ── */}
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Phase 3 Live Test Suite</span>
          </div>
          <Link
            href="/chat/test-views"
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline flex items-center gap-0.5"
          >
            Open Test Lab →
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => simulateIncomingCall({ name: 'Fatima Abdullahi', huud: 'Lekki Phase 1 · Resident' }, 'audio')}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-50 active:scale-95 transition-transform"
          >
            <Phone size={12} className="text-emerald-600" /> Ring Phone (Modal)
          </button>
          <button
            type="button"
            onClick={() => simulateActiveCall({ name: 'Fatima Abdullahi', huud: 'Lekki Phase 1' }, 'video')}
            className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-white px-2.5 py-1 text-xs font-bold text-teal-800 shadow-2xs hover:bg-teal-50 active:scale-95 transition-transform"
          >
            <Video size={12} className="text-teal-600" /> WebRTC PiP Call
          </button>
          <button
            type="button"
            onClick={() => router.push('/chat/demo-marketplace')}
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-95 transition-transform"
          >
            <ShoppingBag size={12} className="text-amber-600" /> P2P Deal Handshake
          </button>
        </div>
      </div>

      {/* ── Chats / Groups tabs ── */}
      <div role="tablist" aria-label="Filter conversations" className="flex gap-2 border-b border-black/[0.04] bg-white px-4 py-2.5">
        {INBOX_FILTERS.map((t) => {
          const active = filter === t.id;
          const unread = unreadByFilter[t.id];
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                active ? 'bg-[#00C830] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
              {unread > 0 && (
                <span className={`min-w-[18px] rounded-full px-1 text-[10px] leading-[18px] ${active ? 'bg-white/25 text-white' : 'bg-[#00C830] text-white'}`}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Conversation Stream ── */}
      <div className="divide-y divide-black/[0.04] bg-white">
        {visibleRows.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] font-medium text-slate-400">
            {filter === 'groups' ? 'No group chats yet' : filter === 'chats' ? 'No direct chats yet' : 'No conversations yet'}
          </p>
        )}
        {visibleRows.map((row) => (
          <div
            key={row.key}
            onClick={() => row.conversationId && router.push(chatThreadPath(row.conversationId))}
            className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-all hover:bg-slate-50/80 active:bg-slate-100/70"
          >
            <Avatar src={row.avatar} name={row.name} community={row.isCommunity} isVerified={row.isVerified} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <p className={`truncate text-[15px] font-bold tracking-tight ${row.subtitle.danger ? 'text-rose-600' : 'text-slate-900'}`}>
                    {row.name}
                  </p>
                  {row.isVerified && (
                    <ShieldCheck size={14} className="text-[#00C830] shrink-0 fill-[#00C830]/10" />
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-medium text-slate-400">{formatTimeAgo(new Date(row.ts).toISOString())}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={`truncate text-[13px] font-medium leading-snug ${row.subtitle.danger ? 'text-rose-600' : 'text-slate-500'}`}>
                  {row.subtitle.text}
                </p>
                {row.unreadCount != null && row.unreadCount > 0 && (
                  <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-[#00C830] px-1 text-[10px] font-bold text-white shadow-xs">
                    {row.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({
  src,
  name,
  community,
  isVerified,
}: {
  src: string | null;
  name: string;
  community?: boolean;
  isVerified?: boolean;
}) {
  return (
    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-slate-100 shadow-2xs ${
      isVerified ? 'border-[#00C830]/60 ring-2 ring-[#00C830]/20' : 'border-black/[0.08]'
    }`}>
      {src ? (
        <Image src={src} alt={name} width={48} height={48} className="h-full w-full object-cover" />
      ) : community ? (
        <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
          <Users size={22} strokeWidth={2.2} />
        </div>
      ) : (
        <span className="text-[15px] font-bold text-slate-600">{name[0]?.toUpperCase() ?? '?'}</span>
      )}
    </div>
  );
}
