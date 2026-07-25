'use client';

/**
 * Shared disguised PIN-entry keypad UI — used by BOTH the real duress-trigger
 * screen (`/safety/panic-pin/enter`) and the safe practice screen
 * (`/safety/panic-pin/practice`).
 *
 * Deliberately NOT styled or labeled as a safety feature. This UI must look
 * like an unremarkable "Enter PIN to continue" gate to anyone watching over
 * the user's shoulder — the entire premise of a duress code. Do not add the
 * words "panic", "SOS", "safety", "duress", "guardian", or any shield/alarm
 * iconography here.
 *
 * This component itself has NO idea whether a PIN is right or wrong, and
 * never talks to the server — it only collects digits and calls `onSubmit`
 * once enough digits are entered. The caller (the real page or the practice
 * page) decides what "submit" actually does: the real page calls the real
 * verify endpoint and may fire a silent SOS; the practice page always just
 * simulates, no matter what is typed, and never reaches the network.
 */

import { useCallback, useRef, useState } from 'react';

const MAX_DIGITS = 6;
const DIGIT_PLACEHOLDERS = Array.from({ length: MAX_DIGITS });

export interface PanicPinKeypadProps {
  /** Called once 4-6 digits are entered (auto-submits at 6, or via the Continue button from 4). */
  onSubmit: (pin: string) => Promise<{ message: string }>;
  /** Rendered above the keypad. Keep this bland — no safety-feature language. */
  title?: string;
  /** Called when the user taps "Cancel" (back arrow). Defaults to browser back. */
  onCancel?: () => void;
}

export function PanicPinKeypad({ onSubmit, title = 'Enter PIN', onCancel }: PanicPinKeypadProps) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const busyRef = useRef(false);

  const submit = useCallback(
    async (pin: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setMessage(null);

      try {
        const result = await onSubmit(pin);
        setMessage(result.message);
      } finally {
        setDigits('');
        setBusy(false);
        busyRef.current = false;
      }
    },
    [onSubmit],
  );

  const press = (d: string) => {
    if (busy) return;
    setMessage(null);
    setDigits((prev) => {
      const next = (prev + d).slice(0, MAX_DIGITS);
      if (next.length >= 4 && next.length === MAX_DIGITS) {
        void submit(next);
      }
      return next;
    });
  };

  const backspace = () => {
    if (busy) return;
    setMessage(null);
    setDigits((prev) => prev.slice(0, -1));
  };

  const confirm = () => {
    if (digits.length >= 4) void submit(digits);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white dark:bg-black px-6 py-10">
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-8 w-full max-w-[320px]">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</p>
          {message && (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500" role="status">
              {message}
            </p>
          )}
        </div>

        <div className="flex gap-3" aria-hidden>
          {DIGIT_PLACEHOLDERS.map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600 ${
                i < digits.length ? 'bg-gray-700 dark:bg-gray-200 border-transparent' : ''
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              disabled={busy}
              className="aspect-square rounded-full text-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:bg-gray-200 dark:active:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={onCancel ?? (() => window.history.back())}
            className="aspect-square rounded-full text-sm font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            disabled={busy}
            className="aspect-square rounded-full text-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:bg-gray-200 dark:active:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={backspace}
            disabled={busy || digits.length === 0}
            className="aspect-square rounded-full text-sm font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors"
          >
            ⌫
          </button>
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={busy || digits.length < 4}
          className="w-full rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-black py-3 text-sm font-semibold disabled:opacity-30 transition-opacity"
        >
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </div>

      <div className="flex-1" />
    </div>
  );
}
