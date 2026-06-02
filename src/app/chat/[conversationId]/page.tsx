'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { ChatMessage, ChatMessageType, Conversation, MarketplaceOffer } from '@/types/api';
import socketService from '@/lib/socket';
import { toast } from 'sonner';
import ChatMessageCard from '@/components/chat/ChatMessageCard';
import {
  resolveChatSenderLabel,
  shouldShowSenderLabel,
} from '@/lib/chatSender';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { convAvatarMeta, convDisplayName, convSubtitle } from '@/lib/chatDisplay';
import type { ActionResult } from '@/components/chat/ChatActionMenu';
import { unwrapApiData } from '@/lib/apiPayload';
import { CommunityChatBanner } from '@/components/communities/CommunityChatBanner';
import { isCommunityChat } from '@/lib/chatPaths';
import { useProductOffers, useAcceptOffer, useRejectOffer, useRespondToOffer, useProduct } from '@/hooks/useMarketplace';
import {
  formatNGN,
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
): { date: string; msgs: ChatMessage[] }[] {
  const groups: { date: string; msgs: ChatMessage[] }[] = [];
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
      groups.push({ date: label, msgs: [] });
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
          <span className="material-symbols-outlined mr-1 align-middle text-[18px] text-primary">encrypted</span>
          Encryption keys
        </p>
        <button type="button" onClick={onClose} className="mod-chip rounded-full px-3 py-1 text-xs font-semibold">
          Close
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-[var(--neu-text-muted)]">Loading key bundle…</p>
      ) : !bundle ? (
        <p className="mt-3 text-xs text-brand-red">Failed to load keys.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {bundle.missingKeys.length > 0 && (
            <div className="mod-card rounded-xl p-3 text-xs text-primary">
              {bundle.missingKeys.length} participant(s) have not registered a key yet. Messages may not be fully encrypted.
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

// ─── Inline Offer Action Bar (seller view) ───────────────────────────────────
//
// Shown inside a marketplace chat thread when the current user is the seller
// and there is at least one pending offer. Fetching product offers with a
// 403 response means the viewer is the buyer — the bar is simply not rendered.

interface InlineOfferBarProps {
  productId: string;
  currentUserId?: string;
  onActionComplete?: () => void;
}

function InlineOfferBar({ productId, currentUserId, onActionComplete }: InlineOfferBarProps) {
  const router = useRouter();
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');

  // This component only renders when viewerRole === 'seller' (guarded by parent),
  // so we always fetch pending offers — no isMaybeSeller heuristic needed.
  const { data } = useProductOffers(productId, 'pending');
  const pendingOffers: MarketplaceOffer[] = data?.offers ?? [];

  // Nothing to show if no pending offers or if fetch returned nothing (buyer / no access)
  if (pendingOffers.length === 0) return null;

  // Show action bar for the most-recent pending offer
  const latestOffer = pendingOffers[pendingOffers.length - 1];
  const offerId = latestOffer._id ?? latestOffer.id;

  return (
    <OfferActionBar
      offer={latestOffer}
      offerId={offerId}
      pendingCount={pendingOffers.length}
      productId={productId}
      showCounter={showCounter}
      setShowCounter={setShowCounter}
      counterAmount={counterAmount}
      setCounterAmount={setCounterAmount}
      router={router}
      onActionComplete={onActionComplete}
    />
  );
}

interface OfferActionBarProps {
  offer: MarketplaceOffer;
  offerId: string;
  pendingCount: number;
  productId: string;
  showCounter: boolean;
  setShowCounter: (v: boolean) => void;
  counterAmount: string;
  setCounterAmount: (v: string) => void;
  router: ReturnType<typeof useRouter>;
  onActionComplete?: () => void;
}

function OfferActionBar({
  offer,
  offerId,
  pendingCount,
  productId,
  showCounter,
  setShowCounter,
  counterAmount,
  setCounterAmount,
  router,
  onActionComplete,
}: OfferActionBarProps) {
  const accept  = useAcceptOffer();
  const reject  = useRejectOffer();
  const respond = useRespondToOffer(offerId);

  const handleAccept = async () => {
    try {
      await accept.mutateAsync(offerId);
    } finally {
      onActionComplete?.();
    }
  };
  const handleReject = async () => {
    try {
      await reject.mutateAsync(offerId);
    } finally {
      onActionComplete?.();
    }
  };

  const handleCounter = async () => {
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await respond.mutateAsync({ action: 'counter', counterAmount: amount });
    } finally {
      setShowCounter(false);
      setCounterAmount('');
      onActionComplete?.();
    }
  };

  const buyer = offer.buyer as any;
  const buyerName =
    buyer?.firstName && buyer?.lastName
      ? `${buyer.firstName} ${buyer.lastName}`
      : buyer?.username ?? 'Buyer';

  return (
    <div className="shrink-0 border-b border-amber-900/40 bg-amber-950/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-white/90">
          You received an offer of {formatNGN(offer.offerAmount)} from {buyerName}.
          {offer.counterOfferAmount != null && (
            <span className="ml-2 text-purple-300">
              You countered with {formatNGN(offer.counterOfferAmount)}.
            </span>
          )}
        </p>
        {pendingCount > 1 && (
          <button
            onClick={() => router.push(`/marketplace/${productId}/offers`)}
            className="shrink-0 rounded-full bg-amber-800/40 px-2 py-0.5 text-[10px] font-semibold text-white/90 hover:bg-amber-800/60 transition-colors"
          >
            +{pendingCount - 1} more
          </button>
        )}
      </div>

      {!showCounter ? (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={accept.isPending || reject.isPending}
            className="flex-1 rounded-full bg-green-700 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
          >
            {accept.isPending ? '…' : 'Accept'}
          </button>
          <button
            onClick={() => setShowCounter(true)}
            className="flex-1 rounded-full bg-purple-800 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Counter
          </button>
          <button
            onClick={handleReject}
            disabled={reject.isPending || accept.isPending}
            className="flex-1 rounded-full bg-red-800 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {reject.isPending ? '…' : 'Decline'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--neu-text-muted)]">₦</span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Counter amount"
              min="0"
              step="1000"
              className="w-full rounded-lg border border-black/[0.08] bg-brand-black py-1.5 pl-5 pr-2 text-xs text-white focus:border-brand-blue focus:outline-none"
            />
          </div>
          <button
            onClick={() => { setShowCounter(false); setCounterAmount(''); }}
            className="rounded-full bg-brand-black px-3 py-1.5 text-xs font-semibold hover:bg-brand-surface transition-colors"
          >
            ✕
          </button>
          <button
            onClick={handleCounter}
            disabled={respond.isPending || !counterAmount}
            className="rounded-full bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {respond.isPending ? '…' : 'Send'}
          </button>
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
    // Fall back to conversations list cache
    const cached = queryClient.getQueryData<any>(['conversations']);
    const list: Conversation[] = cached?.data?.conversations ?? cached?.conversations ?? [];
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

  const enrichOutgoing = useCallback(
    (msg: ChatMessage) => enrichMessageReceipt(msg, user?.id, peerUserId),
    [user?.id, peerUserId],
  );

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId || isPlaceholder) return;
    try {
      const res = await chatService.getMessages(conversationId);
      const raw = res.data?.messages ?? [];
      // Backend already reverses to oldest-first before responding
      setMessages(enrichMessagesReceipts([...raw], user?.id, peerUserId));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, isPlaceholder, user?.id, peerUserId]);

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
  }, [messages]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    // Ensure this user is registered in their socket room so `emitToUser` works.
    // The global SocketAuthenticator in providers.tsx also does this, but we
    // re-emit here to guarantee it's registered before we start listening.
    if (user?.id) socketService.emit('authenticate', user.id);

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
      // Refresh any offer-related queries so InlineOfferBar / OfferActionBar
      // reflect the new status (accepted / rejected / countered) instantly.
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

    socketService.on('message:new', onNew);
    socketService.on('message:priority', onPriority);
    socketService.on('message:delivered', onDelivered);
    socketService.on('message:read', onRead);
    socketService.on('offer:updated', onOfferUpdated);
    socketService.on('offer:new', onOfferNew);

    return () => {
      socketService.off('message:new', onNew);
      socketService.off('message:priority', onPriority);
      socketService.off('message:delivered', onDelivered);
      socketService.off('message:read', onRead);
      socketService.off('offer:updated', onOfferUpdated);
      socketService.off('offer:new', onOfferNew);
    };
  }, [conversationId, viewerRole, queryClient, user?.id, loadMessages, enrichOutgoing]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sent',
      priority: 'normal',
      isDeleted: false,
      isEdited: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText('');
    setSending(true);

    try {
      const res = await chatService.sendMessage({ conversationId, content });
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

  const banners = (
    <>
      {conv?.type === 'community' ? (
        <CommunityChatBanner conversationId={conversationId} />
      ) : null}

      {conv?.contextType === 'marketplace' && conv.context ? (
        <div className="chat-room__banner chat-room__banner--market mod-card rounded-none border-x-0 border-t-0">
          {conv.context.productThumbnail ? (
            <img
              src={conv.context.productThumbnail}
              alt={conv.context.productTitle ?? 'Product'}
              className="neu-avatar h-11 w-11 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg">
              🛍️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Marketplace</p>
            <p className="truncate text-sm font-bold text-[var(--neu-text)]">
              {conv.context.productTitle ?? 'Product'}
            </p>
          </div>
          {conv.context.productPrice != null ? (
            <span className="mod-chip shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
              {conv.context.productCurrency ?? 'NGN'} {conv.context.productPrice.toLocaleString()}
            </span>
          ) : null}
          {conv.context.productId ? (
            <Link
              href={`/marketplace?product=${encodeURIComponent(String(conv.context.productId))}`}
              className="mod-chip mod-chip-active shrink-0 rounded-full px-3 py-1.5 text-xs font-bold no-underline"
            >
              View
            </Link>
          ) : null}
        </div>
      ) : null}

      {showKeyPanel ? (
        <KeyBundlePanel conversationId={conversationId} onClose={() => setShowKeyPanel(false)} />
      ) : null}

      {conv?.contextType === 'marketplace' && conv.context?.productId && viewerRole === 'seller' ? (
        <InlineOfferBar
          productId={conv.context.productId}
          currentUserId={user?.id}
          onActionComplete={loadMessages}
        />
      ) : null}
    </>
  );

  return (
    <ChatRoomLayout
      header={
        <ChatRoomHeader
          displayName={displayName}
          subtitle={headerSubtitle || undefined}
          avatarUrl={avatar.url}
          avatarInitials={avatar.initials}
          isIncident={isIncident}
          encrypted={conv?.type === 'direct'}
          showKeyPanel={showKeyPanel}
          onToggleKeys={() => setShowKeyPanel((s) => !s)}
        />
      }
      banners={banners}
      composer={
        <ChatComposer
          inputText={inputText}
          onInputChange={setInputText}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          sending={sending}
          uploadProgress={uploadProgress}
          textareaRef={textareaRef}
          onAction={handleActionResult}
        />
      }
    >
      <div className="chat-room__messages">
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
          <div className="chat-room__empty">
            <div className="chat-room__empty-icon">
              <span className="material-symbols-outlined text-[28px]">waving_hand</span>
            </div>
            <p className="text-sm font-bold text-[var(--neu-text)]">Start the conversation</p>
            <p className="max-w-xs text-xs text-[var(--neu-text-muted)]">
              Say hello — your messages stay on NeyborHuud with trust and safety built in.
            </p>
          </div>
        ) : (
          <div className="chat-thread-list">
            {groups.map(({ date, msgs }) => (
              <div key={date}>
                <div className="chat-room__date">
                  <div className="chat-room__date-line" aria-hidden />
                  <span className="chat-room__date-pill">{date}</span>
                  <div className="chat-room__date-line" aria-hidden />
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
