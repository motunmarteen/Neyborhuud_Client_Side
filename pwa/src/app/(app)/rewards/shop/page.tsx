'use client';

/**
 * HuudCredit shop (Phase 7, G-13): map skins, profile frames, shout-outs and birthday boards.
 * Nothing here buys trust, level or rank. Map skins only change your own map; frames show
 * on your profile. Prices come from the server's one price list.
 */

import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { getErrorMessage } from '@/lib/error-handler';
import { useBuyItem, useEquipItem, useShop, type ShopItem } from '@/hooks/usePhase7';

const SECTIONS: { kind: ShopItem['kind']; title: string; note: string }[] = [
  { kind: 'map_skin', title: 'Map skins', note: 'Changes how your map home looks, only on your phone.' },
  { kind: 'frame', title: 'Profile frames', note: 'A ring around your photo that neighbours see.' },
];

export default function ShopPage() {
  const { data, isLoading, isError, refetch } = useShop();
  const buy = useBuyItem();
  const equip = useEquipItem();

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <div>
            <h1 className="font-heading text-xl font-black text-navy">HuudCredit shop</h1>
            <p className="text-xs font-semibold text-muted">Treat yourself. Nothing here buys trust or rank.</p>
          </div>
          {data ? (
            <p className="shrink-0 font-heading text-lg font-black text-navy">
              <span aria-hidden>🪙</span> {data.balance.toLocaleString('en-NG')}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-[22px]" />
        ) : isError || !data ? (
          <ErrorState onRetry={() => void refetch()} homeHref={null} />
        ) : (
          <>
            {SECTIONS.map((sec) => {
              const slot = sec.kind === 'map_skin' ? 'mapSkin' : 'profileFrame';
              const wearing = data.equipped[slot];
              return (
                <section key={sec.kind} aria-labelledby={`${sec.kind}-h`} className="flex flex-col gap-2">
                  <div className="px-1">
                    <h2 id={`${sec.kind}-h`} className="font-heading text-lg font-extrabold text-navy">
                      {sec.title}
                    </h2>
                    <p className="text-xs font-semibold text-muted">{sec.note}</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {data.items
                      .filter((i) => i.kind === sec.kind)
                      .map((i) => {
                        const owned = data.owned.includes(i.id);
                        const on = wearing === i.id;
                        return (
                          <li key={i.id} className={`flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${on ? 'ring-2 ring-brand-green-dark' : ''}`}>
                            <span aria-hidden className={`nh-shop-swatch nh-shop-swatch--${i.id}`}>
                              {i.emoji}
                            </span>
                            <span className="text-sm font-bold text-navy">{i.name}</span>
                            <span className="text-xs font-semibold leading-snug text-muted">{i.description}</span>
                            {owned ? (
                              <button
                                type="button"
                                disabled={equip.isPending}
                                onClick={() =>
                                  equip.mutate(
                                    { slot, itemId: on ? null : i.id },
                                    { onError: (err) => toast.error(getErrorMessage(err)) },
                                  )
                                }
                                className={`mt-auto min-h-10 rounded-full text-sm font-bold ${on ? 'border border-line bg-white text-navy' : 'bg-navy text-white'}`}
                              >
                                {on ? 'Take off' : 'Wear it'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={buy.isPending || data.balance < i.price}
                                onClick={() =>
                                  buy.mutate(i.id, {
                                    onSuccess: () => toast.success(`${i.name} is yours`),
                                    onError: (err) => toast.error(getErrorMessage(err)),
                                  })
                                }
                                className="mt-auto min-h-10 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-50"
                              >
                                🪙 {i.price}
                              </button>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </section>
              );
            })}

            <section aria-labelledby="more-h" className="flex flex-col gap-2">
              <h2 id="more-h" className="px-1 font-heading text-lg font-extrabold text-navy">
                For your neighbours
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
                {data.items
                  .filter((i) => i.kind === 'shoutout' || i.kind === 'birthday_board')
                  .map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-soft text-lg">
                        {i.emoji}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-bold text-navy">{i.name}</span>
                        <span className="text-xs font-semibold text-muted">
                          {i.kind === 'shoutout' ? 'Open a neighbour’s profile and tap “Give a shout-out”.' : i.description}
                        </span>
                      </span>
                      {i.href ? (
                        <Link href={i.href} className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white">
                          🪙 {i.price}
                        </Link>
                      ) : (
                        <span className="shrink-0 text-sm font-black text-[#A86F0A]">🪙 {i.price}</span>
                      )}
                    </li>
                  ))}
                <li>
                  <Link href="/projects" className="flex items-center gap-3 px-4 py-3 hover:bg-background">
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-lg">
                      🏗️
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-bold text-navy">Community projects</span>
                      <span className="text-xs font-semibold text-muted">Put HuudCredit towards something your area needs</span>
                    </span>
                    <span aria-hidden className="material-symbols-outlined text-muted">
                      chevron_right
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
