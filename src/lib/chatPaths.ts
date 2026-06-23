import type { Conversation } from '@/types/api';

/** Inbox now lives in the unified Connect hub; threads stay at /chat/[id]. */
export const CHAT_HOME = '/friendship?tab=dms';

/** Inbox tab query value for hub + legacy group chats (same UX). */
export const CHAT_TAB_COMMUNITIES = 'communities';

/** Hub communities and legacy group chats are one product surface in the app. */
export function isCommunityChat(c: Conversation): boolean {
  return c.type === 'community' || c.type === 'group';
}
export function chatThreadPath(conversationId: string): string {
  return `/chat/${encodeURIComponent(conversationId)}`;
}

export function chatLoginRedirect(conversationId: string): string {
  return `/login?redirect=${encodeURIComponent(chatThreadPath(conversationId))}`;
}
