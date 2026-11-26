'use client';

import type { ChatMessage } from '@/types/api';

type ChatMessageTicksProps = {
  status?: ChatMessage['status'];
  /** On the deep green bubble. */
  light?: boolean;
};

/**
 * NeyborHuud's own delivery mark (owner 2026-11-26): a tiny house instead of WhatsApp ticks.
 *   sending   faint house, breathing
 *   sent      the house
 *   delivered the house gets its door: "e don reach house"
 *   read      the window lights up warm yellow: "dem don see am" (light don come)
 *   failed    a red "!" (the row under the bubble says "Not sent · Tap to try again")
 */
export const MARK_LABEL: Record<NonNullable<ChatMessage['status']>, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

export function ChatMessageTicks({ status = 'sent', light }: ChatMessageTicksProps) {
  const label = MARK_LABEL[status] ?? 'Sent';

  if (status === 'failed') {
    return (
      <span className="grid h-[14px] w-[14px] place-items-center rounded-full bg-brand-red text-[10px] font-black leading-none text-white" role="img" aria-label={label} title={label}>
        !
      </span>
    );
  }

  const ink = light ? '#FFFFFF' : '#5B6478';
  const door = status === 'delivered' || status === 'read';
  const lit = status === 'read';

  return (
    // key = status, so the "light comes on" glow plays once when it turns to read.
    <span
      key={status}
      role="img"
      aria-label={label}
      title={label}
      className={`huud-mark inline-flex ${status === 'sending' ? 'huud-mark--sending' : ''} ${lit ? 'huud-mark--lit' : ''}`}
    >
      <svg width="18" height="17" viewBox="0 0 15 14" aria-hidden>
        {/* roof and walls */}
        <path d="M1.6 6.6 7.5 1.6l5.9 5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={status === 'sending' ? 0.7 : 1} />
        <path d="M3.2 5.6v6.6h8.6V5.6" fill={lit ? (light ? 'rgba(255,255,255,0.22)' : 'rgba(14,138,62,0.12)') : 'none'} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" opacity={status === 'sending' ? 0.7 : 1} />
        {/* the door */}
        {door ? <rect x="6" y="8.8" width="2.8" height="3.4" rx="0.5" fill={ink} /> : null}
        {/* the window: lit when read */}
        <rect x="8.7" y="6.3" width="2.3" height="2.3" rx="0.4" fill={lit ? '#FFD34D' : 'none'} stroke={lit ? '#FFD34D' : door ? ink : 'none'} strokeWidth="0.9" />
      </svg>
    </span>
  );
}
