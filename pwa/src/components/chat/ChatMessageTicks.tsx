'use client';

import type { ChatMessage } from '@/types/api';

type ChatMessageTicksProps = {
  status?: ChatMessage['status'];
  /** On the deep green bubble. */
  light?: boolean;
};

/** WhatsApp-style delivery ticks on outgoing messages. */
export function ChatMessageTicks({ status = 'sent', light }: ChatMessageTicksProps) {
  const read = status === 'read';
  const delivered = status === 'delivered' || read;

  const seen = light ? 'text-[#8FE3FF]' : 'text-[#1683B5]';
  const plain = light ? 'text-white/70' : 'text-muted';
  const label = read ? 'Read' : delivered ? 'Delivered' : 'Sent';

  return (
    <span
      className="flex items-center tracking-[-0.2em]"
      aria-label={label}
      title={label}
    >
      {delivered ? (
        <>
          <span className={`text-[12px] ${read ? seen : plain}`}>✓</span>
          <span className={`text-[12px] ${read ? seen : plain}`}>✓</span>
        </>
      ) : (
        <span className={`text-[12px] ${plain}`}>✓</span>
      )}
    </span>
  );
}
