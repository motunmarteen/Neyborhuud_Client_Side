'use client';

import type { ChatMessage } from '@/types/api';

type ChatMessageTicksProps = {
  status?: ChatMessage['status'];
};

/** WhatsApp-style delivery ticks on outgoing messages. */
export function ChatMessageTicks({ status = 'sent' }: ChatMessageTicksProps) {
  const read = status === 'read';
  const delivered = status === 'delivered' || read;

  const label = read ? 'Read' : delivered ? 'Delivered' : 'Sent';

  return (
    <span
      className={`chat-bubble__ticks${read ? ' chat-bubble__ticks--read' : delivered ? ' chat-bubble__ticks--delivered' : ''}`}
      aria-label={label}
      title={label}
    >
      {delivered ? (
        <>
          <span className="chat-bubble__tick">✓</span>
          <span className="chat-bubble__tick chat-bubble__tick--second">✓</span>
        </>
      ) : (
        <span className="chat-bubble__tick">✓</span>
      )}
    </span>
  );
}
