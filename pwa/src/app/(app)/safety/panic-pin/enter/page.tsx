'use client';

/**
 * Panic PIN entry — the actual duress-trigger surface.
 *
 * Deliberately NOT styled or labeled as a safety feature. This screen must
 * look like an unremarkable "Enter PIN to continue" gate to anyone watching
 * over the user's shoulder (the entire premise of a duress code). Do not
 * add the words "panic", "SOS", "safety", "duress", "guardian", or any
 * shield/alarm iconography to this file — that defeats the feature.
 *
 * On the correct PIN: fires a silent SOS in the background (guardians are
 * notified; nothing on this screen indicates it happened) and shows a plain
 * "Verified" confirmation, identical in tone to a wrong-PIN rejection.
 * On an incorrect PIN: shows a generic "Incorrect PIN" message, exactly
 * what a real PIN gate would show — no distinguishable behavior between
 * "wrong PIN" and "correct PIN but SOS failed to send" from what's visible
 * on screen.
 *
 * Reached from: the Panic PIN settings page ("Practice entering your PIN"),
 * and a fast-access shortcut in the SOS quick-actions area — see
 * src/app/(app)/safety/panic-pin/page.tsx and SentinelBottomSheet.tsx.
 */

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safetyService } from '@/services/safety.service';
import { getGeolocation } from '@/lib/nativeGeolocation';

const MAX_DIGITS = 6;
const DIGIT_PLACEHOLDERS = Array.from({ length: MAX_DIGITS });

function getCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const geo = getGeolocation();
    if (!geo) {
      resolve(null);
      return;
    }
    geo.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}

export default function EnterPinPage() {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const busyRef = useRef(false);

  const submit = useCallback(async (pin: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage(null);

    try {
      const coords = await getCoords();
      await safetyService.verifyPanicPin({
        pin,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      // Identical presentation regardless of outcome — see file header.
      setMessage('Verified.');
    } catch {
      setMessage('Incorrect PIN.');
    } finally {
      setDigits('');
      setBusy(false);
      busyRef.current = false;
    }
  }, []);

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
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Enter PIN</p>
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
            onClick={() => router.back()}
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
