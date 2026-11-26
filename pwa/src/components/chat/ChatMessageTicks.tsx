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
 *
 * Shown as a small badge on the corner of your NEWEST message only (and on any message still
 * sending or not sent): once your latest message is read, the earlier ones were too.
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
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-brand-red text-[11px] font-black leading-none text-white ring-2 ring-white" role="img" aria-label={label} title={label}>
        !
      </span>
    );
  }

  // Deep green house on a white badge; the window turns warm yellow when read.
  const ink = light ? '#FFFFFF' : '#0E8A3E';
  const door = status === 'delivered' || status === 'read';
  const lit = status === 'read';

  return (
    // key = status, so the "light comes on" glow plays once when it turns to read.
    <span
      key={status}
      role="img"
      aria-label={label}
      title={label}
      className={`huud-mark grid h-[18px] w-[18px] place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(29,36,51,0.25)] ${status === 'sending' ? 'huud-mark--sending' : ''} ${lit ? 'huud-mark--lit' : ''}`}
    >
      <svg width="12" height="11" viewBox="0 0 15 14" aria-hidden>
        {/* roof and walls */}
        <path d="M1.6 6.6 7.5 1.6l5.9 5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={status === 'sending' ? 0.7 : 1} />
        <path d="M3.2 5.6v6.6h8.6V5.6" fill={lit ? 'rgba(255,211,77,0.18)' : 'none'} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" opacity={status === 'sending' ? 0.7 : 1} />
        {/* the door */}
        {door ? <rect x="6" y="8.8" width="2.8" height="3.4" rx="0.5" fill={ink} /> : null}
        {/* the window: lit when read */}
        <rect x="8.5" y="6.1" width="2.7" height="2.7" rx="0.5" fill={lit ? '#F5B800' : 'none'} stroke={lit ? '#F5B800' : door ? ink : 'none'} strokeWidth="0.9" />
      </svg>
    </span>
  );
}
