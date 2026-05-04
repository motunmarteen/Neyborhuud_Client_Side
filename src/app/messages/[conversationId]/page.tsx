'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chat.service';
import { e2eeService } from '@/services/e2ee.service';
<<<<<<< HEAD
import { ChatMessage, Conversation, MarketplaceOffer } from '@/types/api';
import socketService from '@/lib/socket';
import { toast } from 'sonner';
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
=======
import { ChatMessage, ChatMessageType, Conversation } from '@/types/api';
import socketService from '@/lib/socket';
import { toast } from 'sonner';
import ChatActionMenu, { ActionResult } from '@/components/chat/ChatActionMenu';
import ChatMessageCard from '@/components/chat/ChatMessageCard';
>>>>>>> origin/main

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msgId(m: ChatMessage): string {
  return (m as any)._id ?? m.id ?? m.clientMessageId ?? '';
}

function groupByDate(messages: ChatMessage[]): { date: string; msgs: ChatMessage[] }[] {
  const groups: { date: string; msgs: ChatMessage[] }[] = [];
  let curDate = '';
  for (const m of messages) {
    const dt = m.createdAt ? new Date(m.createdAt) : null;
    const d = dt && !isNaN(dt.getTime())
      ? dt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Today';
    if (d !== curDate) {
      curDate = d;
      groups.push({ date: d, msgs: [] });
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

function convDisplayName(c: Conversation | undefined, currentUserId?: string): string {
  if (!c) return 'Chat';
  if (c.type === 'incident') return '🚨 Emergency Chat';
  if (c.type === 'community') return '🏘️ Community Chat';
  // Marketplace chats: lead with the product so users can tell threads apart
  if (c.contextType === 'marketplace') {
    const title = c.context?.productTitle;
    if (title) return title;
    if (c.contextLabel) return c.contextLabel;
  }
  if (c.type === 'group') return c.name || c.groupName || 'Group Chat';
  // Try otherParticipant first
  if (c.otherParticipant?.name) return c.otherParticipant.name;
  if (c.otherParticipant?.username) return c.otherParticipant.username;
  // Fall back to participants array
  const participants: any[] = (c as any).participants ?? [];
  const other = participants.find(
    (p: any) => p && (p.id ?? p._id?.toString() ?? p.userId?.toString()) !== currentUserId,
  );
  if (other?.name) return other.name;
  if (other?.username) return other.username;
  return 'Direct Message';
}

function convSubtitle(c: Conversation | undefined): string {
  if (!c) return '';
  if (c.contextType === 'marketplace') {
    if (c.context?.productPrice != null) {
      const cur = c.context.productCurrency ?? 'NGN';
      return `Marketplace • ${cur} ${c.context.productPrice.toLocaleString()}`;
    }
    return c.contextLabel ?? 'Marketplace';
  }
  return `${c.type} conversation`;
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
    <div className="shrink-0 border-b border-gray-700 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-200">🔐 Encryption Keys</p>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-200">
          Close
        </button>
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-gray-500">Loading key bundle…</p>
      ) : !bundle ? (
        <p className="mt-2 text-xs text-red-400">Failed to load keys.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {bundle.missingKeys.length > 0 && (
            <div className="rounded-lg bg-yellow-950/40 p-2 text-xs text-yellow-300">
              ⚠️ {bundle.missingKeys.length} participant(s) have not registered an encryption key.
              Messages may not be end-to-end encrypted.
            </div>
          )}
          {Object.entries(bundle.bundle).map(([uid, info]) => (
            <div key={uid} className="rounded-lg border border-gray-700 bg-gray-800 p-3">
              <p className="text-xs text-gray-400">User: <span className="font-mono text-gray-200">{uid}</span></p>
              <p className="mt-1 break-all font-mono text-[10px] text-green-400">
                {info.publicKey.slice(0, 40)}…
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste fingerprint to verify…"
                  className="flex-1 rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-200 placeholder-gray-500"
                  value={fingerprints[uid] ?? ''}
                  onChange={(e) =>
                    setFingerprints((prev) => ({ ...prev, [uid]: e.target.value.trim() }))
                  }
                />
                <button
                  disabled={verifying === uid}
                  onClick={() => handleVerify(uid)}
                  className="rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
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
        <p className="text-xs font-semibold text-amber-200">
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
            className="shrink-0 rounded-full bg-amber-800/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-800/60 transition-colors"
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
            className="flex-1 rounded-full bg-green-700 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
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
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₦</span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Counter amount"
              min="0"
              step="1000"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 py-1.5 pl-5 pr-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => { setShowCounter(false); setCounterAmount(''); }}
            className="rounded-full bg-gray-700 px-3 py-1.5 text-xs font-semibold hover:bg-gray-600 transition-colors"
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

  // Handle legacy/invalid `/messages/new?sellerId=xxx` links by resolving to a
  // real conversationId on the fly, then redirecting. Without this guard we'd
  // send literal "new" to the API and trigger 400/500 responses.
  useEffect(() => {
    if (conversationId !== 'new') return;
    const sellerId =
      searchParams?.get('sellerId') ||
      searchParams?.get('userId') ||
      searchParams?.get('recipientId');
    if (!sellerId) {
      router.replace('/messages');
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
        if (convId) router.replace(`/messages/${convId}`);
        else router.replace('/messages');
      } catch {
        if (!cancelled) router.replace('/messages');
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

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId || isPlaceholder) return;
    try {
      const res = await chatService.getMessages(conversationId);
      const raw = res.data?.messages ?? [];
      // Backend already reverses to oldest-first before responding
      setMessages([...raw]);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, isPlaceholder]);

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
          // Preserve senderId as user's local id so 'mine' stays correct
          next[tempIdx] = { ...msg, senderId: prev[tempIdx].senderId };
          return next;
        }
        return [...prev, msg];
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
          next[tempIdx] = { ...msg, senderId: prev[tempIdx].senderId };
          return next;
        }
        return [...prev, msg];
      });
      chatService.markAsRead(conversationId).catch(() => {});
    };

    const onDelivered = (data: any) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          msgId(m) === data.messageId ? { ...m, status: 'delivered' as const } : m,
        ),
      );
    };

    const onRead = (data: any) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          msgId(m) === data.messageId ? { ...m, status: 'read' as const } : m,
        ),
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
  }, [conversationId, viewerRole, queryClient, user?.id, loadMessages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user?.id ?? '',
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
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...sent, id: sent.id || (sent as any)._id || tempId, senderId: user?.id ?? sent.senderId } : m)));
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

      // Upload file if we have a raw file
      if (result.mediaFile) {
        setUploadProgress(0);
        const uploadRes = await chatService.uploadChatMedia(result.mediaFile, (pct) => setUploadProgress(pct));
        mediaUrl = uploadRes.data?.mediaUrl ?? uploadRes.data?.url;
        if (!mediaUrl) throw new Error('Upload failed — no URL returned');
        // Update optimistic with real URL
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, mediaUrl } : m));
      }

      const res = await chatService.sendMessage({
        conversationId,
<<<<<<< HEAD
        content: file.name,
        type: pendingMediaType as "image" | "video" | "audio" | "text" | "file" | "location",
=======
        content: result.content,
        type: result.type as any,
>>>>>>> origin/main
        mediaUrl,
        locationSnapshot: result.locationSnapshot,
        emergencyRef: result.emergencyRef,
        trackingSessionRef: result.trackingSessionRef,
      });
      const payload = res.data as any;
      const sent: ChatMessage | undefined = payload?.message ?? (payload?.duplicate ? undefined : payload);
      if (sent && !(sent as any).duplicate) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...sent, id: sent.id || (sent as any)._id || tempId, senderId: user?.id ?? sent.senderId, meta: optimistic.meta }
              : m,
          ),
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      setUploadProgress(null);
      textareaRef.current?.focus();
    }
  };

  // ── Groups ────────────────────────────────────────────────────────────────
  const groups = groupByDate(messages);

  const isIncident = conv?.type === 'incident';
  const displayName = convDisplayName(conv, user?.id);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden pb-14">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>

        {/* Chat main — flex-col layout */}
        <main className="flex flex-1 flex-col overflow-hidden">

          {/* Header */}
          <div
            className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${
              isIncident
                ? 'border-red-800/60 bg-red-950/20'
                : 'border-gray-700 bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/messages')}
                className="text-gray-400 hover:text-gray-200"
                aria-label="Back"
              >
                ←
              </button>
              <div>
                <p className={`font-semibold ${isIncident ? 'text-red-200' : 'text-gray-100'}`}>
                  {displayName}
                </p>
                {conv && (
                  <p className="text-xs capitalize text-gray-500">{convSubtitle(conv)}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowKeyPanel((s) => !s)}
              className={`rounded-full p-1.5 text-lg transition-colors ${
                showKeyPanel ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Encryption keys"
            >
              🔐
            </button>
          </div>

          {/* Marketplace context banner — shows the product this chat is about */}
          {conv?.contextType === 'marketplace' && conv.context && (
            <div className="flex shrink-0 items-center gap-3 border-b border-blue-900/40 bg-blue-950/20 px-4 py-2.5">
              {conv.context.productThumbnail ? (
                <img
                  src={conv.context.productThumbnail}
                  alt={conv.context.productTitle ?? 'Product'}
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-900/50 text-lg">
                  🛍️
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-blue-200">
                  🛍️ Marketplace
                </p>
                <p className="truncate text-sm font-medium text-gray-100">
                  {conv.context.productTitle ?? 'Product'}
                </p>
              </div>
              {conv.context.productPrice != null && (
                <span className="shrink-0 rounded-full bg-blue-900/40 px-2.5 py-1 text-xs font-semibold text-blue-100">
                  {conv.context.productCurrency ?? 'NGN'} {conv.context.productPrice.toLocaleString()}
                </span>
              )}
              {conv.context.productId && (
                <Link
                  href={`/marketplace/${conv.context.productId}`}
                  className="shrink-0 rounded-full border border-blue-500/60 px-3 py-1 text-xs font-medium text-blue-200 hover:bg-blue-900/40"
                >
                  View
                </Link>
              )}
            </div>
          )}

          {/* E2EE Key Panel (collapsible) */}
          {showKeyPanel && (
            <KeyBundlePanel
              conversationId={conversationId}
              onClose={() => setShowKeyPanel(false)}
            />
          )}

          {/* Inline offer action bar — shown only to the seller when there's a pending offer.
              viewerRole must be 'seller' (resolved from product.sellerId) to prevent the
              buyer from seeing Accept/Counter/Decline buttons and getting a 403. */}
          {conv?.contextType === 'marketplace' && conv.context?.productId && viewerRole === 'seller' && (
            <InlineOfferBar
              productId={conv.context.productId}
              currentUserId={user?.id}
              onActionComplete={loadMessages}
            />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex flex-col gap-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 w-2/3 animate-pulse rounded-2xl bg-gray-800 ${
                      i % 2 === 0 ? 'self-start' : 'self-end'
                    }`}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-gray-500">No messages yet. Say hello 👋</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {groups.map(({ date, msgs }) => (
                  <div key={date}>
                    {/* Date divider */}
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-700" />
                      <span className="rounded-full bg-gray-800 px-3 py-0.5 text-[11px] text-gray-400">
                        {date}
                      </span>
                      <div className="h-px flex-1 bg-gray-700" />
                    </div>

                    {msgs.map((msg, msgIdx) => {
                      const mine = msg.senderId === user?.id;
                      const id = msgId(msg);
                      const isLastOverall =
                        msgIdx === msgs.length - 1 &&
                        groups[groups.length - 1]?.date === date;

                      // System messages (e.g. "🛒 Inquiry about: iPhone 13 — ₦250,000")
                      // Detected by sentinel senderId or type === 'system'
                      const isSystem =
                        msg.type === 'system' ||
                        msg.senderId === '000000000000000000000000';

                      if (isSystem) {
                        // Resolve an OfferEvent from the message.
                        // Priority 1: structured meta added by postSystemMessage (new messages)
                        // Priority 2: legacy emoji-prefix parsing (old persisted messages)
                        const c = msg.content ?? '';
                        const msgMeta = (msg as any).meta;
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
                        let pillClass = 'bg-blue-900/40 text-blue-200';

                        if (parsed) {
                          pillClass = getOfferPillClass(parsed.action);
                          if (viewerRole) {
                            display = getOfferSystemMessage(parsed, viewerRole);
                          } else {
                            // viewerRole not yet resolved (product still loading) —
                            // strip the leading emoji so legacy format doesn't show raw.
                            display = c.replace(/^\s*(💰|✅|❌|↩️|↩\uFE0F?)\s*/u, '').trim();
                          }
                        }

                        return (
                          <div
                            key={id}
                            ref={isLastOverall ? lastMsgRef : undefined}
                            className="my-3 flex justify-center"
                          >
                            <span className={`rounded-full px-4 py-1.5 text-[11px] ${pillClass}`}>
                              {display}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={id}
                          ref={isLastOverall ? lastMsgRef : undefined}
                          className={`mb-1 flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <ChatMessageCard msg={msg} mine={mine} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-700 bg-gray-900 px-4 py-3">
            {/* Upload progress bar */}
            {uploadProgress !== null && (
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <div className="flex items-end gap-2">
              {/* ⮕ Action menu (+ button) */}
              <ChatActionMenu disabled={sending} onAction={handleActionResult} />

              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  maxLength={10000}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  className="max-h-[200px] w-full resize-none rounded-xl border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                {inputText.length > 8000 && (
                  <span
                    className={`absolute bottom-2 right-3 text-[10px] ${
                      inputText.length >= 10000 ? 'text-red-400' : 'text-orange-400'
                    }`}
                  >
                    {10000 - inputText.length} left
                  </span>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                aria-label="Send message"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span>↑</span>
                )}
              </button>
            </div>
          </div>
        </main>

        <RightSidebar />
      </div>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
