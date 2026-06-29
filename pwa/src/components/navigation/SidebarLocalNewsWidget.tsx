'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { useSidebarLocalNews } from '@/hooks/useSidebarLocalNews';

const MARQUEE_PX_PER_SECOND = 22;
const MARQUEE_MIN_DURATION_SEC = 180;
const MARQUEE_MAX_DURATION_SEC = 480;
const MARQUEE_MAX_HEADLINES = 5;
const MARQUEE_MAX_TITLE_LEN = 64;

function trimHeadline(title: string) {
  const t = title.trim();
  if (t.length <= MARQUEE_MAX_TITLE_LEN) return t;
  return `${t.slice(0, MARQUEE_MAX_TITLE_LEN).trimEnd()}…`;
}

function LocalNewsMarquee({ headlines }: { headlines: string[] }) {
  const line = headlines
    .slice(0, MARQUEE_MAX_HEADLINES)
    .map(trimHeadline)
    .join('   ·   ');
  const trackRef = useRef<HTMLSpanElement>(null);
  const [durationSec, setDurationSec] = useState(MARQUEE_MIN_DURATION_SEC);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !line) return;

    const measure = () => {
      const halfWidth = track.scrollWidth / 2;
      const sec = halfWidth / MARQUEE_PX_PER_SECOND;
      setDurationSec(
        Math.min(MARQUEE_MAX_DURATION_SEC, Math.max(MARQUEE_MIN_DURATION_SEC, sec)),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [line]);

  return (
    <span
      className="left-sidebar__link-marquee"
      aria-live="polite"
      style={{ ['--marquee-duration' as string]: `${durationSec}s` }}
    >
      <span ref={trackRef} className="left-sidebar__link-marquee__track">
        <span className="left-sidebar__link-marquee__copy">{line}</span>
        <span className="left-sidebar__link-marquee__copy" aria-hidden>
          {line}
        </span>
      </span>
    </span>
  );
}

type SidebarLocalNewsWidgetProps = {
  onNavigate?: () => void;
};

export function SidebarLocalNewsWidget({ onNavigate }: SidebarLocalNewsWidgetProps) {
  const pathname = usePathname();
  const { headlines, loading } = useSidebarLocalNews();
  const active = pathname === '/local-news' || Boolean(pathname?.startsWith('/local-news/'));

  return (
    <li className="left-sidebar__nav-item">
      <Link
        href="/local-news"
        onClick={onNavigate}
        className={`left-sidebar__link${active ? ' left-sidebar__link--active' : ''}`}
      >
        <span className="left-sidebar__link-icon" aria-hidden>
          <span className={`material-symbols-outlined${active ? ' fill-1' : ''}`}>newspaper</span>
        </span>
        <span className="left-sidebar__link-text min-w-0 flex-1">
          <span className="left-sidebar__link-label block">Local News</span>
          {loading ? (
            <span className="left-sidebar__link-sub block animate-pulse">Loading headlines…</span>
          ) : headlines.length > 0 ? (
            <LocalNewsMarquee headlines={headlines} />
          ) : (
            <span className="left-sidebar__link-sub block truncate">Open for latest stories</span>
          )}
        </span>
      </Link>
    </li>
  );
}
