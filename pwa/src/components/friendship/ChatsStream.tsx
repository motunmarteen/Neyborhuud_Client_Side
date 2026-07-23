'use client';

/**
 * ChatsStream — WhatsApp-style unified Chats list for the Connect hub.
 *
 * Merges conversations (direct + group + community) and recent call records into
 * ONE chronological stream, newest first. Each row shows audio + video call
 * icons that place a call directly via useCall().startCall.
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { useRecentCalls } from '@/hooks/useRecentCalls';
import { useCall } from '@/components/calls/CallProvider';
import { chatThreadPath, isCommunityChat } from '@/lib/chatPaths';
import { formatTimeAgo } from '@/utils/timeAgo';
import type { Conversation } from '@/types/api';
import type { CallRecord } from '@/services/call.service';

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
function convPeer(c: Conversation): { id: string; name: string; avatar?: string | null } | null {
  if (c.type === 'direct' && c.otherParticipant) {
    return { id: c.otherParticipant.id, name: c.otherParticipant.name || c.otherParticipant.username, avatar: c.otherParticipant.avatarUrl };
  }
  return null; // group/community calls not 1-tap from the list
}
function convPreview(c: Conversation): string {
  if (c.lastMessage?.content) return c.lastMessage.content;
  if (isCommunityChat(c)) return 'Community';
  return 'Tap to chat';
}

// ── Call row helpers ────────────────────────────────────────────────────────
function callParty(p: CallRecord['caller']): { id: string; name: string; avatar?: string | null } {
  if (typeof p === 'string') return { id: p, name: 'Neighbour' };
  return {
    id: p._id,
    name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.username || 'Neighbour',
    avatar: p.avatarUrl,
  };
}

/**
 * One row per entity (person or community). A direct chat and that same
 * person's calls collapse into a single row, keyed by conversationId. The row
 * shows whichever activity (message or call) is most recent; the full history
 * lives inside the thread when opened.
 */
type Row = {
  key: string;
  conversationId: string;
  ts: number;
  name: string;
  avatar: string | null;
  isCommunity: boolean;
  peer: { id: string; name: string; avatar?: string | null } | null;
  subtitle: { text: string; icon?: string; danger?: boolean };
};

interface ChatsStreamProps {
  currentUserId?: string;
  search?: string;
}

export function ChatsStream({ currentUserId, search }: ChatsStreamProps) {
  const router = useRouter();
  const { startCall } = useCall();

  const { data: convData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(1, 40),
    staleTime: 30_000,
  });
  const { data: calls, isLoading: loadingCalls } = useRecentCalls(30);

  const conversations: Conversation[] =
    (convData as { data?: { conversations?: Conversation[] } })?.data?.conversations ?? [];

  const rows = useMemo<Row[]>(() => {
    const byKey = new Map<string, Row>();

    // Seed from conversations (DMs, groups, communities).
    for (const c of conversations) {
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
        peer: convPeer(c),
        subtitle: { text: convPreview(c) },
      });
    }

    // Fold calls into the matching conversation row (or create a call-only row).
    for (const call of calls ?? []) {
      const cid = call.conversationId || '';
      const iCalled = currentUserId ? callParty(call.caller).id === currentUserId : false;
      const other = iCalled ? callParty(call.callee) : callParty(call.caller);
      const missedForMe = call.status === 'missed' && !iCalled;
      const ts = new Date(call.startedAt || call.createdAt || 0).getTime();
      const callSubtitle = {
        text: call.type === 'video' ? 'Video call' : 'Voice call',
        icon: missedForMe ? 'call_missed' : iCalled ? 'call_made' : 'call_received',
        danger: missedForMe,
      };

      const existing = cid ? byKey.get(cid) : undefined;
      if (existing) {
        // Only override the subtitle if this call is more recent than the row's activity.
        if (ts >= existing.ts) {
          existing.ts = ts;
          existing.subtitle = callSubtitle;
        }
        if (!existing.peer) existing.peer = other;
      } else {
        const key = cid || `call-${call._id}`;
        byKey.set(key, {
          key,
          conversationId: cid,
          ts,
          name: other.name,
          avatar: other.avatar ?? null,
          isCommunity: false,
          peer: other,
          subtitle: callSubtitle,
        });
      }
    }

    let list = Array.from(byKey.values()).sort((a, b) => b.ts - a.ts);

    const q = search?.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    return list;
  }, [conversations, calls, search, currentUserId]);

  const placeCall = (
    e: React.MouseEvent,
    peer: { id: string; name: string; avatar?: string | null } | null,
    conversationId: string | null,
    type: 'audio' | 'video',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!peer?.id) return;
    void startCall({ peerId: peer.id, peerName: peer.name, peerAvatar: peer.avatar ?? null, conversationId, type });
  };

  if (loadingConvs || loadingCalls) {
    return (
      <div className="divide-y divide-gray-100 bg-white">
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

  if (!rows.length) {
    return (
      <div className="px-4 py-14 text-center">
        <span className="material-symbols-outlined text-3xl text-slate-300">forum</span>
        <p className="mt-2 text-sm font-semibold text-slate-700">No chats yet</p>
        <p className="mt-1 text-xs text-slate-400">Your messages, communities and calls will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {rows.map((row) => (
        <div
          key={row.key}
          onClick={() => row.conversationId && router.push(chatThreadPath(row.conversationId))}
          className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
        >
          <Avatar src={row.avatar} name={row.name} community={row.isCommunity} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate text-[15px] font-semibold ${row.subtitle.danger ? 'text-brand-red' : 'text-slate-800'}`}>
                {row.name}
              </p>
              <span className="shrink-0 text-[11px] text-slate-400">{formatTimeAgo(new Date(row.ts).toISOString())}</span>
            </div>
            <span className={`flex items-center gap-1 truncate text-[13px] ${row.subtitle.danger ? 'text-brand-red' : 'text-slate-500'}`}>
              {row.subtitle.icon ? (
                <span className="material-symbols-outlined text-[15px]">{row.subtitle.icon}</span>
              ) : null}
              {row.subtitle.text}
            </span>
          </div>
          <CallIcons
            disabled={!row.peer}
            onAudio={(e) => placeCall(e, row.peer, row.conversationId || null, 'audio')}
            onVideo={(e) => placeCall(e, row.peer, row.conversationId || null, 'video')}
          />
        </div>
      ))}
    </div>
  );
}

function Avatar({ src, name, community }: { src: string | null; name: string; community?: boolean }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 bg-slate-100 shadow-sm">
      {src ? (
        <Image src={src} alt={name} width={48} height={48} className="h-full w-full object-cover" />
      ) : community ? (
        <span className="material-symbols-outlined text-[22px] text-slate-400">groups</span>
      ) : (
        <span className="text-[16px] font-bold text-slate-400">{name[0]?.toUpperCase() ?? '?'}</span>
      )}
    </div>
  );
}

function CallIcons({
  onAudio,
  onVideo,
  disabled,
}: {
  onAudio: (e: React.MouseEvent) => void;
  onVideo: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  if (disabled) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onAudio}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A555] transition-colors hover:bg-[#00D431]/10 active:scale-90"
        aria-label="Audio call"
      >
        <span className="material-symbols-outlined text-[20px]">call</span>
      </button>
      <button
        type="button"
        onClick={onVideo}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A555] transition-colors hover:bg-[#00D431]/10 active:scale-90"
        aria-label="Video call"
      >
        <span className="material-symbols-outlined text-[20px]">videocam</span>
      </button>
    </div>
  );
}
