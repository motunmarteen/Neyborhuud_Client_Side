'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { newsService } from '@/services/news.service';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { RssArticle } from '@/types/incident';

type PulseItem =
  | { kind: 'news'; text: string }
  | { kind: 'fx'; currency: string; symbol: string; rate: number };

export function FeedNewsTicker() {
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [paused, setPaused] = useState(false);
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const { rates } = useExchangeRates();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await newsService.getArticles({ region: 'nigeria', limit: 8 });
        if (!cancelled && items.length > 0) setArticles(items);
      } catch {
        try {
          const fallback = await newsService.getMultipleFeeds(
            [{ id: 'punch', name: 'Punch' }, { id: 'vanguard', name: 'Vanguard' }],
            8,
          );
          if (!cancelled && fallback.length > 0) setArticles(fallback);
        } catch { /* silent */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const headlines = articles.map((a) => a.title).filter(Boolean);

  // Nothing to show yet
  if (headlines.length === 0 && rates.length === 0) return null;

  // Interleave: FX rate, then 2 headlines, repeat — so money + news weave together
  const items: PulseItem[] = [];
  let h = 0;
  let f = 0;
  const total = headlines.length + rates.length;
  while (items.length < total) {
    if (rates.length > 0 && f < rates.length) {
      const r = rates[f++];
      items.push({ kind: 'fx', currency: r.currency, symbol: r.symbol, rate: r.rate });
    }
    for (let k = 0; k < 2 && h < headlines.length; k++) {
      items.push({ kind: 'news', text: headlines[h++] });
    }
    if (f >= rates.length && h >= headlines.length) break;
  }

  const renderItem = (item: PulseItem, key: number): ReactNode => {
    if (item.kind === 'fx') {
      return (
        <button
          key={key}
          type="button"
          className="feed-news-ticker__item feed-news-ticker__item--fx"
          onClick={() => router.push('/local-news?tab=nigeria&topic=business')}
        >
          <span className="feed-news-ticker__fx-cur">1 {item.symbol}</span>
          <span className="feed-news-ticker__fx-eq">=</span>
          <span className="feed-news-ticker__fx-val">
            ₦{item.rate.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="feed-news-ticker__dot" aria-hidden>•</span>
        </button>
      );
    }
    return (
      <button
        key={key}
        type="button"
        className="feed-news-ticker__item"
        onClick={() => router.push('/local-news?tab=nigeria')}
      >
        <span>{item.text}</span>
        <span className="feed-news-ticker__dot" aria-hidden>•</span>
      </button>
    );
  };

  return (
    <div
      className="feed-news-ticker"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      role="marquee"
      aria-label="Local news and exchange rates"
    >
      <div className="feed-news-ticker__label" aria-hidden>
        <span className="material-symbols-outlined feed-news-ticker__label-icon">bolt</span>
        <span>PULSE</span>
      </div>

      <div className="feed-news-ticker__viewport">
        <div
          ref={trackRef}
          className={`feed-news-ticker__track${paused ? ' feed-news-ticker__track--paused' : ''}`}
        >
          {items.map((it, i) => renderItem(it, i))}
          {/* Duplicate for seamless loop */}
          {items.map((it, i) => renderItem(it, i + items.length))}
        </div>
      </div>
    </div>
  );
}
