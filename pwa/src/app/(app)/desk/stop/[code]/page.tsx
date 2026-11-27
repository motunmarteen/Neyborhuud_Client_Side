'use client';

/**
 * "Stop alerts" link at the end of every SOS text we send a security desk (owner 2026-11-27).
 * One tap, no account; asks first so a link preview can't stop alerts by itself.
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/error-handler';
import { sosHelpService } from '@/services/sosHelp.service';

export default function DeskStopPage() {
  const { code } = useParams<{ code: string }>();
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await sosHelpService.stopDeskByCode(code);
      setDone(res.data?.name ?? 'This desk');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBrowseLayout>
      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <span className="text-4xl" aria-hidden>🛡️</span>
        {done ? (
          <>
            <h1 className="font-heading text-xl font-extrabold text-navy">Alerts stopped</h1>
            <p className="text-[15px] text-navy">{done} won&apos;t get SOS texts any more. Thank you for helping your neighbours.</p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-xl font-extrabold text-navy">Stop SOS alerts?</h1>
            <p className="text-[15px] leading-relaxed text-navy">
              This number will stop getting texts when someone near you presses SOS. A neighbour can ask you to join again later.
            </p>
            <Button variant="danger" fullWidth loading={busy} onClick={() => void stop()}>
              Stop alerts
            </Button>
          </>
        )}
        {error ? <p role="alert" className="text-[14px] font-bold text-brand-red">{error}</p> : null}
      </section>
    </AppBrowseLayout>
  );
}
