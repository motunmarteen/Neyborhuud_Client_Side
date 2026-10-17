'use client';

/**
 * Today's Pulse (tracker M-12, mockup): tap the ⚡ on the map home's ribbon. One sheet with
 * what is happening around you (weather now, go-slows), the real 7-day forecast for where
 * the map is, today's naira exchange rates and the news. Real figures only: a part with no
 * data says so instead of guessing.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { usePulseNews } from '@/hooks/usePulseNews';
import { fetchWeekForecast } from '@/lib/weatherClient';
import { mapWeatherFromWmo, WEATHER_WORDS } from '@/lib/mapWeather';
import type { PulseLocalItem } from '@/components/feed/FeedNewsTicker';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Where the map is, for the forecast. */
  center: { lat: number; lng: number } | null;
  /** "Egbeda" etc., when known. */
  areaName?: string;
  local: PulseLocalItem[];
};

function dayName(date: string, i: number): string {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-NG', { weekday: 'short' });
}

const Heading = ({ children }: { children: string }) => (
  <h3 className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-muted">{children}</h3>
);

const Empty = ({ children }: { children: string }) => (
  <p className="rounded-2xl bg-background px-4 py-3 text-sm font-semibold text-muted">{children}</p>
);

export function TodaysPulseSheet({ open, onClose, center, areaName, local }: Props) {
  const { rates, updatedAt } = useExchangeRates();
  const news = usePulseNews();
  const lat = center ? Number(center.lat.toFixed(2)) : null;
  const lng = center ? Number(center.lng.toFixed(2)) : null;
  const week = useQuery({
    queryKey: ['pulse', 'week', lat, lng],
    queryFn: () => fetchWeekForecast(lat!, lng!),
    enabled: open && lat != null && lng != null,
    staleTime: 60 * 60_000,
    retry: 1,
  });
  const month = new Date().getMonth();

  return (
    <AppBottomSheet open={open} onClose={onClose} title="Today's Pulse">
      <div className="flex flex-col gap-5 pb-2">
        {local.length ? (
          <section className="flex flex-col gap-2" aria-label="Around you">
            <Heading>{areaName ? `Around you in ${areaName}` : 'Around you'}</Heading>
            <ul className="flex flex-col gap-2">
              {local.map((l) => (
                <li key={l.text}>
                  {l.href ? (
                    <Link href={l.href} onClick={onClose} className="block rounded-2xl bg-background px-4 py-3 text-sm font-bold text-navy hover:bg-green-soft">
                      {l.text}
                    </Link>
                  ) : (
                    <p className="rounded-2xl bg-background px-4 py-3 text-sm font-bold text-navy">{l.text}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col gap-2" aria-label="Weather this week">
          <Heading>Weather this week</Heading>
          {week.data?.length ? (
            <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {week.data.map((d, i) => {
                const words = WEATHER_WORDS[mapWeatherFromWmo(d.code, month)];
                return (
                  <li
                    key={d.date}
                    className="flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl bg-background px-2 py-3"
                    aria-label={`${dayName(d.date, i)}: ${words.label}, high ${Math.round(d.max)}°, low ${Math.round(d.min)}°`}
                  >
                    <span className="text-xs font-bold text-muted">{dayName(d.date, i)}</span>
                    <span className="text-2xl" aria-hidden>
                      {words.icon}
                    </span>
                    <span className="text-sm font-black text-navy">{Math.round(d.max)}°</span>
                    <span className="text-xs font-semibold text-muted">{Math.round(d.min)}°</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>{week.isLoading ? 'Getting the forecast…' : 'The forecast is not available right now.'}</Empty>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="Exchange rates today">
          <Heading>Exchange rates · today</Heading>
          {rates.length ? (
            <>
              <ul className="grid grid-cols-2 gap-2">
                {rates.map((r) => (
                  <li key={r.currency} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                    <span className="text-sm font-bold text-navy">
                      1 {r.symbol} <span className="text-xs text-muted">{r.currency}</span>
                    </span>
                    <span className="text-sm font-black text-brand-green-dark">
                      ₦{r.rate.toLocaleString('en-NG', { maximumFractionDigits: r.rate < 50 ? 2 : 0 })}
                    </span>
                  </li>
                ))}
              </ul>
              {updatedAt ? (
                <p className="px-1 text-xs font-semibold text-muted">
                  Market rates, checked at {updatedAt.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}. Your bank or BDC may differ.
                </p>
              ) : null}
            </>
          ) : (
            <Empty>Rates are not available right now.</Empty>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="News">
          <Heading>News</Heading>
          {news.length ? (
            <ul className="flex flex-col gap-2">
              {news.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-0.5 rounded-2xl bg-background px-4 py-3 hover:bg-green-soft"
                  >
                    <span className="text-sm font-bold text-navy">{n.title}</span>
                    <span className="text-xs font-semibold text-muted">{n.sourceName}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No news right now.</Empty>
          )}
          <Link href="/local-news?tab=nigeria" onClick={onClose} className="px-1 text-sm font-bold text-brand-green-dark">
            More news
          </Link>
        </section>
      </div>
    </AppBottomSheet>
  );
}
