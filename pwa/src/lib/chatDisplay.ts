import type { Conversation } from '@/types/api';
import { isCommunityChat } from '@/lib/chatPaths';
import { fromKobo } from '@/lib/currency';

export function convDisplayName(c: Conversation | undefined, currentUserId?: string): string {
  if (!c) return 'Chat';
  if (c.type === 'incident') return 'Emergency Chat';
  if (isCommunityChat(c)) return c.name || c.groupName || 'Community';
  if (c.contextType === 'marketplace') {
    const title = c.context?.productTitle;
    if (title) return title;
    if (c.contextLabel) return c.contextLabel;
  }
  if (c.otherParticipant?.name) return c.otherParticipant.name;
  if (c.otherParticipant?.username) return c.otherParticipant.username;
  const participants: {
    id?: string;
    _id?: { toString(): string };
    userId?: { toString(): string };
    name?: string;
    username?: string;
  }[] = (c as Conversation & { participants?: typeof participants }).participants ?? [];
  const other = participants.find(
    (p) => p && (p.id ?? p._id?.toString?.() ?? p.userId?.toString?.()) !== currentUserId,
  );
  if (other?.name) return other.name;
  if (other?.username) return other.username;
  return 'Direct Message';
}

export function convSubtitle(c: Conversation | undefined): string {
  if (!c) return '';
  if (isCommunityChat(c)) return c.contextLabel ?? 'Community · group chat';
  if (c.contextType === 'marketplace') {
    if (c.context?.productPrice != null) {
      const cur = c.context.productCurrency ?? 'NGN';
      // productPrice is integer kobo — convert to naira for display.
      return `Marketplace · ${cur} ${fromKobo(c.context.productPrice).toLocaleString()}`;
    }
    return c.contextLabel ?? 'Marketplace chat';
  }
  if (c.type === 'direct') return '';
  return `${c.type} conversation`;
}

export function convAvatarMeta(c: Conversation | undefined): { url: string | null; initials: string } {
  if (!c) return { url: null, initials: '💬' };
  if (c.type === 'incident') return { url: null, initials: '🚨' };
  if (isCommunityChat(c)) {
    return { url: c.imageUrl ?? null, initials: '🏘️' };
  }
  if (c.contextType === 'marketplace' && c.context?.productThumbnail) {
    return { url: c.context.productThumbnail, initials: '🛍️' };
  }
  if (c.otherParticipant?.avatarUrl) {
    const n = c.otherParticipant.name || c.otherParticipant.username || '?';
    return { url: c.otherParticipant.avatarUrl, initials: n.slice(0, 2).toUpperCase() };
  }
  const name = convDisplayName(c);
  return { url: null, initials: name.slice(0, 2).toUpperCase() };
}
