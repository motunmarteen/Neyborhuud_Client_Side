'use client';

/**
 * Panic PIN PRACTICE — a genuinely safe rehearsal of the duress-entry flow.
 *
 * This page renders the exact same disguised keypad UI as the real entry
 * screen (`/safety/panic-pin/enter`) — same layout, same "no visible
 * difference between right and wrong" behavior — so practicing actually
 * builds the right muscle memory. The critical difference: this page NEVER
 * calls `safetyService.verifyPanicPin` and NEVER fires any SOS, no matter
 * what is typed here, including the user's real PIN. Every submission is
 * purely simulated client-side with a short artificial delay (so it still
 * *feels* like the real thing) and a random-ish "Verified." / "Incorrect
 * PIN." response, entirely disconnected from whatever the user's actual PIN
 * is.
 *
 * Why this had to be a separate route rather than a "practice mode" flag on
 * the real entry screen: the real screen's URL is meant to be bookmarked
 * under an unlabeled name and used *as* the duress trigger — anything that
 * could turn "practice mode" on or off via a query param or toggle on that
 * same URL would be discoverable by an attacker forcing the phone open, and
 * defeats the disguise. This route is reachable ONLY via an explicit
 * "Practice" entry point from the Panic PIN settings page (not by guessing
 * this URL — it's not linked from the disguised real-entry surface at all),
 * while the real disguised URL (`/safety/panic-pin/enter`) still looks
 * identical to a stranger and still does the real thing.
 */

import { useRouter } from 'next/navigation';
import { PanicPinKeypad } from '@/components/safety/PanicPinKeypad';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PracticePinPage() {
  const router = useRouter();

  const handleSubmit = async (_pin: string) => {
    // Purely simulated — intentionally ignores the actual digits entered.
    // No network call, no SOS, ever, regardless of what PIN is typed.
    void _pin;
    await delay(400 + Math.random() * 300);
    // Randomized so repeated practice runs see both messages, exactly
    // mirroring the real screen's "identical presentation either way"
    // property without ever needing to check anything real.
    const verified = Math.random() > 0.4;
    return { message: verified ? 'Verified.' : 'Incorrect PIN.' };
  };

  return (
    <>
      <PanicPinKeypad onSubmit={handleSubmit} onCancel={() => router.back()} />
      {/* Small, unobtrusive practice-mode indicator — deliberately placed
         outside the disguised keypad's own layout so a screenshot or quick
         glance at the keypad itself still matches the real screen exactly,
         but a user consciously practicing always has a way to confirm
         they're in the safe, simulated flow. */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[10000] rounded-full bg-gray-900/80 dark:bg-gray-100/80 px-3 py-1 text-[11px] font-semibold text-white dark:text-black">
        Practice mode — nothing is sent, no matter what you type
      </div>
    </>
  );
}
