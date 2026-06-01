'use client';

import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/api';

const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

type MessageReactionsProps = {
  msg: ChatMessage;
  currentUserId?: string;
  onUpdated?: (reactions: ChatMessage['reactions']) => void;
};

export function MessageReactions({ msg, currentUserId, onUpdated }: MessageReactionsProps) {
  const messageId = msg.id ?? msg._id;
  if (!messageId || msg.isDeleted) return null;

  const reactions = msg.reactions ?? {};
  const entries = Object.entries(reactions).filter(([, v]) => v.count > 0);

  const handleReact = async (emoji: string) => {
    try {
      const res = await chatService.setReaction(messageId, emoji);
      onUpdated?.(res.data?.reactions);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {entries.map(([emoji, data]) => {
        const mine = currentUserId && data.userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => void handleReact(emoji)}
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              mine ? 'bg-primary/20 ring-1 ring-primary/40' : 'bg-black/20'
            }`}
          >
            {emoji} {data.count}
          </button>
        );
      })}
      <span className="inline-flex gap-0.5 opacity-60">
        {QUICK_EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            className="text-sm hover:scale-110"
            onClick={() => void handleReact(e)}
            aria-label={`React ${e}`}
          >
            {e}
          </button>
        ))}
      </span>
    </div>
  );
}
