'use client';

/**
 * Map home card for visitors (mockup: "First-time visitor: look around, no sign-up wall").
 * Real numbers only: the neighbour count comes from the server and is left out when zero.
 */

import Link from 'next/link';

type Props = {
  /** "Egbeda, Alimosho" (owner 2026-10-17), or just the LGA. */
  area: string | null;
  /** Members are counted per LGA, so the count line names the LGA. */
  lga?: string | null;
  neighbours: number;
  joinHref: string;
  onTour: () => void;
  /** Shown when the map is not yet on an area. */
  onShowMyArea?: () => void;
  locating?: boolean;
};

export function VisitorWelcome({ area, lga, neighbours, joinHref, onTour, onShowMyArea, locating }: Props) {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-lg font-extrabold leading-tight text-navy">
          {area ? `Welcome to ${area} 👋🏾` : 'Welcome to NeyborHuud 👋🏾'}
        </h2>
        <p className="text-sm font-semibold text-muted">
          {area
            ? 'This na your area right now. Look around; no sign-up needed.'
            : 'See what is happening on streets across Nigeria. No sign-up needed.'}
        </p>
      </div>
      {area && neighbours > 0 ? (
        <p className="text-sm font-bold text-navy">
          {neighbours.toLocaleString('en-NG')} {neighbours === 1 ? 'neighbour' : 'neighbours'}{' '}
          <span className="font-semibold text-muted">already dey {lga ?? area}</span>
        </p>
      ) : area ? (
        <p className="text-sm font-semibold text-muted">Be one of the first neighbours in {lga ?? area}.</p>
      ) : null}
      {!area && onShowMyArea ? (
        <button
          type="button"
          onClick={onShowMyArea}
          disabled={locating}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-background text-[15px] font-bold text-navy disabled:opacity-60"
        >
          <span aria-hidden className="material-symbols-outlined text-[20px]">my_location</span>
          {locating ? 'Finding your area…' : 'Show my area'}
        </button>
      ) : null}
      <div className="flex flex-col gap-2">
        <Link
          href={joinHref}
          className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-primary px-4 text-[15px] font-bold text-white"
        >
          Join free · 30 seconds
        </Link>
        <button
          type="button"
          onClick={onTour}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-[15px] font-bold text-navy"
        >
          Show me around
        </button>
      </div>
      <p className="text-center text-xs font-semibold text-muted">
        Join to post, buy and sell, ask Sentinel and set up SOS for your family.
      </p>
    </>
  );
}
