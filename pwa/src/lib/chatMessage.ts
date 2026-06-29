import type { ChatMessage } from '@/types/api';

/** Normalize ids from API / socket / optimistic sends for "mine" checks. */
export function normalizeChatId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return String((value as { toString(): string }).toString());
  }
  return String(value);
}

export function isMineMessage(msg: ChatMessage, currentUserId?: string): boolean {
  if (!currentUserId) return false;
  const mine = normalizeChatId(currentUserId);
  const sender = normalizeChatId(msg.senderId);
  return Boolean(mine && sender && mine === sender);
}
