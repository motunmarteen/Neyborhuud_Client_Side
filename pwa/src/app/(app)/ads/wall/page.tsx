'use client';

/**
 * Ad Wall (owner, 2026-10-12, inspired by Lagos Life's sea plots): a grid of plots for the
 * person's LGA. Live plots show the business; tap to open its link. Free plots can be booked.
 * Plots held by an unpaid booking or waiting for review show as taken.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { countAd, fetchAdPricing, fetchWall, openAdTarget, priceText, userArea, type WallPlot } from '@/lib/adsApi';
import { boardInk } from '@/components/map/AdBoard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const CARD = 'rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';
const MAIN_BTN =
  'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark';

export default function AdWallPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuth();
  const area = userArea(user);
  const [picked, setPicked] = useState<{ row: number; col: number } | null>(null);
  const [opened, setOpened] = useState<WallPlot | null>(null);

  const wall = useQuery({
    queryKey: ['ads', 'wall', area?.lga, area?.state],
    queryFn: () => fetchWall(area!.lga, area!.state),
    enabled: !!area,
  });
  const { data: pricing } = useQuery({ queryKey: ['ads', 'pricing'], queryFn: fetchAdPricing, staleTime: 10 * 60_000 });

  if (!userLoading && !area) {
    return (
      <Shell>
        <EmptyState
          icon="📍"
          title="Set your area first"
          description="The Ad Wall belongs to your LGA. Add your area in your profile to see it."
          action={{ label: 'Open settings', href: '/settings' }}
        />
      </Shell>
    );
  }

  const size = wall.data?.size ?? 12;
  const byCell = new Map((wall.data?.plots ?? []).map((p) => [`${p.row}:${p.col}`, p]));
  const live = (wall.data?.plots ?? []).filter((p) => p.live).length;

  const tapPlot = (row: number, col: number) => {
    const p = byCell.get(`${row}:${col}`);
    if (p?.live) {
      setPicked(null);
      setOpened(p);
      if (p.id) void countAd(p.id, 'tap');
      return;
    }
    if (p) return; // taken
    setOpened(null);
    setPicked({ row, col });
  };

  return (
    <Shell>
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="font-heading text-lg font-extrabold text-navy">{area ? `${area.lga} Ad Wall` : 'Ad Wall'}</h1>
          {wall.data ? <span className="text-xs font-bold text-muted">{live} live</span> : null}
        </div>
        {wall.isError ? (
          <ErrorState onRetry={() => void wall.refetch()} homeHref={null} className="!px-0" />
        ) : !wall.data ? (
          <Skeleton className="aspect-square w-full rounded-[16px]" />
        ) : (
          <div className="nh-wall" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} role="group" aria-label={`Ad Wall, ${size} by ${size} plots`}>
            {Array.from({ length: size * size }, (_, i) => {
              const row = Math.floor(i / size);
              const col = i % size;
              const p = byCell.get(`${row}:${col}`);
              const state = p?.live ? 'live' : p ? 'taken' : 'free';
              const selected = picked?.row === row && picked.col === col;
              return (
                <button
                  key={i}
                  type="button"
                  className="nh-wall__plot"
                  data-state={state}
                  aria-pressed={state === 'free' ? selected : undefined}
                  aria-label={
                    p?.live ? `Ad: ${p.title}` : p ? `Plot ${row + 1}-${col + 1}, taken` : `Plot ${row + 1}-${col + 1}, free`
                  }
                  disabled={state === 'taken'}
                  onClick={() => tapPlot(row, col)}
                  style={p?.live && p.colour ? { background: p.colour, color: boardInk(p.colour) } : undefined}
                >
                  {p?.live ? <span aria-hidden>{(p.title ?? '').slice(0, 10)}</span> : null}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs font-semibold text-muted">Tap a business to visit it. Tap an empty plot to book it.</p>
      </section>

      <div aria-live="polite">
        {opened ? (
          <section className={`${CARD} flex flex-col gap-2 p-4`}>
            <span className="self-start rounded-full bg-background px-2 py-0.5 text-[11px] font-extrabold text-navy">Ad</span>
            <h2 className="font-heading text-base font-extrabold text-navy">{opened.title}</h2>
            {opened.line ? <p className="text-sm text-muted">{opened.line}</p> : null}
            {opened.target ? (
              <button type="button" className={MAIN_BTN} onClick={() => openAdTarget(opened.target, router.push)}>
                Visit
              </button>
            ) : null}
          </section>
        ) : picked ? (
          <section className={`${CARD} flex flex-col gap-2 p-4`}>
            <h2 className="font-heading text-base font-extrabold text-navy">
              Plot {picked.row + 1}-{picked.col + 1} is free
            </h2>
            {pricing ? (
              <p className="text-sm text-muted">
                {priceText(pricing.prices.plot.NGN, 'NGN')} or {priceText(pricing.prices.plot.HC, 'HC')} a week.
              </p>
            ) : null}
            <Link href={`/ads/new?kind=plot&row=${picked.row}&col=${picked.col}`} className={MAIN_BTN}>
              Book this plot
            </Link>
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">{children}</main>
    </div>
  );
}
