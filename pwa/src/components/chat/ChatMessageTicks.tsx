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
      className="flex items-center tracking-[-0.2em]"
      aria-label={label}
      title={label}
    >
      {delivered ? (
        <>
          <span className={`text-[12px] ${read ? 'text-[#34B7F1]' : 'text-gray-400'}`}>✓</span>
          <span className={`text-[12px] ${read ? 'text-[#34B7F1]' : 'text-gray-400'}`}>✓</span>
        </>
      ) : (
        <span className="text-[12px] text-gray-400">✓</span>
      )}
    </span>
  );
}
