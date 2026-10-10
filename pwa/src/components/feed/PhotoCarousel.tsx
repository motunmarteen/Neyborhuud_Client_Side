'use client';

/**
 * PhotoCarousel — post photos, one at a time.
 *
 * - Swipe left/right (native scroll-snap, works with any finger speed)
 * - Moves to the next photo by itself every few seconds, but only while the
 *   card is on screen, the tab is visible, and the phone is not asking for
 *   reduced motion or data saving. Any touch stops it for good, so the viewer
 *   can slide back and look properly.
 * - Indicator: the current photo is a long pill that fills up while it waits
 *   (like stories); the others are dots.
 * - Tap a photo to open it full screen: swipe between photos, pinch to zoom,
 *   "2 / 5", close with ✕ or Escape.
 * - Videos play with their own controls and never auto-advance.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type CarouselItem = { url: string; type?: string; thumbnailUrl?: string };

const AUTO_MS = 4000;

const isVideo = (m: CarouselItem) => m.type === 'video' || /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(m.url);

function prefersCalm(): boolean {
  if (typeof window === 'undefined') return true;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return Boolean(reduce || saveData);
}

/** Pill-and-dots indicator from the owner's reference. */
function Indicator({ count, active, progressKey, running, onPick }: { count: number; active: number; progressKey: number; running: boolean; onPick: (i: number) => void }) {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-sm" role="tablist" aria-label="Photos">
      {Array.from({ length: count }, (_, i) =>
        i === active ? (
          <span key={i} role="tab" aria-selected="true" aria-label={`Photo ${i + 1} of ${count}`} className="relative h-1.5 w-6 overflow-hidden rounded-full bg-white/45">
            <span
              key={progressKey}
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={
                running
                  ? { width: '0%', animation: `nh-carousel-fill ${AUTO_MS}ms linear forwards` }
                  : { width: '100%' }
              }
            />
          </span>
        ) : (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected="false"
            aria-label={`Show photo ${i + 1} of ${count}`}
            onClick={(e) => {
              e.stopPropagation();
              onPick(i);
            }}
            className="h-1.5 w-1.5 rounded-full bg-white/55"
          />
        ),
      )}
    </div>
  );
}

function Lightbox({ items, start, onClose }: { items: CarouselItem[]; start: number; onClose: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: start * el.clientWidth, behavior: 'instant' as ScrollBehavior });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') el?.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') el?.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [start, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Photos">
      <div className="flex items-center justify-between px-3 pt-[max(12px,env(safe-area-inset-top))] text-white">
        <span className="text-sm font-bold tabular-nums" aria-live="polite">{index + 1} / {items.length}</span>
        <button type="button" onClick={onClose} aria-label="Close photos" autoFocus className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X size={22} />
        </button>
      </div>
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((m, i) => (
          <div key={m.url + i} className="flex h-full w-full shrink-0 snap-center items-center justify-center">
            {isVideo(m) ? (
              <video src={m.url} controls playsInline className="max-h-full max-w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={`Photo ${i + 1} of ${items.length}`} className="max-h-full max-w-full object-contain [touch-action:pan-x_pinch-zoom]" />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        {items.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45'}`} aria-hidden />
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function PhotoCarousel({ items, alt }: { items: CarouselItem[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [userTookOver, setUserTookOver] = useState(false);
  const [calm, setCalm] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [viewer, setViewer] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);

  const count = items.length;
  const current = items[index];
  const running = count > 1 && onScreen && tabVisible && !calm && !userTookOver && viewer === null && !!current && !isVideo(current);

  useEffect(() => setCalm(prefersCalm()), []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior) });
  }, []);

  // Auto-advance; the timer restarts whenever the photo changes.
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => goTo((index + 1) % count), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [running, index, count, goTo, cycle]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== index) {
      setIndex(i);
      setCycle((c) => c + 1);
    }
  };

  const takeOver = () => setUserTookOver(true);

  if (count === 0) return null;

  return (
    <div ref={rootRef} className="relative bg-background" aria-roledescription="carousel" aria-label={`${alt}${count > 1 ? `, ${count} photos` : ''}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={takeOver}
        onTouchStart={takeOver}
        onWheel={takeOver}
        className="flex aspect-[4/5] max-h-[540px] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((m, i) => (
          <div key={m.url + i} className="relative h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
            {isVideo(m) ? (
              <video src={m.url} poster={m.thumbnailUrl} controls playsInline muted preload="metadata" className="h-full w-full bg-black object-contain" />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserTookOver(true);
                  setViewer(i);
                }}
                className="block h-full w-full"
                aria-label={`Open photo ${i + 1} of ${count} full screen`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbnailUrl || m.url} alt="" loading={i === 0 ? 'eager' : 'lazy'} draggable={false} className="h-full w-full select-none object-cover" />
              </button>
            )}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
            {index + 1}/{count}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Indicator
              count={count}
              active={index}
              progressKey={index * 1000 + cycle}
              running={running}
              onPick={(i) => {
                setUserTookOver(true);
                goTo(i);
              }}
            />
          </div>
        </>
      ) : null}

      {viewer !== null ? <Lightbox items={items} start={viewer} onClose={() => setViewer(null)} /> : null}
    </div>
  );
}
