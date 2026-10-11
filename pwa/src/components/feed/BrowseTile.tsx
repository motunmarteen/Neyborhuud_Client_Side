'use client';

/**
 * BrowseTile — the two-per-row tile on the marketplace, jobs, services and events pages
 * (tracker F-13, owner decision 2026-10-11: browse pages stay a grid, in the post card's look).
 *
 * Same parts as PostCard: the type badge (here on the photo corner), the photo slider with
 * the pill-and-dots indicator, Chips, navy text, the big price. No auto-advance: a grid of
 * moving photos is noise. Tapping the photo or the text opens the item; the one icon button
 * (like / save / favourite) and the footer (Buy, Apply, I'm going) act in place.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';
import { Bookmark, Heart } from 'lucide-react';
import { PhotoDots } from '@/components/feed/PhotoCarousel';
import { KIND_BADGE, type PostKind } from '@/components/feed/PostCard';

export type BrowseTileAction = {
  icon: 'heart' | 'bookmark';
  /** e.g. "Save job" — the button's name for screen readers. */
  label: string;
  on: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type BrowseTileProps = {
  href: string;
  kind: PostKind;
  title: string;
  images?: string[];
  /** Shown instead of a photo, on the type's soft colour. */
  placeholder?: ReactNode;
  /** Big line under the title: price, salary, rate, date. */
  highlight?: ReactNode;
  /** Seller, employer, provider or venue. */
  byline?: ReactNode;
  chips?: ReactNode;
  /** Small grey line: distance, time, reviews, going. */
  meta?: ReactNode;
  /** Covers the photo: "Sold", "Closed", "Cancelled". Dims the tile. */
  status?: string;
  action?: BrowseTileAction;
  footer?: ReactNode;
  id?: string;
  onOpenIntent?: () => void;
};

function TilePhotos({ images, href, alt, dim }: { images: string[]; href: string; alt: string; dim: boolean }) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<number, true>>({});
  const shown = images.filter((_, i) => !broken[i]);
  const count = shown.length;

  if (count === 0) return null;

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <>
      <div
        ref={trackRef}
        onScroll={() => {
          const el = trackRef.current;
          if (el) setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
        aria-label={`${alt}${count > 1 ? `, ${count} photos` : ''}`}
      >
        {shown.map((url, i) => (
          <button
            key={url + i}
            type="button"
            tabIndex={-1}
            onClick={() => router.push(href)}
            className="h-full w-full shrink-0 snap-center"
            aria-label={`${alt}, photo ${i + 1} of ${count}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() => setBroken((b) => ({ ...b, [images.indexOf(url)]: true }))}
              className={`h-full w-full select-none object-cover ${dim ? 'opacity-60 grayscale-[0.4]' : ''}`}
            />
          </button>
        ))}
      </div>
      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <PhotoDots count={count} active={index} progressKey={index} running={false} onPick={goTo} />
        </div>
      ) : null}
    </>
  );
}

export function BrowseTile({
  href,
  kind,
  title,
  images = [],
  placeholder,
  highlight,
  byline,
  chips,
  meta,
  status,
  action,
  footer,
  id,
  onOpenIntent,
}: BrowseTileProps) {
  const badge = KIND_BADGE[kind];
  const photos = images.filter(Boolean);
  const ActionIcon = action?.icon === 'bookmark' ? Bookmark : Heart;
  const actionOnColor = action?.icon === 'bookmark' ? 'text-brand-green-dark' : 'text-brand-red';

  return (
    <article
      id={id}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]"
    >
      <div className={`relative aspect-square w-full overflow-hidden ${badge?.bg ?? 'bg-background'}`}>
        {photos.length > 0 ? (
          <TilePhotos images={photos} href={href} alt={title} dim={!!status} />
        ) : (
          <Link href={href} tabIndex={-1} aria-hidden className="grid h-full w-full place-items-center text-5xl" onMouseEnter={onOpenIntent}>
            {placeholder ?? badge?.icon}
          </Link>
        )}

        {badge && (photos.length > 0 || placeholder) ? (
          <span
            className={`pointer-events-none absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full text-sm ring-2 ring-white ${badge.bg}`}
            role="img"
            aria-label={badge.label}
          >
            {badge.icon}
          </span>
        ) : null}

        {status ? (
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            {status}
          </span>
        ) : null}

        {action ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onPress();
            }}
            disabled={action.disabled}
            aria-label={action.label}
            aria-pressed={action.on}
            className="tap-target absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy shadow-[0_2px_8px_rgba(29,36,51,0.18)] transition-transform motion-safe:active:scale-90 disabled:opacity-60"
          >
            <ActionIcon size={18} strokeWidth={2.2} className={action.on ? actionOnColor : ''} fill={action.on ? 'currentColor' : 'none'} />
          </button>
        ) : null}
      </div>

      <Link
        href={href}
        onMouseEnter={onOpenIntent}
        onFocus={onOpenIntent}
        className="flex flex-1 flex-col gap-1 px-3 pb-2 pt-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <h3 className="line-clamp-2 font-heading text-[15px] font-extrabold leading-snug text-navy">{title}</h3>
        {highlight ? <div className="font-heading text-[17px] font-black leading-tight text-navy">{highlight}</div> : null}
        {byline ? <p className="truncate text-xs font-semibold text-muted">{byline}</p> : null}
        {chips ? <div className="flex flex-wrap gap-1 pt-0.5">{chips}</div> : null}
        {meta ? <p className="mt-auto truncate pt-0.5 text-[11px] font-semibold text-faint">{meta}</p> : null}
      </Link>

      {footer ? <div className="px-3 pb-3">{footer}</div> : null}
    </article>
  );
}
