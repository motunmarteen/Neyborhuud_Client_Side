'use client';

/**
 * My ads (owner, 2026-10-12): every booking with its status, dates, views and taps. Unpaid
 * bookings can be paid while their spot is still held. After the Bachs checkout the person
 * lands here with ?paid= (the payment is confirmed by the webhook, so we re-check for a
 * short while) or ?cancelled=.
 */

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AD_KINDS, fetchMyAds, payAdWithCredit, payAdWithNaira, priceText, STATUS_WORDS, type Ad } from '@/lib/adsApi';
import { getErrorMessage } from '@/lib/error-handler';
import { nhToast } from '@/lib/toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { boardInk } from '@/components/map/AdBoard';

const CARD = 'rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';
const TONE: Record<string, string> = {
  green: 'bg-green-soft text-brand-green-dark',
  amber: 'bg-amber-soft text-[#8A5A00]',
  blue: 'bg-[#E3EEF9] text-[#245B8F]',
  red: 'bg-[#FDECEE] text-[#C8102E]',
  neutral: 'bg-background text-muted',
};
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '');

export default function MyAdsPage() {
  return (
    <Suspense fallback={null}>
      <MyAds />
    </Suspense>
  );
}

function MyAds() {
  const params = useSearchParams();
  const paidId = params.get('paid');
  const cancelledId = params.get('cancelled');
  const [waitUntil] = useState(() => (paidId ? Date.now() + 60_000 : 0));

  const mine = useQuery({
    queryKey: ['ads', 'mine'],
    queryFn: fetchMyAds,
    // Back from the checkout: re-check every 4 s for up to a minute until the payment lands.
    refetchInterval: (q) => {
      if (!paidId || Date.now() > waitUntil) return false;
      const ad = q.state.data?.find((a) => a._id === paidId);
      return ad && ad.status === 'awaiting_payment' ? 4000 : false;
    },
  });
  const returning = paidId ? mine.data?.find((a) => a._id === paidId) : undefined;

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4">
        <div aria-live="polite">
          {returning ? (
            <p className={`rounded-[16px] px-4 py-3 text-sm font-bold ${returning.status === 'awaiting_payment' ? TONE.amber : TONE.green}`}>
              {returning.status === 'awaiting_payment'
                ? 'Confirming your payment… this can take a minute.'
                : 'Payment received. Your ad is in review.'}
            </p>
          ) : cancelledId ? (
            <p className={`rounded-[16px] px-4 py-3 text-sm font-bold ${TONE.neutral}`}>Payment cancelled. Your spot is held for a short while if you want to try again.</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between px-1">
          <h1 className="font-heading text-lg font-extrabold text-navy">My ads</h1>
          <Link href="/ads/new" className="text-sm font-bold text-brand-green-dark">
            + Book an ad
          </Link>
        </div>

        {mine.isError ? (
          <ErrorState onRetry={() => void mine.refetch()} homeHref="/ads" />
        ) : !mine.data ? (
          <>
            <Skeleton className="h-28 w-full rounded-[22px]" />
            <Skeleton className="h-28 w-full rounded-[22px]" />
          </>
        ) : mine.data.length === 0 ? (
          <EmptyState icon="🪧" title="No ads yet" description="Put your business on the map where your neighbours live." action={{ label: 'Book an ad', href: '/ads/new' }} />
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.data.map((ad) => (
              <AdRow key={ad._id} ad={ad} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function AdRow({ ad }: { ad: Ad }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (ad.status !== 'awaiting_payment') return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [ad.status]);

  const kind = AD_KINDS.find((k) => k.kind === ad.kind);
  const status = STATUS_WORDS[ad.status];
  const holdLeft = ad.holdExpiresAt ? new Date(ad.holdExpiresAt).getTime() - now : 0;
  const canPay = ad.status === 'awaiting_payment' && holdLeft > 0;

  const pay = async () => {
    setBusy(true);
    try {
      if (ad.price.currency === 'HC') {
        await payAdWithCredit(ad._id);
        nhToast.success('Paid. Your ad is in review');
        await qc.invalidateQueries({ queryKey: ['ads'] });
        setBusy(false);
      } else {
        window.location.assign(await payAdWithNaira(ad._id));
      }
    } catch (e) {
      nhToast.error('Payment did not go through', getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <li className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] text-xl"
          style={{ background: ad.colour, color: boardInk(ad.colour) }}
        >
          {kind?.icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-bold text-navy">{ad.title}</span>
          <span className="text-xs font-semibold text-muted">
            {kind?.name} · {ad.area.lga} · {ad.weeks} week{ad.weeks > 1 ? 's' : ''} · {priceText(ad.price.amount, ad.price.currency)}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${TONE[status.tone]}`}>{status.label}</span>
      </div>

      {ad.status === 'active' || ad.status === 'expired' ? (
        <p className="text-xs font-semibold text-muted">
          {ad.status === 'active' ? `Live until ${day(ad.endsAt)}` : `Ran ${day(ad.startsAt)} to ${day(ad.endsAt)}`} · 👀{' '}
          {(ad.stats?.views ?? 0).toLocaleString('en-NG')} views · 👆 {(ad.stats?.taps ?? 0).toLocaleString('en-NG')} taps
        </p>
      ) : null}
      {ad.status === 'rejected' ? (
        <p className="text-xs font-semibold text-navy">
          {ad.review?.reason ? `Reason: ${ad.review.reason}. ` : ''}
          {ad.refund?.status === 'done'
            ? 'Your HuudCredit has been returned.'
            : ad.refund?.status === 'manual_pending'
              ? 'Your naira refund is on its way.'
              : ''}
        </p>
      ) : null}
      {ad.status === 'awaiting_payment' ? (
        canPay ? (
          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Please wait…' : `Pay now (spot held ${Math.max(1, Math.ceil(holdLeft / 60_000))} min more)`}
          </button>
        ) : (
          <p className="text-xs font-semibold text-muted">The spot was released. Book again to try another.</p>
        )
      ) : null}
    </li>
  );
}
