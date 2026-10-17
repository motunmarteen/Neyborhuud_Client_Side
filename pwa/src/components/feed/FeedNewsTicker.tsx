'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { usePulseNews } from '@/hooks/usePulseNews';
import { useExchangeRates } from '@/hooks/useExchangeRates';

type PulseItem =
  | { kind: 'news'; text: string }
  | { kind: 'fx'; currency: string; symbol: string; rate: number }
  | { kind: 'local'; text: string; href?: string };

/** Something from the person's own area for the front of the ribbon (weather now, go-slows). */
export type PulseLocalItem = { text: string; href?: string };

/** Scroll speed in px per second, the same however long the ribbon is. */
const SPEED_PX_S = 40;

const calmNow = () =>
  document.documentElement.hasAttribute('data-calm') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function FeedNewsTicker({ local = [], onOpen }: { local?: PulseLocalItem[]; onOpen?: () => void } = {}) {
  const articles = usePulseNews();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const held = useRef(false);
  const { rates } = useExchangeRates();
  // The ribbon only renders once there is something to show; start scrolling then.
  const hasContent = articles.length > 0 || rates.length > 0 || local.length > 0;

  /*
   * The scroll is driven from here (Web Animations), not by a CSS animation:
   *  - a fixed 350 s loop crawled at ~1 px/s when only a short weather line was there, so the
   *    ribbon looked frozen; now the speed is steady and the loop length follows the content;
   *  - it restarts when the content changes, when the app comes back to the front (phones
   *    freeze animations in the background) and when Calm view is switched off;
   *  - a finger only pauses it while pressing, so a tap can no longer leave it paused
   *    (phones fire "mouse enter" on tap and never "mouse leave").
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof track.animate !== 'function') return;
    const start = () => {
      const prev = anim.current;
      const progress = prev && prev.effect ? Number(prev.currentTime ?? 0) / Number(prev.effect.getTiming().duration || 1) : 0;
      prev?.cancel();
      anim.current = null;
      if (calmNow()) return;
      const half = track.scrollWidth / 2;
      if (half < 1) return;
      const duration = (half / SPEED_PX_S) * 1000;
      const a = track.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-half}px,0,0)` }], {
        duration,
        iterations: Infinity,
      });
      a.currentTime = (progress % 1) * duration;
      if (held.current) a.pause();
      anim.current = a;
    };
    start();
    const ro = new ResizeObserver(() => start());
    ro.observe(track);
    const onFront = () => {
      if (document.visibilityState === 'visible') start();
    };
    document.addEventListener('visibilitychange', onFront);
    window.addEventListener('pageshow', onFront);
    const calmWatch = new MutationObserver(() => start());
    calmWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-calm'] });
    return () => {
      ro.disconnect();
      calmWatch.disconnect();
      document.removeEventListener('visibilitychange', onFront);
      window.removeEventListener('pageshow', onFront);
      anim.current?.cancel();
      anim.current = null;
    };
  }, [hasContent]);

  const hold = (on: boolean) => {
    held.current = on;
    if (on) anim.current?.pause();
    else anim.current?.play();
  };


  const headlines = articles.map((a) => a.title).filter(Boolean);

  // Nothing to show yet
  if (headlines.length === 0 && rates.length === 0 && local.length === 0) return null;

  // Local first (weather, go-slows), then 3 headlines, then 1 FX rate, repeat
  const items: PulseItem[] = local.map((l) => ({ kind: 'local' as const, text: l.text, href: l.href }));
  let h = 0;
  let f = 0;
  const total = items.length + headlines.length + rates.length;
  while (items.length < total) {
    for (let k = 0; k < 3 && h < headlines.length; k++) {
      items.push({ kind: 'news', text: headlines[h++] });
    }
    if (rates.length > 0 && f < rates.length) {
      const r = rates[f++];
      items.push({ kind: 'fx', currency: r.currency, symbol: r.symbol, rate: r.rate });
    }
    if (f >= rates.length && h >= headlines.length) break;
  }

  const renderItem = (item: PulseItem, key: number): ReactNode => {
    if (item.kind === 'local') {
      return (
        <button
          key={key}
          type="button"
          className="feed-news-ticker__item"
          onClick={() => (item.href ? router.push(item.href) : undefined)}
        >
          <span className="font-extrabold">{item.text}</span>
          <span className="feed-news-ticker__dot" aria-hidden>•</span>
        </button>
      );
    }
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
      onPointerEnter={(e) => e.pointerType === 'mouse' && hold(true)}
      onPointerLeave={() => hold(false)}
      onPointerDown={() => hold(true)}
      onPointerUp={() => hold(false)}
      onPointerCancel={() => hold(false)}
      role="marquee"
      aria-label="Pulse: your area, news and exchange rates"
    >
      {/* Just the ⚡ (owner, 2026-10-17: no "PULSE" word). Tapping it opens Today's Pulse. */}
      {onOpen ? (
        <button type="button" className="feed-news-ticker__label" onClick={onOpen} aria-label="Open today's pulse">
          <Zap size={15} className="feed-news-ticker__label-icon text-primary fill-primary" aria-hidden />
        </button>
      ) : (
        <div className="feed-news-ticker__label" aria-hidden>
          <Zap size={15} className="feed-news-ticker__label-icon text-primary fill-primary" />
        </div>
      )}

      <div className="feed-news-ticker__viewport">
        <div ref={trackRef} className="feed-news-ticker__track">
          {items.map((it, i) => renderItem(it, i))}
          {/* Duplicate for seamless loop */}
          {items.map((it, i) => renderItem(it, i + items.length))}
        </div>
      </div>
    </div>
  );
}
