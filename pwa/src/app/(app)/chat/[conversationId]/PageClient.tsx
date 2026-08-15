'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { navigateBack } from '@/lib/navigateBack';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatRoomLayout } from '@/components/chat/ChatRoomLayout';
import { ChatThreadPlaceholder } from '@/components/chat/ChatThreadPlaceholder';
import { isMineMessage } from '@/lib/chatMessage';
import {
  applyPeerDeliveredReceipt,
  applyPeerReadReceipt,
  enrichMessageReceipt,
  enrichMessagesReceipts,
  getOutgoingReadLabel,
  resolvePeerUserId,
} from '@/lib/chatReceipts';
import { normalizeChatId } from '@/lib/chatMessage';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chat.service';
import { e2eeService } from '@/services/e2ee.service';
import { ChatMessage, ChatMessageType, Conversation } from '@/types/api';
import socketService from '@/lib/socket';
import { toast } from 'sonner';
import ChatMessageCard from '@/components/chat/ChatMessageCard';
import {
  resolveChatSenderLabel,
  shouldShowSenderLabel,
} from '@/lib/chatSender';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { IncognitoInviteSheet } from '@/components/chat/IncognitoInviteSheet';
import { MentionInvitePicker } from '@/components/chat/MentionInvitePicker';
import { GuestCountdownBanner } from '@/components/chat/GuestCountdownBanner';
import { CommunityInfoSheet } from '@/components/chat/CommunityInfoSheet';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { convAvatarMeta, convDisplayName, convSubtitle } from '@/lib/chatDisplay';
import type { ActionResult } from '@/components/chat/ChatActionMenu';
import { getGeolocation } from '@/lib/nativeGeolocation';
import { unwrapApiData } from '@/lib/apiPayload';
import { CommunityChatBanner } from '@/components/communities/CommunityChatBanner';
import { isCommunityChat } from '@/lib/chatPaths';
import { useProduct } from '@/hooks/useMarketplace';
import {
  getOfferPillClass,
  getOfferSystemMessage,
  getOfferToast,
  parseLegacyOfferMessage,
  resolveOfferRole,
  type OfferRole,
} from '@/lib/marketplaceMessages';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msgId(m: ChatMessage): string {
  return (m as any)._id ?? m.id ?? m.clientMessageId ?? '';
}

