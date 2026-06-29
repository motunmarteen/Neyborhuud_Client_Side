import type { ChatMessage, Conversation } from '@/types/api';
import { isMineMessage, normalizeChatId } from '@/lib/chatMessage';

function hasUserInList(list: unknown[] | undefined, userId: string): boolean {
  if (!list?.length || !userId) return false;
  const target = normalizeChatId(userId);
  return list.some((entry) => normalizeChatId(entry) === target);
}

/** Other participant in a direct (or 1:1-style) thread — used for read/delivered ticks. */
export function resolvePeerUserId(
  conv: Conversation | undefined,
  currentUserId?: string,
): string | undefined {
  if (!conv || !currentUserId) return undefined;
  const mine = normalizeChatId(currentUserId);

  const other = conv.otherParticipant as
    | { id?: string; _id?: string; userId?: string }
    | undefined;
  if (other) {
    const id = normalizeChatId(other.id ?? other._id ?? other.userId);
    if (id && id !== mine) return id;
  }

  const participants =
    (conv as Conversation & { participants?: Array<Record<string, unknown>> }).participants ??
    [];
  for (const p of participants) {
    const id = normalizeChatId(p.id ?? p._id ?? p.userId);
    if (id && id !== mine) return id;
  }
  return undefined;
}

/** Map backend readBy / deliveredTo arrays to WhatsApp-style status for outgoing messages. */
export function deriveOutgoingStatus(
  msg: ChatMessage,
  currentUserId: string,
  peerUserId?: string,
): ChatMessage['status'] {
  if (!isMineMessage(msg, currentUserId)) return msg.status ?? 'sent';

  const peer = peerUserId ? normalizeChatId(peerUserId) : '';
  if (peer) {
    if (hasUserInList(msg.readBy, peer)) return 'read';
    if (hasUserInList(msg.deliveredTo, peer)) return 'delivered';
    return msg.status ?? 'sent';
  }

  const me = normalizeChatId(currentUserId);
  const otherReaders = (msg.readBy ?? []).filter(
    (id) => normalizeChatId(id) && normalizeChatId(id) !== me,
  );
  if (otherReaders.length > 0) return 'read';

  const otherDelivered = (msg.deliveredTo ?? []).filter(
    (id) => normalizeChatId(id) && normalizeChatId(id) !== me,
  );
  if (otherDelivered.length > 0) return 'delivered';

  return msg.status ?? 'sent';
}

export function enrichMessageReceipt(
  msg: ChatMessage,
  currentUserId?: string,
  peerUserId?: string,
): ChatMessage {
  if (!currentUserId || !isMineMessage(msg, currentUserId)) return msg;
  const status = deriveOutgoingStatus(msg, currentUserId, peerUserId);
  if (msg.status === status) return msg;
  return { ...msg, status };
}

export function enrichMessagesReceipts(
  messages: ChatMessage[],
  currentUserId?: string,
  peerUserId?: string,
): ChatMessage[] {
  if (!currentUserId) return messages;
  return messages.map((m) => enrichMessageReceipt(m, currentUserId, peerUserId));
}

export function getLastOutgoingMessage(
  messages: ChatMessage[],
  currentUserId?: string,
): ChatMessage | undefined {
  if (!currentUserId) return undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.isDeleted || m.type === 'system') continue;
    if (isMineMessage(m, currentUserId)) return m;
  }
  return undefined;
}

/** Header / status line like WhatsApp: "Read", "Delivered", "Sent". */
export function getOutgoingReadLabel(
  messages: ChatMessage[],
  currentUserId?: string,
  peerUserId?: string,
): string | null {
  const last = getLastOutgoingMessage(messages, currentUserId);
  if (!last || !currentUserId) return null;

  const status = deriveOutgoingStatus(last, currentUserId, peerUserId);
  if (status === 'read') return 'Read';
  if (status === 'delivered') return 'Delivered';
  return 'Sent';
}

/** When peer marks read, update own messages (conversation-level or up to a cursor). */
export function applyPeerReadReceipt(
  messages: ChatMessage[],
  currentUserId: string,
  readMessageId?: string,
): ChatMessage[] {
  const readMsg = readMessageId
    ? messages.find((m) => normalizeChatId(m.id ?? m._id) === normalizeChatId(readMessageId))
    : undefined;
  const readTime = readMsg?.createdAt
    ? new Date(readMsg.createdAt).getTime()
    : Number.POSITIVE_INFINITY;

  return messages.map((m) => {
    if (!isMineMessage(m, currentUserId)) return m;
    if (m.status === 'read') return m;
    if (!readMsg) return { ...m, status: 'read' as const };
    const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    return t <= readTime ? { ...m, status: 'read' as const } : m;
  });
}

/** When peer receives messages, mark matching outgoing bubbles as delivered. */
export function applyPeerDeliveredReceipt(
  messages: ChatMessage[],
  currentUserId: string,
  opts: { messageIds?: string[] },
): ChatMessage[] {
  const idSet = new Set(
    (opts.messageIds ?? []).map((id) => normalizeChatId(id)).filter(Boolean),
  );
  if (idSet.size === 0) return messages;

  return messages.map((m) => {
    if (!isMineMessage(m, currentUserId)) return m;
    if (m.status === 'read') return m;
    const mid = normalizeChatId(m.id ?? m._id);
    if (idSet.has(mid)) return { ...m, status: 'delivered' as const };
    return m;
  });
}
