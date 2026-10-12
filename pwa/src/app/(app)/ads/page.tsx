'use client';

/**
 * Map ads hub (owner, 2026-10-12): what the three formats are, what they cost (from the
 * server, never hard-coded here), and the way in to booking, the Ad Wall and "My ads".
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AD_KINDS, fetchAdPricing, priceText } from '@/lib/adsApi';
import { AdBoard } from '@/components/map/AdBoard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

const CARD = 'rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';
const MAIN_BTN =
  'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark';
const SOFT_BTN =
  'inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-[15px] font-bold text-navy transition-colors hover:bg-background';

export default function AdsHubPage() {
  const { data: pricing, isLoading, isError, refetch } = useQuery({ queryKey: ['ads', 'pricing'], queryFn: fetchAdPricing, staleTime: 10 * 60_000 });

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <section className={`${CARD} flex flex-col items-center gap-3 overflow-hidden p-5 text-center`}>
          <div className="flex w-full justify-center rounded-[16px] bg-[linear-gradient(180deg,#9ED3F5,#DDF0FB)] px-4 pb-3 pt-6">
            <AdBoard title="Mama Bisi's Kitchen" line="Hot amala till 9pm" colour="#E8892B" />
          </div>
          <h1 className="font-heading text-xl font-extrabold text-navy">Put your business on the map</h1>
          <p className="text-sm text-muted">
            Neighbours see your ad on the map where they live. Every ad is checked by our team before it goes live, and is marked
            &ldquo;Ad&rdquo;.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Link href="/ads/new" className={`${MAIN_BTN} flex-1`}>
              Book an ad
            </Link>
            <Link href="/ads/mine" className={`${SOFT_BTN} flex-1`}>
              My ads
            </Link>
          </div>
        </section>

        <section aria-labelledby="formats-heading" className="flex flex-col gap-2">
          <h2 id="formats-heading" className="px-1 font-heading text-lg font-extrabold text-navy">
            Three ways to show up
          </h2>
          {isError ? (
            <ErrorState onRetry={() => void refetch()} homeHref={null} />
          ) : (
            <ul className={`${CARD} divide-y divide-line overflow-hidden`}>
              {AD_KINDS.map((k) => {
                const p = pricing?.prices[k.kind];
                return (
                  <li key={k.kind}>
                    <Link href={`/ads/new?kind=${k.kind}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background">
                      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-soft text-xl">
                        {k.icon}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-bold text-navy">{k.name}</span>
                        <span className="text-xs font-semibold text-muted">{k.what}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end text-right">
                        {isLoading || !p ? (
                          <Skeleton className="h-4 w-16 rounded-full" />
                        ) : (
                          <>
                            <span className="font-heading text-sm font-black text-navy">{priceText(p.NGN, 'NGN')}</span>
                            <span className="text-[11px] font-bold text-[#A86F0A]">or {priceText(p.HC, 'HC')}</span>
                            <span className="text-[11px] font-semibold text-muted">a week</span>
                          </>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {pricing && !pricing.naira ? (
            <p className="px-1 text-xs font-semibold text-muted">Paying in naira opens soon. For now, pay with HuudCredit.</p>
          ) : null}
        </section>

        <Link href="/ads/wall" className={`${CARD} flex items-center gap-3 p-4 transition-colors hover:bg-background`}>
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-soft text-xl">
            🧱
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-bold text-navy">Your area&rsquo;s Ad Wall</span>
            <span className="text-xs font-semibold text-muted">See who is advertising near you, and pick a free plot.</span>
          </span>
          <span aria-hidden className="material-symbols-outlined text-muted">
            chevron_right
          </span>
        </Link>

        <section className="flex flex-col gap-1 rounded-[22px] bg-amber-soft p-4">
          <h2 className="font-heading text-base font-extrabold text-navy">Rules</h2>
          <ul className="list-disc pl-5 text-sm text-navy">
            <li>No ads on safety alerts, SOS or crime reports.</li>
            <li>Nothing false, hateful, adult or for betting.</li>
            <li>If we don&rsquo;t approve your ad, you get your money back.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
