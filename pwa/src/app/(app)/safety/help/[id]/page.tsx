'use client';

/**
 * "Help them": what a guardian sees when someone they protect raises an SOS (owner 2026-11-27).
 *
 * Order of the screen follows what helps most, fastest:
 *   1. who and where, and how long ago
 *   2. I'm responding / Call 112 for them (with what to say, ready to read out)
 *   3. call them (never in a silent SOS), the security desks covering that spot
 *   4. who else is responding, so people don't all wait on each other
 * It refreshes every 10 seconds while the SOS is live.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { RowAvatar } from '@/components/friendship/PeopleRows';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useStarted } from '@/hooks/useStarted';
import { EMERGENCY_NUMBER, EMERGENCY_TEL } from '@/lib/emergency';
import { mapsUrl } from '@/lib/guardian-alerts';
import { getErrorMessage } from '@/lib/error-handler';
import { sosHelpScript } from '@/lib/sosHelpScript';
import { sosHelpService, type SosHelpView } from '@/services/sosHelp.service';

const CARD = 'rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]';

function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  const h = Math.round(m / 60);
  return h === 1 ? '1 hour ago' : `${h} hours ago`;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

export default function SosHelpPage() {
  const started = useStarted();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<'respond' | null>(null);

  const q = useQuery({
    queryKey: ['sos-help', id],
    queryFn: async () => (await sosHelpService.getHelp(id)).data as SosHelpView,
    enabled: started && !!id,
    refetchInterval: (query) => ((query.state.data as SosHelpView | undefined)?.live ? 10_000 : false),
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // Answered from the SOS call or the notification's "I'm responding" button: record it once.
  const autoRespondedRef = useRef(false);
  useEffect(() => {
    const v = q.data;
    if (!v || autoRespondedRef.current || !v.live || v.isOwner || v.youAreResponding) return;
    if (new URLSearchParams(window.location.search).get('respond') !== '1') return;
    autoRespondedRef.current = true;
    void sosHelpService
      .responding(id)
      .then(() => {
        toast.success(`${v.person.firstName || 'They'} can see you're responding`);
        return qc.invalidateQueries({ queryKey: ['sos-help', id] });
      })
      .catch(() => {
        autoRespondedRef.current = false;
      });
  }, [q.data, id, qc]);

  if (!started || q.isLoading) {
    return (
      <AppBrowseLayout>
        <div className={`${CARD} h-40 animate-pulse motion-reduce:animate-none`} aria-hidden />
        <div className={`${CARD} h-56 animate-pulse motion-reduce:animate-none`} aria-hidden />
      </AppBrowseLayout>
    );
  }
  if (q.isError || !q.data) {
    return (
      <AppBrowseLayout>
        <ErrorState title="Can't open this SOS" description={getErrorMessage(q.error)} onRetry={() => void q.refetch()} />
      </AppBrowseLayout>
    );
  }

  const v = q.data;
  const first = v.person.firstName || v.person.name.split(' ')[0];
  const refresh = () => qc.invalidateQueries({ queryKey: ['sos-help', id] });

  const respond = async () => {
    setBusy('respond');
    try {
      await sosHelpService.responding(id);
      toast.success(`${first} can see you're responding`);
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  // Record first (so others see "calling 112"), but never hold up the call: the dialer opens anyway.
  const call112 = () => {
    void sosHelpService.called112(id).then(refresh).catch(() => undefined);
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(sosHelpScript(v));
      toast.success('Copied');
    } catch {
      toast.error('Could not copy. Read it from the screen.');
    }
  };

  const others = v.responders.filter((r) => !r.isYou);
  const ended = !v.live;

  return (
    <AppBrowseLayout>
      {v.isDrill ? (
        <p className="rounded-2xl bg-amber-soft p-3 text-[14px] font-bold text-navy">
          🧪 This is a practice SOS. Don&apos;t call 112. Tap &quot;I&apos;m responding&quot; to practise.
        </p>
      ) : null}

      {/* 1. Who and where */}
      <section className={`${CARD} ${ended ? '' : 'ring-2 ring-brand-red/70'}`} aria-live="polite">
        <div className="flex items-center gap-3">
          <RowAvatar src={v.person.photo} name={v.person.name} danger={!ended} />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-extrabold leading-tight text-navy">
              {ended ? (v.status === 'cancelled' ? `${first} cancelled the SOS` : `${first} is safe now`) : `${first} needs help`}
            </h1>
            <p className="text-[13px] text-muted">
              {v.silent ? '🤫 Silent SOS · ' : ''}Pressed SOS {ago(v.startedAt, now)}
            </p>
          </div>
        </div>
        {v.location ? (
          <div className="mt-3 rounded-2xl bg-background p-3">
            <p className="text-[15px] font-bold text-navy">
              {[v.location.address, v.location.lga, v.location.state].filter(Boolean).join(', ') || 'Location from their phone'}
            </p>
            <p className="mt-0.5 text-[12px] tabular-nums text-muted">
              {v.location.lat.toFixed(5)}, {v.location.lng.toFixed(5)}
            </p>
            <a
              href={mapsUrl(v.location.lat, v.location.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[14px] font-bold text-brand-green-dark"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>map</span>
              Open in Maps for directions
            </a>
          </div>
        ) : null}
      </section>

      {/* 2. The two main actions */}
      {!ended ? (
        <section className="flex flex-col gap-2">
          {!v.youAreResponding ? (
            <Button size="lg" fullWidth loading={busy === 'respond'} onClick={() => void respond()}>
              I&apos;m responding
            </Button>
          ) : (
            <p className="rounded-2xl bg-green-soft p-3 text-center text-[14px] font-bold text-brand-green-dark">
              ✓ {first} can see you&apos;re responding
            </p>
          )}
          {!v.isDrill ? (
            <a
              href={EMERGENCY_TEL}
              onClick={call112}
              className="flex min-h-[60px] items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-[17px] font-extrabold text-white shadow-[0_4px_14px_rgba(229,72,77,0.3)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>call</span>
              Call {EMERGENCY_NUMBER} for {first}
            </a>
          ) : null}
        </section>
      ) : null}

      {/* What to say */}
      {!ended && !v.isDrill ? (
        <section className={CARD}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-base font-extrabold text-navy">What to tell {EMERGENCY_NUMBER}</h2>
            <button type="button" onClick={() => void copyScript()} className="text-[14px] font-bold text-brand-green-dark">
              Copy
            </button>
          </div>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-navy">{sosHelpScript(v)}</p>
          <p className="mt-2 text-[13px] text-muted">If 112 doesn&apos;t answer, call the security desks below or a neighbour close to them.</p>
        </section>
      ) : null}

      {/* 3. Call them / desks */}
      {!ended ? (
        <section className={`${CARD} flex flex-col gap-2`}>
          <h2 className="font-heading text-base font-extrabold text-navy">Who else can reach them</h2>
          {v.silent ? (
            <p className="rounded-2xl bg-amber-soft p-3 text-[14px] font-semibold text-navy">
              Silent SOS: don&apos;t call {first}. A ringing phone could put them in more danger.
            </p>
          ) : v.person.phone ? (
            <a href={`tel:${v.person.phone}`} className="flex min-h-12 items-center justify-between rounded-2xl bg-background px-3">
              <span className="text-[15px] font-bold text-navy">Call {first}</span>
              <span className="text-[13px] tabular-nums text-muted">{v.person.phone}</span>
            </a>
          ) : null}
          {v.securityDesks.length > 0 ? (
            v.securityDesks.map((d) => (
              <a key={d.id} href={`tel:${d.phone}`} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl bg-background px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-navy">{d.name}</span>
                  <span className="block text-[12px] text-muted">{d.kindLabel}</span>
                </span>
                <span className="shrink-0 text-[13px] font-bold tabular-nums text-brand-green-dark">Call {d.phone}</span>
              </a>
            ))
          ) : (
            <p className="text-[13px] text-muted">No estate security or vigilante is listed near {first} yet.</p>
          )}
          {v.securityDesksAlertedAt ? (
            <p className="text-[13px] font-semibold text-brand-green-dark">We texted these desks at {time(v.securityDesksAlertedAt)}.</p>
          ) : null}
        </section>
      ) : null}

      {/* 4. Who's on it */}
      <section className={CARD}>
        <h2 className="font-heading text-base font-extrabold text-navy">Who&apos;s responding</h2>
        {v.responders.length === 0 ? (
          <p className="mt-1 text-[14px] text-muted">Nobody yet. You could be the first.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {[...v.responders.filter((r) => r.isYou), ...others].map((r) => (
              <li key={r.guardianId} className="flex items-center justify-between gap-2 text-[14px]">
                <span className="font-bold text-navy">{r.isYou ? 'You' : r.name}</span>
                <span className="text-muted">
                  {r.called112At ? `Called 112 at ${time(r.called112At)}` : r.respondingAt ? `Responding since ${time(r.respondingAt)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppBrowseLayout>
  );
}
