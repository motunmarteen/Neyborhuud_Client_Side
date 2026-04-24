'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chat.service';
import { e2eeService } from '@/services/e2ee.service';
import { ChatMessage, Conversation } from '@/types/api';
import socketService from '@/lib/socket';
import { toast } from 'sonner';

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

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);

  const lastMsgRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation detail (name, participants) - falls back to cache
  const { data: detailData } = useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: () => chatService.getConversationDetail(conversationId),
    staleTime: 60_000,
    enabled: !!conversationId,
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

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
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
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
    // Mark as read and delivered on open
    chatService.markAsRead(conversationId).catch(() => {});
    chatService.markAsDelivered(conversationId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMessages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    lastMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
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

    socketService.on('message:new', onNew);
    socketService.on('message:priority', onPriority);
    socketService.on('message:delivered', onDelivered);
    socketService.on('message:read', onRead);

    return () => {
      socketService.off('message:new', onNew);
      socketService.off('message:priority', onPriority);
      socketService.off('message:delivered', onDelivered);
      socketService.off('message:read', onRead);
    };
  }, [conversationId]);

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

  // ── Groups ────────────────────────────────────────────────────────────────
  const groups = groupByDate(messages);

  const isIncident = conv?.type === 'incident';
  const displayName = convDisplayName(conv, user?.id);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden pb-14">
        <LeftSidebar />

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
                  <p className="text-xs capitalize text-gray-500">{conv.type} conversation</p>
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

          {/* E2EE Key Panel (collapsible) */}
          {showKeyPanel && (
            <KeyBundlePanel
              conversationId={conversationId}
              onClose={() => setShowKeyPanel(false)}
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
                      const isPriority = msg.priority === 'emergency';
                      const id = msgId(msg);
                      const isLastOverall =
                        msgIdx === msgs.length - 1 &&
                        groups[groups.length - 1]?.date === date;

                      return (
                        <div
                          key={id}
                          ref={isLastOverall ? lastMsgRef : undefined}
                          className={`mb-1 flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              isPriority
                                ? 'border-2 border-red-600 bg-red-900/40'
                                : mine
                                ? 'bg-blue-700 text-white'
                                : 'bg-gray-800 text-gray-100'
                            }`}
                          >
                            {isPriority && (
                              <p className="mb-1 text-[10px] font-bold uppercase text-red-300">
                                🚨 Priority
                              </p>
                            )}
                            {msg.isDeleted ? (
                              <p className="italic text-gray-400 text-sm">[deleted]</p>
                            ) : (
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            )}
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                mine ? 'text-blue-200' : 'text-gray-500'
                              }`}
                            >
                              <span>{timeStr(msg.createdAt)}</span>
                              {mine && (
                                <span>
                                  {msg.status === 'read'
                                    ? '✓✓'
                                    : msg.status === 'delivered'
                                    ? '✓✓'
                                    : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
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
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  maxLength={10000}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    // Auto-resize
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
      <BottomNav />
    </div>
  );
}
