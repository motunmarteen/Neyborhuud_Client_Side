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
 * Reached from: bookmarking this URL directly (the intended real-world use —
 * see the settings page's warning about not labeling the bookmark). The
 * settings page's "Practice" entry point deliberately goes to a SEPARATE
 * route (`/safety/panic-pin/practice`) that looks identical but never calls
 * the real verify endpoint — see that file for why a shared "enter" screen
 * used for both real and practice use was unsafe.
 */

import { useRouter } from 'next/navigation';
import { PanicPinKeypad } from '@/components/safety/PanicPinKeypad';
import { safetyService } from '@/services/safety.service';
import { getGeolocation } from '@/lib/nativeGeolocation';

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

  const handleSubmit = async (pin: string) => {
    try {
      const coords = await getCoords();
      await safetyService.verifyPanicPin({
        pin,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      // Identical presentation regardless of outcome — see file header.
      return { message: 'Verified.' };
    } catch {
      return { message: 'Incorrect PIN.' };
    }
  };

  return <PanicPinKeypad onSubmit={handleSubmit} onCancel={() => router.back()} />;
}