function formatChatDateLabel(dt: Date, useLocale: boolean): string {
  if (!useLocale) {
    return dt.toISOString().slice(0, 10);
  }
  const today = new Date();
  const sameDay =
    dt.getFullYear() === today.getFullYear() &&
    dt.getMonth() === today.getMonth() &&
    dt.getDate() === today.getDate();
  if (sameDay) return 'Today';
  return dt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDate(
  messages: ChatMessage[],
  useLocaleDates: boolean,
): { key: string; date: string; msgs: ChatMessage[] }[] {
  const groups: { key: string; date: string; msgs: ChatMessage[] }[] = [];
  let curKey = '';
  for (const m of messages) {
    const dt = m.createdAt ? new Date(m.createdAt) : null;
    const key =
      dt && !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : 'unknown';
    const label =
      dt && !isNaN(dt.getTime())
        ? formatChatDateLabel(dt, useLocaleDates)
        : 'Today';
    if (key !== curKey) {
      curKey = key;
      // Disambiguate if the same day re-appears non-consecutively, so React keys stay unique.
      const uniqueKey = groups.some((g) => g.key === key) ? `${key}-${groups.length}` : key;
      groups.push({ key: uniqueKey, date: label, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(m);
  }
  return groups;
}

function timeStr(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

// ─── E2EE Key Bundle Panel ────────────────────────────────────────────────────

interface KeyBundlePanelProps {
  conversationId: string;
  onClose: () => void;
}

function KeyBundlePanel({ conversationId, onClose }: KeyBundlePanelProps) {
  const [bundle, setBundle] = useState<{
    bundle: Record<string, { publicKey: string; algorithm: string; publishedAt: string }>;
    missingKeys: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [fingerprints, setFingerprints] = useState<Record<string, string>>({});

  useEffect(() => {
    chatService
      .getKeyBundle(conversationId)
      .then((res) => setBundle(res.data ?? null))
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const handleVerify = async (userId: string) => {
    const fp = fingerprints[userId];
    if (!fp) {
      toast.error('Enter the fingerprint to verify');
      return;
    }
    setVerifying(userId);
    try {
      await e2eeService.verifyUserKey(userId, fp);
      toast.success('Key verified ✅');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="chat-room__keys-panel">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          <span className="material-symbols-outlined mr-1 align-middle text-[18px] text-[var(--neu-text-muted)]">lock_open</span>
          Encryption keys
        </p>
        <button type="button" onClick={onClose} className="mod-chip rounded-full px-3 py-1 text-xs font-semibold">
          Close
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-[var(--neu-text)]">
        <strong>Messages are not end-to-end encrypted yet.</strong> They&apos;re encrypted in transit and at rest on
        our servers, but not with these keys — end-to-end encryption (where only you and the other person can ever
        read a message) isn&apos;t connected yet. Public keys below are registered in preparation for that, but
        aren&apos;t currently used to protect your messages.
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-[var(--neu-text-muted)]">Loading key bundle…</p>
      ) : !bundle ? (
        <p className="mt-3 text-xs text-brand-red">Failed to load keys.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {bundle.missingKeys.length > 0 && (
            <div className="mod-card rounded-xl p-3 text-xs text-primary">
              {bundle.missingKeys.length} participant(s) have not registered a key yet.
            </div>
          )}
          {Object.entries(bundle.bundle).map(([uid, info]) => (
            <div key={uid} className="mod-card rounded-xl p-3">
              <p className="text-xs text-[var(--neu-text-muted)]">
                User <span className="font-mono">{uid.slice(0, 12)}…</span>
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-primary">
                {info.publicKey.slice(0, 40)}…
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste fingerprint to verify…"
                  className="mod-inset flex-1 rounded-lg px-2 py-1.5 text-[10px] text-[var(--neu-text)] placeholder:text-[var(--neu-text-muted)]"
                  value={fingerprints[uid] ?? ''}
                  onChange={(e) =>
                    setFingerprints((prev) => ({ ...prev, [uid]: e.target.value.trim() }))
                  }
                />
                <button
                  type="button"
                  disabled={verifying === uid}
                  onClick={() => handleVerify(uid)}
                  className="mod-chip mod-chip-active shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold disabled:opacity-50"
                >
                  {verifying === uid ? '…' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Handle legacy/invalid `/chat/new?sellerId=xxx` links by resolving to a
  // real conversationId on the fly, then redirecting. Without this guard we'd
  // send literal "new" to the API and trigger 400/500 responses.
  useEffect(() => {
    if (conversationId !== 'new') return;
    const sellerId =
      searchParams?.get('sellerId') ||
      searchParams?.get('userId') ||
      searchParams?.get('recipientId');
    if (!sellerId) {
      router.replace('/chat');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await chatService.getOrCreateDirectConversation(sellerId);
        const payload = (res as any)?.data ?? res;
        const conv = payload?.conversation ?? payload?.data?.conversation ?? payload;
        const convId = conv?._id ?? conv?.id ?? conv?.conversationId;
        if (cancelled) return;
        if (convId) router.replace(`/chat/${convId}`);
        else router.replace('/chat');
      } catch {
        if (!cancelled) router.replace('/chat');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, searchParams, router]);

  const isPlaceholder = conversationId === 'new' || !conversationId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [communityInfoOpen, setCommunityInfoOpen] = useState(false);
  const [mentionInvitee, setMentionInvitee] = useState<{ id: string; name: string; avatarUrl?: string | null } | null>(null);
  // Reply-to (audit finding #6) — the message currently being replied to,
  // shown as a preview above the composer until sent or cancelled.
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Active "@token" the user is typing (drives the invite mention picker).
  const mentionQuery = useMemo(() => {
    const m = inputText.match(/(?:^|\s)@(\w*)$/);
    return m ? m[1].toLowerCase() : null;
  }, [inputText]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const lastMsgRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation detail (name, participants) - falls back to cache
  const { data: detailData } = useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: () => chatService.getConversationDetail(conversationId),
    staleTime: 60_000,
    enabled: !!conversationId && !isPlaceholder,
  });

  const conv: Conversation | undefined = (() => {
    // Prefer freshly fetched detail
    const detail = (detailData as any)?.data?.conversation;
    if (detail) return detail as Conversation;
    // Fall back to conversations list cache. FriendshipChatInbox now loads
    // this via useInfiniteQuery (paginated — audit finding #23/#24/#26), so
    // the cache shape is { pages: [...] } rather than a single page; support
    // both shapes so this lookup keeps working regardless of which query
    // hook last populated the ['conversations'] cache key.
    const cached = queryClient.getQueryData<any>(['conversations']);
    const pages: any[] = cached?.pages ?? [cached];
    const list: Conversation[] = pages.flatMap(
      (page) => page?.data?.conversations ?? page?.conversations ?? [],
    );
    return list.find((c) => ((c as any).conversationId ?? (c as any)._id ?? c.id) === conversationId);
  })();

  // ── Marketplace viewer role ───────────────────────────────────────────────
  // For marketplace conversations we resolve buyer vs seller perspective by
  // comparing the current user with the product's sellerId. The result is
  // null for non-marketplace threads.
  const marketplaceProductId = conv?.contextType === 'marketplace'
    ? conv?.context?.productId ?? null
    : null;
  const { data: marketplaceProduct } = useProduct(marketplaceProductId);
  // The backend populates sellerId as a User object in the product response,
  // so we must extract the plain string ID from either form.
  const resolvedSellerId: string | null = (() => {
    const raw = (marketplaceProduct as any)?.sellerId;
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    // Populated user object — pick .id first, then ._id
    return (raw as any)?.id ?? (raw as any)?._id?.toString() ?? null;
  })();
  const viewerRole: OfferRole | null = resolveOfferRole(user?.id, resolvedSellerId);

  const peerUserId = useMemo(
    () => resolvePeerUserId(conv, user?.id),
    [conv, user?.id],
  );

  // Participants already in this conversation (excluded from invite suggestions).
  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    if (user?.id) ids.add(user.id);
    if (peerUserId) ids.add(peerUserId);
    const parts = (conv?.participants ?? []) as Array<{ userId?: string; id?: string; _id?: string }>;
    for (const p of parts) {
      const pid = (typeof p === 'string' ? p : p.userId ?? p.id ?? p._id) as string | undefined;
      if (pid) ids.add(pid);
    }
    return Array.from(ids);
  }, [conv, user?.id, peerUserId]);

  // When a name is picked from the @mention dropdown: clear the @token and
  // open the invite sheet pre-filled with that person.
  const handleMentionPick = useCallback(
    (person: { id: string; name: string; avatarUrl?: string | null }) => {
      setInputText((prev) => prev.replace(/(?:^|\s)@\w*$/, '').trimEnd());
      setMentionInvitee(person);
      setInviteOpen(true);
    },
    [],
  );

  const enrichOutgoing = useCallback(
    (msg: ChatMessage) => enrichMessageReceipt(msg, user?.id, peerUserId),
    [user?.id, peerUserId],
  );

  // ── Load messages ────────────────────────────────────────────────────────
  // Pagination state (audit finding #23/#24/#26): the backend has always
  // supported a `before` cursor for loading older history — nothing in the
  // app ever asked for it, so only the most recent 50 messages were ever
  // reachable. `nextCursor` is the createdAt of the oldest message currently
  // loaded; passing it as `before` on the next call fetches the next-older
  // page. `hasMoreOlder` becomes false once the server returns a page
  // shorter than the page size (no more history).
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollContainerElRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || isPlaceholder) return;
    try {
      const res = await chatService.getMessages(conversationId);
      const raw = res.data?.messages ?? [];
      // Backend already reverses to oldest-first before responding
      setMessages(enrichMessagesReceipts([...raw], user?.id, peerUserId));
      const pagination = res.data?.pagination;
      setNextCursor(pagination?.nextCursor ?? null);
      setHasMoreOlder(!!pagination?.nextCursor);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, isPlaceholder, user?.id, peerUserId]);

  /**
   * Load the next-older page and PREPEND it, preserving the user's scroll
   * position (otherwise prepending content above the viewport yanks the
   * visible messages down/up — the classic infinite-scroll-upward bug).
   */
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || isPlaceholder || !hasMoreOlder || !nextCursor || loadingOlder) return;
    const container = scrollContainerElRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    setLoadingOlder(true);
    try {
      const res = await chatService.getMessages(conversationId, { before: nextCursor });
      const older = res.data?.messages ?? [];
      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => msgId(m)));
          const deduped = older.filter((m) => !existingIds.has(msgId(m)));
          return [...enrichMessagesReceipts(deduped, user?.id, peerUserId), ...prev];
        });
      }
      const pagination = res.data?.pagination;
      setNextCursor(pagination?.nextCursor ?? null);
      setHasMoreOlder(!!pagination?.nextCursor);

      // Restore scroll position on the next paint, after the DOM has grown.
      requestAnimationFrame(() => {
        const el = scrollContainerElRef.current;
        if (!el) return;
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
      });
    } catch {
      // Non-fatal — the user can retry by scrolling again.
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, isPlaceholder, hasMoreOlder, nextCursor, loadingOlder, user?.id, peerUserId]);

  // Scroll-to-top loads older messages.
  useEffect(() => {
    const container = scrollContainerElRef.current;
    if (!container || isPlaceholder) return;
    const SCROLL_TOP_THRESHOLD_PX = 120;
    const onScroll = () => {
      if (container.scrollTop <= SCROLL_TOP_THRESHOLD_PX) {
        void loadOlderMessages();
      }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [loadOlderMessages, isPlaceholder]);

  useEffect(() => {
    if (isPlaceholder) {
      setLoading(false);
      return;
    }
    loadMessages();
    // Mark as read and delivered on open
    chatService.markAsRead(conversationId).catch(() => {});
    chatService.markAsDelivered(conversationId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMessages, isPlaceholder]);

  // Re-derive ticks when conversation detail loads peer id after messages
  useEffect(() => {
    if (!user?.id) return;
    setMessages((prev) => {
      const next = enrichMessagesReceipts(prev, user.id, peerUserId);
      const changed = next.some((m, i) => m.status !== prev[i]?.status);
      return changed ? next : prev;
    });
  }, [peerUserId, user?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    lastMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages.length]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    // Ensure this user is registered in their socket room so `emitToUser` works.
    // The global SocketAuthenticator in providers.tsx also does this, but we
    // re-emit here to guarantee it's registered before we start listening.
    // Uses the wrapper so the server-verified session token is sent, not a
    // client-claimed id.
    if (user?.id) socketService.authenticate(user.id);

    // Backend emits socket events as { message: { ...chatData } } — unwrap it
    const extractMsg = (data: any): ChatMessage => data?.message ?? data;

    const mergeIncoming = (msg: ChatMessage, prev: ChatMessage[], tempIdx: number) => {
      const merged =
        tempIdx !== -1
          ? { ...msg, senderId: prev[tempIdx].senderId }
          : msg;
      return enrichOutgoing(merged);
    };

    const onNew = (data: any) => {
      const msg = extractMsg(data);
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => {
        const id = (msg as any)._id ?? msg.id ?? msg.clientMessageId;
        if (prev.some((m) => msgId(m) === id)) return prev;
        // If a pending optimistic message has the same content, replace it instead of appending.
        // This prevents duplicates when the socket event arrives before the HTTP response.
        const tempIdx = prev.findIndex(
          (m) => String(m.id ?? '').startsWith('temp-') && m.content === msg.content,
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = mergeIncoming(msg, prev, tempIdx);
          return next;
        }
        return [...prev, enrichOutgoing(msg)];
      });
      chatService.markAsRead(conversationId).catch(() => {});
    };

    const onPriority = (data: any) => {
      const msg = extractMsg(data);
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => {
        const id = (msg as any)._id ?? msg.id ?? msg.clientMessageId;
        if (prev.some((m) => msgId(m) === id)) return prev;
        const tempIdx = prev.findIndex(
          (m) => String(m.id ?? '').startsWith('temp-') && m.content === msg.content,
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = mergeIncoming(msg, prev, tempIdx);
          return next;
        }
        return [...prev, enrichOutgoing(msg)];
      });
      chatService.markAsRead(conversationId).catch(() => {});
    };

    const onDelivered = (data: any) => {
      if (data.conversationId !== conversationId) return;
      if (!user?.id) return;
      const messageIds: string[] = data.messageIds ?? (data.messageId ? [data.messageId] : []);
      setMessages((prev) =>
        applyPeerDeliveredReceipt(prev, user.id, { messageIds }),
      );
    };

    const onRead = (data: any) => {
      if (data.conversationId !== conversationId) return;
      if (!user?.id) return;
      const reader = normalizeChatId(data.readByUserId);
      if (reader && reader === normalizeChatId(user.id)) return;
      setMessages((prev) =>
        applyPeerReadReceipt(prev, user.id, data.messageId as string | undefined),
      );
    };

    const onOfferUpdated = (payload: any) => {
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      // Refresh the offer-count queries (my-listings badge) so they reflect
      // the new status instantly. The in-chat cards advance off the system
      // message the server posts alongside this event.
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'product-offers'] });
      if (payload?.offerId) {
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'offer', payload.offerId] });
      }
      // The server also persists a system message describing this action.
      // Reload messages so it appears even if the message:new socket event
      // was dropped (e.g. authenticate handshake not yet complete).
      loadMessages();

      // Role-aware toast. The seller is always the actor on `offer:updated`
      // (accept / reject / counter) in the current product.
      const action = payload?.action as 'accept' | 'reject' | 'counter' | undefined;
      if (!action || !viewerRole) return;
      const amount = Number(
        payload?.counterAmount ?? payload?.offerAmount ?? 0,
      );
      const text = getOfferToast(
        { action, amount, actorRole: 'seller' },
        viewerRole,
      );
      if (action === 'accept') toast.success(text);
      else toast.message(text);
    };

    const onOfferNew = (payload: any) => {
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'product-offers'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'offers'] });
      // Pull the new "💰 Offer placed" system message into the chat view
      loadMessages();
      if (!viewerRole) return;
      const amount = Number(payload?.offerAmount ?? 0);
      toast.message(
        getOfferToast(
          { action: 'new', amount, actorRole: 'buyer' },
          viewerRole,
        ),
      );
    };

    // A deal just started (offer accepted → order created). The server posts
    // the 🤝 Deal Started card AFTER the offer:updated event, so reload once
    // more here to surface it (and the seller's payment details) live.
    const onDeal = (payload: any) => {
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      loadMessages();
    };

    socketService.on('message:new', onNew);
    socketService.on('message:priority', onPriority);
    socketService.on('message:delivered', onDelivered);
    socketService.on('message:read', onRead);
    socketService.on('offer:updated', onOfferUpdated);
    socketService.on('offer:new', onOfferNew);
    socketService.on('order:new', onDeal);
    socketService.on('order:payment', onDeal);
    socketService.on('order:confirmed', onDeal);

    return () => {
      socketService.off('message:new', onNew);
      socketService.off('message:priority', onPriority);
      socketService.off('message:delivered', onDelivered);
      socketService.off('message:read', onRead);
      socketService.off('offer:updated', onOfferUpdated);
      socketService.off('offer:new', onOfferNew);
      socketService.off('order:new', onDeal);
      socketService.off('order:payment', onDeal);
      socketService.off('order:confirmed', onDeal);
    };
  }, [conversationId, viewerRole, queryClient, user?.id, loadMessages, enrichOutgoing]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;

    const replyTo = replyingTo ? (replyingTo.id || (replyingTo as any)._id) : undefined;
    // Build an optimistic replyToPreview from the in-memory message we're
    // replying to, so the UI shows the quote instantly rather than waiting
    // for the server's response.
    const replyToPreview = replyingTo
      ? {
          id: replyTo as string,
          senderId: replyingTo.senderId,
          senderName:
            replyingTo.sender?.firstName || replyingTo.sender?.lastName
              ? [replyingTo.sender.firstName, replyingTo.sender.lastName].filter(Boolean).join(' ')
              : replyingTo.sender?.username,
          contentPreview: replyingTo.isDeleted
            ? '[Message deleted]'
            : (replyingTo.content ?? '').slice(0, 120),
          type: replyingTo.type,
          isDeleted: !!replyingTo.isDeleted,
        }
      : undefined;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user?.id ?? '',
      sender: user
        ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl ?? user.profilePicture ?? null,
          }
        : undefined,
      content,
      type: 'text',
      replyTo,
      replyToPreview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sent',
      priority: 'normal',
      isDeleted: false,
      isEdited: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText('');
    setReplyingTo(null);
    setSending(true);

    try {
      const res = await chatService.sendMessage({ conversationId, content, replyTo });
      // Backend wraps the message: { success, message, data: { message: {...} } }
      // So res.data = { message: {...} } — must unwrap one level
      const payload = res.data as any;
      const sent: ChatMessage | undefined = payload?.message ?? (payload?.duplicate ? undefined : payload);
      if (sent && !(sent as any).duplicate) {
        // Override senderId with user?.id so the 'mine' comparison always works,
        // regardless of ObjectId vs string ID format differences between server and client.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? enrichOutgoing({
                  ...sent,
                  id: sent.id || (sent as any)._id || tempId,
                  senderId: user?.id ?? sent.senderId,
                  // Prefer the server's replyToPreview (reflects current
                  // state) but keep the optimistic one as a fallback so the
                  // quote doesn't flicker away if the server didn't include it.
                  replyToPreview: sent.replyToPreview ?? replyToPreview ?? null,
                })
              : m,
          ),
        );
      } else if ((payload as any)?.duplicate) {
        // Server already has this message — keep optimistic until socket/reload syncs it
      } else {
        // Unknown response — keep the optimistic message as a fallback
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to send message';
      toast.error(serverMsg);
      // Remove the optimistic bubble and restore the text so the user doesn't lose their message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
      setReplyingTo(replyingTo);
      // Restore textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  /** "Delete for me" (audit finding #18/#26) — per-viewer hide, triggered from MessageActionSheet. */
  const handleDeleteForMe = async (msg: ChatMessage) => {
    const targetId = msg.id ?? (msg as any)._id;
    if (!targetId) return;
    // Optimistically remove it from view; if the request fails we simply
    // don't have a good way to "un-hide" without a refetch, so just reload
    // on failure instead of guessing at a rollback.
    setMessages((prev) => prev.filter((m) => msgId(m) !== targetId));
    try {
      await chatService.deleteMessage(targetId, false);
    } catch {
      toast.error('Could not remove the message. Reloading…');
      loadMessages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Action menu handler ─────────────────────────────────────────────────────
  const handleActionResult = async (result: ActionResult) => {
    setSending(true);
    setUploadProgress(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user?.id ?? '',
      sender: user
        ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl ?? user.profilePicture ?? null,
          }
        : undefined,
      content: result.content,
      type: result.type,
      mediaUrl: result.mediaUrl,
      locationSnapshot: result.locationSnapshot,
      emergencyRef: result.emergencyRef,
      trackingSessionRef: result.trackingSessionRef,
      meta: result.meta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sent',
      priority: 'normal',
      isDeleted: false,
      isEdited: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      let mediaUrl = result.mediaUrl;
      let thumbnailUrl: string | undefined;

      // Upload file if we have a raw file
      if (result.mediaFile) {
        setUploadProgress(0);
        const uploadRes = await chatService.uploadChatMedia(result.mediaFile, (pct) => setUploadProgress(pct));
        const uploaded = unwrapApiData<{
          url?: string;
          mediaUrl?: string;
          thumbnailUrl?: string;
        }>(uploadRes);
        mediaUrl = uploaded?.url ?? uploaded?.mediaUrl;
        thumbnailUrl = uploaded?.thumbnailUrl;
        if (!mediaUrl) throw new Error('Upload failed — no URL returned');
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, mediaUrl, thumbnailUrl } : m));
      }

      const res = await chatService.sendMessage({
        conversationId,
        content: result.content,
        type: result.type,
        mediaUrl,
        thumbnailUrl,
        locationSnapshot: result.locationSnapshot,
        emergencyRef: result.emergencyRef,
        trackingSessionRef: result.trackingSessionRef,
        meta: result.meta,
      });
      const payload =
        unwrapApiData<{ message?: ChatMessage; duplicate?: boolean }>(res as unknown) ??
        undefined;
      const sent: ChatMessage | undefined = payload?.message;
      if (sent && !(sent as any).duplicate) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? enrichOutgoing({
                  ...sent,
                  id: sent.id || (sent as any)._id || tempId,
                  senderId: user?.id ?? sent.senderId,
                  meta: optimistic.meta,
                })
              : m,
          ),
        );
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send';
      const status = err?.response?.status;
      toast.error(status ? `${errMsg} (HTTP ${status})` : errMsg);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      setUploadProgress(null);
      textareaRef.current?.focus();
    }
  };

  // ── Live location sharing (casual, distinct from emergency Live Tracking) ──
  // While the current user has an active, unexpired live-location message of
  // their own in this conversation, watch their position and push periodic
  // updates so the message updates in place for everyone else — mirroring
  // how Safe Trips/Live Tracking already stream location, but scoped to a
  // single chat message rather than a dedicated tracked session.
  useEffect(() => {
    const myLiveMessage = messages.find(
      (m) =>
        m.type === 'location' &&
        m.senderId === user?.id &&
        m.locationSnapshot?.isLive &&
        !m.locationSnapshot?.stoppedAt &&
        (!m.locationSnapshot?.expiresAt || new Date(m.locationSnapshot.expiresAt).getTime() > Date.now()),
    );
    if (!myLiveMessage) return;
    const messageId = myLiveMessage.id || (myLiveMessage as any)._id;
    if (!messageId) return;

    const geo = getGeolocation();
    if (!geo) return;

    let cancelled = false;
    const watchId = geo.watchPosition(
      (pos) => {
        if (cancelled) return;
        chatService
          .updateLiveLocation(messageId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          .catch(() => {
            // Silent — the share may have expired/stopped server-side
            // between ticks; the socket event will reconcile the UI.
          });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );

    return () => {
      cancelled = true;
      geo.clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user?.id]);

  // ── Groups ────────────────────────────────────────────────────────────────
  const groups = groupByDate(messages, clientReady);

  if (!clientReady) {
    return <ChatThreadPlaceholder />;
  }

  const isIncident = conv?.type === 'incident';
  const displayName = convDisplayName(conv, user?.id);
  const avatar = convAvatarMeta(conv);
  const baseSubtitle = conv ? convSubtitle(conv) : '';
  const readLabel = getOutgoingReadLabel(messages, user?.id, peerUserId);
  const headerSubtitle =
    conv?.type === 'direct' && readLabel
      ? `${baseSubtitle} · ${readLabel}`
      : baseSubtitle;

  const viewerScoped = (conv as { viewerScoped?: { expiresAt?: string } } | undefined)?.viewerScoped;
  const banners = (
    <>
      {viewerScoped?.expiresAt ? (
        <GuestCountdownBanner expiresAt={viewerScoped.expiresAt} />
      ) : null}

      {conv?.type === 'community' ? (
        <CommunityChatBanner conversationId={conversationId} />
      ) : null}

      {conv?.contextType === 'marketplace' && conv.context ? (
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3">
          {conv.context.productThumbnail ? (
            <Image
              src={conv.context.productThumbnail}
              alt={conv.context.productTitle ?? 'Product'}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg">
              🛍️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Marketplace</p>
            <p className="truncate text-sm font-bold text-gray-900">
              {conv.context.productTitle ?? 'Product'}
            </p>
          </div>
          {conv.context.productPrice != null ? (
            <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold tabular-nums text-blue-700">
              {conv.context.productCurrency ?? 'NGN'} {conv.context.productPrice.toLocaleString()}
            </span>
          ) : null}
          {conv.context.productId ? (
            <Link
              href={`/marketplace?product=${encodeURIComponent(String(conv.context.productId))}`}
              className="shrink-0 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-white no-underline hover:bg-slate-900 active:bg-black"
            >
              View
            </Link>
          ) : null}
        </div>
      ) : null}

      {showKeyPanel ? (
        <KeyBundlePanel conversationId={conversationId} onClose={() => setShowKeyPanel(false)} />
      ) : null}

      <IncognitoInviteSheet
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setMentionInvitee(null); }}
        conversationId={conversationId}
        invitee={mentionInvitee}
      />

      <CommunityInfoSheet
        open={communityInfoOpen}
        onClose={() => setCommunityInfoOpen(false)}
        conversationId={conversationId}
      />

    </>
  );

  return (
    <ChatRoomLayout
      scrollContainerRef={(el) => { scrollContainerElRef.current = el; }}
      header={
        <ChatRoomHeader
          displayName={displayName}
          subtitle={headerSubtitle || undefined}
          avatarUrl={avatar.url}
          avatarInitials={avatar.initials}
          isIncident={isIncident}
          showKeyPanel={showKeyPanel}
          onToggleKeys={() => setShowKeyPanel((s) => !s)}
          onBack={() => navigateBack(router, { pathname, fallback: '/friendship?tab=chats' })}
          onInviteGuest={conv?.type === 'direct' && !isPlaceholder ? () => setInviteOpen(true) : undefined}
          onCommunityInfo={isCommunityChat(conv ?? ({} as any)) && !isPlaceholder ? () => setCommunityInfoOpen(true) : undefined}
        />
      }
      banners={banners}
      composer={
        <>
        {conv?.type === 'direct' && !isPlaceholder && (
          <MentionInvitePicker
            query={mentionQuery}
            excludeIds={participantIds}
            onPick={handleMentionPick}
          />
        )}
        {/* Reply preview above the composer (audit finding #6) — mirrors
            WhatsApp/Telegram's "replying to…" bar shown while composing. */}
        {replyingTo ? (
          <div className="mx-auto flex w-full max-w-[600px] items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
            <span className="material-symbols-outlined shrink-0 text-[16px] text-gray-400">reply</span>
            <div className="min-w-0 flex-1 border-l-2 border-blue-400 pl-2">
              <p className="truncate text-[12px] font-semibold text-blue-600">
                {replyingTo.senderId === user?.id
                  ? 'Yourself'
                  : (replyingTo.sender?.firstName || replyingTo.sender?.lastName
                      ? [replyingTo.sender.firstName, replyingTo.sender.lastName].filter(Boolean).join(' ')
                      : replyingTo.sender?.username) || 'Neybor'}
              </p>
              <p className="truncate text-[12px] text-gray-500">
                {replyingTo.isDeleted ? 'Message deleted' : replyingTo.content || `[${replyingTo.type}]`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ) : null}
        <ChatComposer
          inputText={inputText}
          onInputChange={setInputText}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          sending={sending}
          uploadProgress={uploadProgress}
          textareaRef={textareaRef}
          onAction={handleActionResult}
          recipientName={displayName}
        />
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[600px] px-1 flex-col gap-1 pb-4 pt-4">
        {!loading && loadingOlder ? (
          <div className="flex justify-center py-2">
            <span className="text-xs text-gray-400">Loading earlier messages…</span>
          </div>
        ) : null}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`chat-skeleton w-2/3 ${i % 2 === 0 ? 'self-start' : 'self-end ml-auto'}`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-3xl">
              👋
            </div>
            <p className="mt-4 text-base font-bold text-gray-900">Start the conversation</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Say hello — your messages stay on NeyborHuud with trust and safety built in.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {groups.map(({ key, date, msgs }) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="my-6 flex items-center justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{date}</span>
                </div>

                {msgs.map((msg, msgIdx) => {
                      const mine = isMineMessage(msg, user?.id);
                      const id = msgId(msg);
                      const senderLabel = shouldShowSenderLabel(conv, mine)
                        ? resolveChatSenderLabel(msg, conv?.participants)
                        : null;
                      const isLastOverall =
                        msgIdx === msgs.length - 1 &&
                        groups[groups.length - 1]?.date === date;

                      const isSystem =
                        msg.type === 'system' ||
                        msg.senderId === '000000000000000000000000';

                      if (isSystem) {
                        const c = msg.content ?? '';
                        const msgMeta = (msg as { meta?: Record<string, unknown> }).meta;

                        // ── Incognito Invite join/left notices ──
                        if (msgMeta?.kind === 'incognito') {
                          const event = String(msgMeta.event ?? '');
                          const joined = event === 'joined';
                          return (
                            <div key={id} ref={isLastOverall ? lastMsgRef : undefined} className="my-3 flex justify-center px-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[12px] font-semibold text-green-700">
                                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                                  {joined ? 'visibility' : 'visibility_off'}
                                </span>
                                {c}
                              </span>
                            </div>
                          );
                        }

                        const structuredEvent =
                          msgMeta?.offerAction && msgMeta?.actorRole
                            ? {
                                action: msgMeta.offerAction as import('@/lib/marketplaceMessages').OfferAction,
                                amount: Number(msgMeta.offerAmount ?? 0),
                                actorRole: msgMeta.actorRole as import('@/lib/marketplaceMessages').OfferRole,
                              }
                            : null;
                        const parsed = structuredEvent ?? parseLegacyOfferMessage(c);
                        let display = c;
                        let pillClass = 'chat-room__system-pill mod-chip text-primary';

                        if (parsed) {
                          pillClass = `chat-room__system-pill mod-chip ${getOfferPillClass(parsed.action)}`;
                          if (viewerRole) {
                            display = getOfferSystemMessage(parsed, viewerRole);
                          } else {
                            display = c.replace(/^\s*(💰|✅|❌|↩️|↩\uFE0F?)\s*/u, '').trim();
                          }
                        }

                        return (
                          <div
                            key={id}
                            ref={isLastOverall ? lastMsgRef : undefined}
                            className="my-3 flex justify-center px-2"
                          >
                            <span className={pillClass}>{display}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={id}
                          ref={isLastOverall ? lastMsgRef : undefined}
                          className={`chat-row ${mine ? 'chat-row--out' : 'chat-row--in'}`}
                        >
                          <ChatMessageCard
                            msg={msg}
                            mine={mine}
                            senderLabel={senderLabel}
                            currentUserId={user?.id}
                            onReactionsUpdate={(reactions) => {
                              setMessages((prev) =>
                                prev.map((m) =>
                                  msgId(m) === id ? { ...m, reactions } : m,
                                ),
                              );
                            }}
                            onReply={(m) => {
                              setReplyingTo(m);
                              textareaRef.current?.focus();
                            }}
                            onDeleteForMe={handleDeleteForMe}
                          />
                        </div>
                      );
                    })}
              </div>
            ))}
          </div>
        )}
      </div>
    </ChatRoomLayout>
  );
}
