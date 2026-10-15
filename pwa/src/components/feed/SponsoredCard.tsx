'use client';

/**
 * A sponsored card in the feed (owner, 2026-10-15, "like X"). Shows feed posts (no map place)
 * and the street ads of the person's area (billboards, sponsored pins). Always says
 * "Sponsored", can be hidden, counts one view per visit when it is half on screen, and a tap
 * when its button is used.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { boardInk } from '@/components/map/AdBoard';
import { CTA_LABELS, countAd, openAdTarget, type Ad } from '@/lib/adsApi';

const viewedThisVisit = new Set<string>();

const BTN =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function SponsoredCard({ ad, onHide, preview = false }: { ad: Ad; onHide?: (id: string) => void; preview?: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const street = ad.kind !== 'feed_post';
  const text = ad.kind === 'feed_post' ? ad.body : ad.line;
  const where = ad.kind === 'billboard' ? 'Billboard' : ad.kind === 'sponsored_pin' ? 'On the map' : null;

  useEffect(() => {
    if (preview || viewedThisVisit.has(ad._id) || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !viewedThisVisit.has(ad._id)) {
          viewedThisVisit.add(ad._id);
          void countAd(ad._id, 'view');
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad._id, preview]);

  const open = () => {
    if (preview) return;
    void countAd(ad._id, 'tap');
    openAdTarget(ad.target, router.push);
  };

  return (
    <Card padding="none" className="w-full overflow-hidden">
      <article ref={ref} aria-label={`Sponsored: ${ad.title}`} className="flex flex-col gap-3 p-4">
        <header className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-heading text-base font-extrabold"
            style={{ background: ad.colour, color: boardInk(ad.colour) }}
          >
            {ad.title.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-bold text-navy">{ad.title}</span>
            <span className="text-xs font-semibold text-muted">
              {ad._id.startsWith('sample-') ? (
                <span className="font-extrabold text-[#8A5A00]">Sample ad · preview, not a real business</span>
              ) : (
                <>Sponsored{where ? ` · ${where} in ${ad.area.lga}` : ''}</>
              )}
            </span>
          </span>
          {onHide ? (
            <button
              type="button"
              onClick={() => onHide(ad._id)}
              aria-label={`Hide this ad from ${ad.title}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          ) : null}
        </header>

        {text ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-navy">{text}</p> : null}

        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" loading="lazy" className="max-h-[420px] w-full rounded-2xl bg-background object-cover" />
        ) : null}

        {ad.target || street ? (
          <div className="flex gap-2">
            {ad.target ? (
              <button type="button" onClick={open} className={`${BTN} flex-1 bg-primary text-white hover:bg-brand-green-dark`}>
                {ad.cta ? CTA_LABELS[ad.cta] : 'Visit'}
              </button>
            ) : null}
            {street ? (
              <Link href="/huud" className={`${BTN} flex-1 border border-line bg-white text-navy hover:bg-background`}>
                See on the map
              </Link>
            ) : null}
          </div>
        ) : null}
      </article>
    </Card>
  );
}
