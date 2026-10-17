'use client';

/**
 * A shared safety alert, open to anyone (owner 2026-10-17, "share safely"). It always shows
 * how the alert stands when the link is opened, never who reported it or the exact spot.
 */

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ageWords, areaName, fetchPublicAlert, statusWords, type PublicAlert } from '@/lib/publicAlert';
import { rememberRef, signupHref } from '@/lib/visitor';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';

const TONES = {
  green: 'bg-green-soft text-brand-green-dark',
  amber: 'bg-amber-soft text-[#8A5A00]',
  red: 'bg-red-soft text-brand-red',
};

export default function PageClient() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [alert, setAlert] = useState<PublicAlert | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [joinHref, setJoinHref] = useState('/signup');

  useEffect(() => {
    rememberRef(params.get('ref'));
    setJoinHref(signupHref());
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchPublicAlert(id)
      .then(setAlert)
      .catch(() => setFailed(true));
  }, [id]);

  let body: ReactNode;
  if (failed) {
    body = <p className="text-sm font-semibold text-muted">Could not load this alert. Check your network and try again.</p>;
  } else if (alert === undefined) {
    body = <div className="h-40 animate-pulse rounded-[22px] bg-white motion-reduce:animate-none" />;
  } else if (alert === null) {
    body = <p className="text-sm font-semibold text-muted">This alert could not be found.</p>;
  } else if (alert.state === 'ended') {
    body = (
      <div className="flex flex-col gap-2 rounded-[22px] bg-white p-5">
        <span className="self-start rounded-full bg-background px-3 py-1 text-xs font-black text-muted">Ended</span>
        <h1 className="font-heading text-xl font-extrabold text-navy">This alert has ended</h1>
        <p className="text-sm font-semibold text-muted">
          It is no longer active, so please don&apos;t forward it again. Open NeyborHuud to see what is happening now.
        </p>
        <Link href="/huud" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-bold text-white">
          See what is happening now
        </Link>
      </div>
    );
  } else {
    const s = statusWords(alert);
    const mapHref = alert.mapCentre ? `/huud?lat=${alert.mapCentre.lat}&lng=${alert.mapCentre.lng}` : '/huud';
    body = (
      <div className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${TONES[s.tone]}`}>{s.badge}</span>
          {alert.severity ? (
            <span className="rounded-full bg-background px-3 py-1 text-xs font-bold capitalize text-navy">{alert.severity}</span>
          ) : null}
        </div>
        <h1 className="font-heading text-xl font-extrabold text-navy">🚨 {alert.title}</h1>
        {alert.body ? <p className="whitespace-pre-line text-[15px] font-semibold text-navy">{alert.body}</p> : null}
        <dl className="flex flex-col gap-1 text-sm font-semibold text-muted">
          <div>
            <dt className="inline">Where: </dt>
            <dd className="inline font-bold text-navy">{areaName(alert.area)}</dd>
          </div>
          <div>
            <dt className="inline">Reported: </dt>
            <dd className="inline font-bold text-navy">{ageWords(alert.createdAt)}</dd>
          </div>
          <div>
            <dt className="inline">Status: </dt>
            <dd className="inline font-bold text-navy">{s.line}</dd>
          </div>
        </dl>
        {alert.status !== 'confirmed' ? (
          <p className="rounded-2xl bg-amber-soft p-3 text-sm font-semibold text-navy">
            {alert.status === 'disputed'
              ? 'Neighbours who were there say this may not be true. Please check before you act or forward it.'
              : 'This has not been confirmed yet. Please check before you act or forward it.'}
          </p>
        ) : null}
        <p className="text-sm font-semibold text-muted">In danger? Call 112 (or 767 in Lagos). For a road accident, call 122.</p>
        <div className="flex flex-col gap-2">
          <Link href={mapHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-bold text-white">
            See the area live on the map
          </Link>
          <Link href={joinHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-[15px] font-bold text-navy">
            Join free to get alerts for your street
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="flex flex-col gap-3 py-2">
        <p className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-muted">Safety alert from NeyborHuud</p>
        {body}
        <p className="px-1 text-xs font-semibold text-muted">We never show who reported an alert or the exact spot, only the area.</p>
      </div>
    </AppBrowseLayout>
  );
}
