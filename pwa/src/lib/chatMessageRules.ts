/**
 * Which message actions to OFFER in the UI. These mirror the server rules
 * (chat.controller.ts / chat.forward.ts) so we don't show buttons that
 * would fail — the server still enforces every rule itself.
 */
import type { ChatMessage } from '@/types/api';

export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const DELETE_FOR_EVERYONE_WINDOW_MS = 48 * 60 * 60 * 1000;
export const FREQUENTLY_FORWARDED_AT = 5;
export const MAX_FORWARD_TARGETS = 5;

/** Deal cards and safety messages are records: never edited/erased/forwarded. */
const PROTECTED_TYPES = new Set(['system', 'sos', 'tracking', 'kidnapping_info', 'emergency_share', 'trip_share', 'poll']);
const FORWARDABLE_TYPES = new Set([
  'text', 'image', 'video', 'audio', 'file', 'document',
  'product_share', 'event_share', 'job_share', 'post_share',
]);

function ageMs(msg: ChatMessage): number {
  const t = new Date(msg.createdAt).getTime();
  return Number.isFinite(t) ? Date.now() - t : Infinity;
}

function isPending(msg: ChatMessage): boolean {
  return String(msg.id ?? '').startsWith('temp-');
}

export function canEditMessage(msg: ChatMessage, mine: boolean): boolean {
  return (
    mine &&
    !isPending(msg) &&
    !msg.isDeleted &&
    msg.type === 'text' &&
    !msg.e2ee &&
    !msg.isForwarded &&
    ageMs(msg) <= EDIT_WINDOW_MS
  );
}

export function canDeleteForEveryone(msg: ChatMessage, mine: boolean, canModerate = false): boolean {
  if (isPending(msg) || msg.isDeleted || PROTECTED_TYPES.has(msg.type)) return false;
  if (canModerate) return true;
  return mine && ageMs(msg) <= DELETE_FOR_EVERYONE_WINDOW_MS;
}

export function canForwardMessage(msg: ChatMessage): boolean {
  return !isPending(msg) && !msg.isDeleted && !msg.e2ee && FORWARDABLE_TYPES.has(msg.type);
}

/** How many chats this message may be forwarded to at once. */
export function maxForwardTargets(msg: ChatMessage): number {
  return (msg.forwardCount ?? 0) >= FREQUENTLY_FORWARDED_AT ? 1 : MAX_FORWARD_TARGETS;
}

export function forwardLabel(msg: ChatMessage): string | null {
  if (!msg.isForwarded) return null;
  return (msg.forwardCount ?? 0) >= FREQUENTLY_FORWARDED_AT ? 'Forwarded many times' : 'Forwarded';
}
