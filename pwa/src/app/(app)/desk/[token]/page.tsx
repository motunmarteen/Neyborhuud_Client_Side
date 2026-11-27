'use client';

/**
 * The page a security desk opens from our SMS (owner 2026-11-27). No account needed: the link is
 * the key. The desk agrees to SOS alerts, or says no / stops them.
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useStarted } from '@/hooks/useStarted';
import { getErrorMessage } from '@/lib/error-handler';
import { sosHelpService, type DeskStatus } from '@/services/sosHelp.service';

const CARD = 'rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]';

export default function DeskLinkPage() {
  const started = useStarted();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<DeskStatus | null>(null);
  const [busy, setBusy] = useState<'agree' | 'stop' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['desk-link', token],
    queryFn: async () => (await sosHelpService.deskLink(token)).data!,
    enabled: started && !!token,
    retry: false,
  });

  const act = async (kind: 'agree' | 'stop') => {
    setBusy(kind);
    setError(null);
    try {
      const res = kind === 'agree' ? await sosHelpService.agreeDesk(token) : await sosHelpService.stopDeskByToken(token);
      setStatus(res.data?.status ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (!started || q.isLoading) {
    return (
      <AppBrowseLayout>
        <div className={`${CARD} h-56 animate-pulse motion-reduce:animate-none`} aria-hidden />
      </AppBrowseLayout>
    );
  }
  if (q.isError || !q.data) {
    return (
      <AppBrowseLayout>
        <ErrorState title="This link isn't valid" description="Ask the neighbour who listed you to add the desk again." />
      </AppBrowseLayout>
    );
  }

  const d = q.data;
  const now = status ?? d.status;
  const on = now === 'active' || now === 'pending_approval';
  const radius = d.coverRadiusMeters >= 1000 ? `${d.coverRadiusMeters / 1000} km` : `${d.coverRadiusMeters} m`;

  return (
    <AppBrowseLayout>
      <section className={`${CARD} flex flex-col gap-3`}>
        <span className="text-4xl" aria-hidden>🛡️</span>
        <h1 className="font-heading text-xl font-extrabold leading-tight text-navy">{d.name}</h1>
        <p className="text-[13px] font-semibold text-muted">{[d.kindLabel, d.lga, d.state].filter(Boolean).join(' · ')}</p>
        <p className="text-[15px] leading-relaxed text-navy">
          A neighbour listed this number on NeyborHuud. If you agree, when someone within {radius} of you presses SOS and their family
          hasn&apos;t answered in 30 seconds, we&apos;ll text this number their first name and where they are, so you can go and help.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-muted">
          <li>It&apos;s free. We never call you or send adverts.</li>
          <li>Every alert has a link to stop alerts at any time.</li>
          <li>We only start after a trusted neighbour in your area approves this desk.</li>
        </ul>

        {now === 'rejected' ? (
          <p className="rounded-2xl bg-background p-3 text-[14px] font-semibold text-navy">This desk wasn&apos;t approved, so it won&apos;t get alerts.</p>
        ) : on ? (
          <>
            <p className="rounded-2xl bg-green-soft p-3 text-[14px] font-bold text-brand-green-dark">
              {now === 'active' ? '✓ You get SOS alerts from your area.' : '✓ Thank you. Alerts start once a neighbour in your area approves this desk.'}
            </p>
            <Button variant="secondary" fullWidth loading={busy === 'stop'} onClick={() => void act('stop')}>
              Stop alerts
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Button fullWidth size="lg" loading={busy === 'agree'} onClick={() => void act('agree')}>
              Yes, send us SOS alerts
            </Button>
            {now === 'pending_consent' ? (
              <Button variant="secondary" fullWidth loading={busy === 'stop'} onClick={() => void act('stop')}>
                No, this isn&apos;t us
              </Button>
            ) : (
              <p className="text-center text-[13px] text-muted">Alerts are stopped.</p>
            )}
          </div>
        )}
        {error ? <p role="alert" className="text-[14px] font-bold text-brand-red">{error}</p> : null}
      </section>
    </AppBrowseLayout>
  );
}
