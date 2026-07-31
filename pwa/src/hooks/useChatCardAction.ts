'use client';

/**
 * useChatCardAction — the one way an interactive chat card wires up an action
 * button (OfferCard, DealStatusCard, and any future Events/Jobs/Services/SOS
 * card).
 *
 * Every such card needs the same three things: a per-action busy flag so the
 * right button shows a spinner, one success/error toast, and an optimistic
 * `done` latch that disables the card immediately — the real state advances
 * when the server posts the next system message into the thread. Both cards
 * used to hand-roll this; keeping it here means a new card composes instead of
 * copy-pasting.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface ChatCardAction {
  /** Which action is currently in flight, or null when idle. */
  busy: string | null;
  /** True once any action has succeeded — cards use this to hide their buttons. */
  done: boolean;
  /** True while any action is in flight; bind to every button's `disabled`. */
  disabled: boolean;
  /**
   * Run `fn` as action `kind`. No-ops if another action is already running or
   * `enabled` is false (e.g. the card has no orderId/offerId to act on).
   */
  run: (kind: string, fn: () => Promise<unknown>, successMessage: string) => Promise<void>;
  /** Latch `done` without running anything — for cards doing their own upload flow. */
  markDone: () => void;
  setBusy: (kind: string | null) => void;
}

export function useChatCardAction(enabled: boolean = true): ChatCardAction {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const run = useCallback(
    async (kind: string, fn: () => Promise<unknown>, successMessage: string) => {
      if (!enabled || busy) return;
      setBusy(kind);
      try {
        await fn();
        toast.success(successMessage);
        setDone(true);
      } catch (e) {
        toast.error(
          (e as { message?: string })?.message || 'Something went wrong. Please try again.',
        );
      } finally {
        setBusy(null);
      }
    },
    [enabled, busy],
  );

  const markDone = useCallback(() => setDone(true), []);

  return { busy, done, disabled: busy !== null, run, markDone, setBusy };
}
