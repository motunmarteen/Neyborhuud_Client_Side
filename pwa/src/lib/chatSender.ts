import type { ChatMessage, Conversation } from '@/types/api';
import { isCommunityChat } from '@/lib/chatPaths';

type ParticipantLike = {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
};

export function isGroupStyleChat(conv?: Conversation | null): boolean {
  if (!conv) return false;
  return isCommunityChat(conv) || conv.type === 'incident';
}

export function resolveChatSenderLabel(
  msg: ChatMessage,
  participants?: ParticipantLike[],
): string | null {
  const sender = msg.sender;
  if (sender?.username) return `@${sender.username}`;

  const nameFromSender = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ');
  if (nameFromSender) return nameFromSender;

  const sid = String(msg.senderId ?? '');
  if (sid && participants?.length) {
    const match = participants.find((p) => {
      const pid = String(p.id ?? p._id ?? '');
      return pid && pid === sid;
    });
    if (match?.username) return `@${match.username}`;
    if (match?.name) return match.name;
  }

  return null;
}

export function shouldShowSenderLabel(
  conv: Conversation | undefined,
  mine: boolean,
): boolean {
  return !mine && isGroupStyleChat(conv);
}
