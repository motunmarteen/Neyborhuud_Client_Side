'use client';

/**
 * First-time tour of the map home (mockup: "three steps only"). A spotlight on one part of
 * the screen at a time, a card under or over it, Skip and Next. Shown once per phone, after
 * the opening swoop; it can be replayed from the ⋯ menu ("Show me around").
 *
 * Targets are found by data-tour="…" on the screen (chips, sos). The first step lights the
 * map itself, between the chips and the card.
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const DONE_KEY = 'nh_map_tour_done';

type Step = { target: 'map' | 'chips' | 'sos'; title: string; body: string };

const STEPS: Step[] = [
  {
    target: 'map',
    title: 'This na your street, live',
    body: 'The sky follows the real time and weather. Everything you see is happening around you now.',
  },
  {
    target: 'chips',
    title: 'Tap any pin to see wetin dey happen',
    body: 'Use the chips to show only safety, traffic, light, market, work, events or help.',
  },
  {
    target: 'sos',
    title: 'Danger? Use SOS',
    // Truthful (2026-10-17): tap opens SOS, long-press sends a silent alert; with no
    // network the alert waits and goes as soon as the phone is back online.
    body: 'Tap to open SOS, or press and hold to send a silent alert. Your guardians get your location. No network? It goes the moment you are back online.',
  },
];

type Rect = { x: number; y: number; w: number; h: number };

function rectFor(target: Step['target']): Rect | null {
  const pad = 6;
  const box = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
  };
  if (target !== 'map') return box(document.querySelector(`[data-tour="${target}"]`));
  // The map between the chips (top) and the SOS row (bottom).
  const top = document.querySelector('[data-tour="chips"]')?.getBoundingClientRect().bottom ?? 160;
  const bottom = document.querySelector('[data-tour="sos"]')?.getBoundingClientRect().top ?? window.innerHeight - 260;
  const y = top + 70;
  return { x: 10, y, w: window.innerWidth - 20, h: Math.max(140, bottom - y - 16) };
}

export function useMapTour(ready: boolean) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (!ready) return;
    let seen = true;
    try {
      seen = localStorage.getItem(DONE_KEY) === '1';
    } catch {
      /* private mode: show it */
      seen = false;
    }
    if (seen) return;
    // After the opening swoop has settled.
    const t = window.setTimeout(() => setStep(0), 5000);
    return () => window.clearTimeout(t);
  }, [ready]);
  const finish = useCallback(() => {
    setStep(-1);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);
  return { step, start: () => setStep(0), next: () => (step >= STEPS.length - 1 ? finish() : setStep(step + 1)), finish };
}

export function MapTour({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const [rect, setRect] = useState<Rect | null>(null);
  const s = STEPS[step];

  useLayoutEffect(() => {
    if (!s) return;
    const place = () => setRect(rectFor(s.target));
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [s]);

  useEffect(() => {
    if (!s) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s, onSkip]);

  if (!s || !rect) return null;
  const last = step === STEPS.length - 1;
  // Card below the spotlight when there is room, else above it.
  const below = rect.y + rect.h + 220 < window.innerHeight;
  const cardTop = below ? rect.y + rect.h + 14 : Math.max(16, rect.y - 14 - 210);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="nh-tour-title">
      {/* Spotlight: everything else dims. Taps outside do nothing (Skip ends the tour). */}
      <div
        className="pointer-events-none absolute rounded-3xl transition-all duration-300 motion-reduce:transition-none"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.58), 0 0 0 3px #00B82E',
        }}
        aria-hidden
      />
      <div
        className="absolute left-4 right-4 mx-auto flex max-w-sm flex-col gap-2 rounded-[22px] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
        style={{ top: cardTop }}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-green-dark">
          Step {step + 1} of {STEPS.length}
        </span>
        <h2 id="nh-tour-title" className="font-heading text-lg font-extrabold text-navy">
          {s.title}
        </h2>
        <p className="text-sm font-semibold text-muted">{s.body}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-12 flex-1 rounded-full border border-line bg-white text-[15px] font-bold text-navy"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="min-h-12 flex-1 rounded-full bg-primary text-[15px] font-bold text-white"
          >
            {last ? 'I don understand' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
